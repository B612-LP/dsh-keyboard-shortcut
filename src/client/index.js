/**
 * @module dsh-keyboard-shortcut/client
 *
 * Browser half of `dsh-keyboard-shortcut`.
 *
 * This module is the plugin's composition root: it owns the preference store,
 * the permission catalog reader, the notice surface, and every registration the
 * plugin contributes. The behaviour itself lives in the sibling modules, each of
 * which documents the DSH interface it depends on and what it does when that
 * interface is absent.
 *
 * ## What it contributes
 *
 * | Contribution | Seat |
 * |---|---|
 * | Keyboard Shortcuts page | `settings.section` |
 * | Keyboard glyph on its navigation row | DOM patch, see `nav-icon.js` |
 * | Transient action feedback | `shell.overlay` |
 * | Open-settings command | `ctx.shortcuts.register` |
 * | Permission-cycle command | `ctx.shortcuts.register` |
 * | Reasoning-effort commands | `ctx.shortcuts.register` |
 * | Model-cycle command | `ctx.shortcuts.register`, see `model-cycle.js` |
 * | Status-page command | `ctx.shortcuts.register`, see `status-page.js` |
 * | Task-list command | `ctx.shortcuts.register`, see `todo-toggle.js` |
 * | Previous/next input | `observeFixedInput` only — see `NAV_KEYS` |
 * | Composer Enter remap | capture-phase `keydown`, see `composer-keys.js` |
 *
 * ## Dependency policy
 *
 * The Cordis `inject` list is kept to the three services this plugin cannot work
 * without. Everything else — sessions, the model directory, the permission
 * Remote — is reached through `ctx.get` at the moment it is needed, and each
 * command reports "unavailable" when its dependency is absent. That keeps the
 * plugin loading in reduced compositions (a deployment with no model selector,
 * no permission presets, or no turn navigator) instead of leaving a pending
 * fiber that never resolves.
 *
 * Command registration is individually guarded: a binding conflict with another
 * plugin logs a warning and skips that one command rather than failing the whole
 * plugin, because a conflicting default is a deployment fact, not a bug in this
 * package.
 *
 * ## Failure policy
 *
 * Nothing here throws into the keyboard dispatcher. An action that cannot run
 * shows a notice or stays silent; a page that cannot render still mounts.
 */

import { NS, en, zh } from './locales.js'
import { installNavIcon } from './nav-icon.js'
import { keyboardIconSvg } from './icons.js'
import { createPrefs } from './prefs.js'
import { createNotices, createNoticeOverlay } from './notices.js'
import { installComposerKeys } from './composer-keys.js'
import { createPermissionCatalog, cyclePermissionMode, permissionLabel } from './permission-cycle.js'
import { stepEffort } from './effort-step.js'
import { cycleModel } from './model-cycle.js'
import { navigateInput } from './prompt-nav.js'
import { openStatusPage } from './status-page.js'
import { toggleTodoList } from './todo-toggle.js'
import { createSettingsPage } from './settings-page.js'
import { sectionIndex } from './slots.js'
import { openShortcutSection, reconcileShortcutKey, OPEN_COMMAND_ID, SECTION_ID } from './open-settings.js'

/** Cordis services this plugin requires before it can mount. */
export const inject = ['slots', 'locale', 'shortcuts']

/** Where the page sits among the shipped Settings sections. */
const SECTION_ORDER = 5

/** Command ids this plugin owns and therefore offers for rebinding. */
const OWNED_COMMANDS = [
  OPEN_COMMAND_ID,
  'keyboard-shortcut.cycle-permission',
  'keyboard-shortcut.effort-up',
  'keyboard-shortcut.effort-down',
  'keyboard-shortcut.cycle-model',
  'keyboard-shortcut.status-page',
  'keyboard-shortcut.toggle-todos'
]

/**
 * Ctrl+Q on the two Device profiles that admit it.
 *
 * `bindingIssue` rejects a `primary` chord on `KeyQ` as reserved everywhere
 * except Desktop Windows and Desktop macOS, which short-circuit the check
 * entirely. Declaring the default only for those profiles keeps registration
 * from throwing on Web and Desktop Linux; an omitted profile is simply unbound,
 * and the user can still assign it from the page.
 *
 * `control` is written literally rather than as `primary` so macOS gets
 * <kbd>Ctrl</kbd>+<kbd>Q</kbd> and not <kbd>Cmd</kbd>+<kbd>Q</kbd>, which would
 * be the system quit shortcut.
 */
const PERMISSION_DEFAULTS = {
  'desktop:windows': { code: 'KeyQ', modifiers: ['control'] },
  'desktop:macos': { code: 'KeyQ', modifiers: ['control'] }
}

/**
 * Ctrl+1 / Ctrl+2 for reasoning effort.
 *
 * Desktop only: on Web a one-modifier digit chord is not an admitted browser
 * combination, and browsers claim Ctrl+1…Ctrl+8 for tab switching regardless.
 * `Ctrl+2` raises the level and `Ctrl+1` lowers it, matching the reading order
 * of the levels themselves.
 */
const EFFORT_DOWN_DEFAULTS = {
  'desktop:windows': { code: 'Digit1', modifiers: ['control'] },
  'desktop:macos': { code: 'Digit1', modifiers: ['control'] },
  'desktop:linux': { code: 'Digit1', modifiers: ['control'] }
}

const EFFORT_UP_DEFAULTS = {
  'desktop:windows': { code: 'Digit2', modifiers: ['control'] },
  'desktop:macos': { code: 'Digit2', modifiers: ['control'] },
  'desktop:linux': { code: 'Digit2', modifiers: ['control'] }
}

/**
 * Ctrl+3 cycles the model.
 *
 * Desktop only, for the same reasons as the effort digits: a one-modifier
 * digit chord is not in the Web allowlist and browsers claim the low digits
 * for tab switching. The command keeps the digit row together — one press
 * steps to the next model in the picker's display order and wraps at the end.
 */
const MODEL_CYCLE_DEFAULTS = {
  'desktop:windows': { code: 'Digit3', modifiers: ['control'] },
  'desktop:macos': { code: 'Digit3', modifiers: ['control'] },
  'desktop:linux': { code: 'Digit3', modifiers: ['control'] }
}

/**
 * Alt+A opens the DeepSeek status page in the right sidebar.
 *
 * Desktop only, and for two independent reasons. On Web the combination fails
 * the browser allowlist — a single non-primary modifier is not an admitted
 * chord there — and `KeyA` with the primary modifier is reserved by the
 * reservation table, so the shortcut could not be declared as <kbd>Ctrl</kbd>+A
 * instead. On Desktop Windows and macOS the reservation check short-circuits
 * entirely, and on Desktop Linux two modifiers including the primary one clear
 * it, so the same declaration is accepted on all three.
 *
 * `alt` is written literally: <kbd>Alt</kbd>+A is what the shortcut is, and the
 * alias `primary` would silently become <kbd>Cmd</kbd>+A on macOS.
 */
const STATUS_DEFAULTS = {
  'desktop:windows': { code: 'KeyA', modifiers: ['alt'] },
  'desktop:macos': { code: 'KeyA', modifiers: ['alt'] },
  'desktop:linux': { code: 'KeyA', modifiers: ['alt'] }
}

/**
 * Ctrl+L expands or collapses the task list.
 *
 * Desktop only: <kbd>Ctrl</kbd>+L is not an admitted browser combination, and a
 * browser owns it for "focus the address bar" anyway. `control` is written
 * literally rather than as `primary`, matching the rest of this plugin, so
 * macOS gets <kbd>Ctrl</kbd>+<kbd>L</kbd> rather than the
 * <kbd>Cmd</kbd>+<kbd>L</kbd> the browser and the application both claim.
 */
const TODO_DEFAULTS = {
  'desktop:windows': { code: 'KeyL', modifiers: ['control'] },
  'desktop:macos': { code: 'KeyL', modifiers: ['control'] },
  'desktop:linux': { code: 'KeyL', modifiers: ['control'] }
}

/**
 * Page keys for prompt navigation.
 *
 * These are deliberately *not* registered as fixed actions. The shortcut
 * registry validates every declared code against a closed whitelist — the
 * patterned `Key*`, `Digit*`, and `F1`–`F24`, plus a fixed set of named keys
 * that does **not** include `PageUp` or `PageDown`. `registerFixed` normalizes
 * each binding up front and throws `Unsupported shortcut code: PageUp`, so a
 * registration here can never succeed.
 *
 * Navigation therefore rides on `observeFixedInput` alone, which is an
 * independent listener set: the keyboard layer forwards every keydown to it
 * whether or not a matching command was ever registered. The keys still work;
 * they simply have no catalog row, which is why the settings page lists them
 * from this table instead of from the shortcut catalog.
 */
const NAV_KEYS = [
  { id: 'nav.keyboard-shortcut.previous', code: 'PageUp', cap: 'PgUp', labelKey: 'command.previousInput' },
  { id: 'nav.keyboard-shortcut.next', code: 'PageDown', cap: 'PgDn', labelKey: 'command.nextInput' }
]

/** Attempts allowed for the startup Ctrl+/ reconciliation. */
const RECONCILE_ATTEMPTS = 20

/** Delay between startup reconciliation attempts, in milliseconds. */
const RECONCILE_DELAY_MS = 250

/**
 * Resolve the session whose composer the user is working in.
 *
 * The main-view binding is authoritative: `ctx.uiSession.adapter.current`
 * publishes the session the shell is showing, which is the one a global key
 * should act on. When that source is absent the first retained binding is used
 * so the shortcuts still work in a single-session composition.
 *
 * @param ctx - The client plugin context.
 * @returns A session id, or `undefined`.
 */
function activeSessionId(ctx) {
  const current = ctx.get('uiSession')?.adapter?.current?.getSnapshot?.()
  if (typeof current?.key === 'string') return current.key

  const sessions = ctx.get('sessions')
  const list = sessions?.list?.getSnapshot?.()
  const ids = list?.byId === undefined ? [] : Object.keys(list.byId)
  return ids[0]
}

/**
 * Resolve a session's live client face.
 *
 * @param ctx - The client plugin context.
 * @param sessionId - The session id.
 * @returns The `ClientSession`, or `undefined`.
 */
function sessionFace(ctx, sessionId) {
  if (sessionId === undefined) return undefined
  return ctx.get('sessions')?.binding?.(sessionId)?.session
}

/**
 * Mount the browser half.
 *
 * @param ctx - The client plugin context.
 * @returns Nothing.
 */
export function apply(ctx) {
  const doc = typeof document === 'undefined' ? undefined : document

  // ── Copy ──────────────────────────────────────────────────────────────────
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'keyboard-shortcut: dictionaries')
  const t = ctx.locale.bind(NS)
  const sectionLabel = () => t('nav.title')

  /**
   * Report a recoverable problem.
   *
   * Prefers the Cordis logger, which routes into the Host's log with the plugin
   * attributed; falls back to the console for a context that carries none.
   *
   * @param message - What happened.
   * @param error - Optional cause.
   * @returns Nothing.
   */
  const warn = (message, error) => {
    if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(message, error)
    else console.warn(`[dsh-keyboard-shortcut] ${message}`, error)
  }

  // ── Preferences ───────────────────────────────────────────────────────────
  const prefs = createPrefs(safeStorage())
  if (typeof window !== 'undefined') {
    const onStorage = (event) => {
      prefs.adopt(event)
    }
    window.addEventListener('storage', onStorage)
    ctx.effect(
      () => () => {
        window.removeEventListener('storage', onStorage)
      },
      'keyboard-shortcut: cross-tab preferences'
    )
  }

  // ── Notices ───────────────────────────────────────────────────────────────
  const notices = createNotices()
  ctx.effect(() => () => {
    notices.dispose()
  }, 'keyboard-shortcut: notices')
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      { name: 'shell.overlay', id: 'keyboard-shortcut-notices', order: 100 },
      createNoticeOverlay(notices)
    )
  )

  // ── Permission catalog ────────────────────────────────────────────────────
  const permissionCatalog = createPermissionCatalog(ctx)
  ctx.effect(() => () => {
    permissionCatalog.dispose()
  }, 'keyboard-shortcut: permission catalog')

  /**
   * Report an action failure without throwing into the dispatcher.
   *
   * @param error - The thrown value.
   * @param fallbackKey - Locale key used when the error has no useful message.
   * @returns Nothing.
   */
  const report = (error, fallbackKey) => {
    if (fallbackKey !== undefined && error?.code === 'effort-at-top') {
      notices.show(t('toast.effortAtTop'))
      return
    }
    if (fallbackKey !== undefined && error?.code === 'effort-at-bottom') {
      notices.show(t('toast.effortAtBottom'))
      return
    }
    if (fallbackKey !== undefined && error?.code === 'model-none') {
      notices.show(t('toast.modelNone'))
      return
    }
    console.error('[dsh-keyboard-shortcut]', error)
    if (fallbackKey !== undefined) notices.show(t(fallbackKey))
  }

  const currentSessionId = () => activeSessionId(ctx)
  // ── Commands ──────────────────────────────────────────────────────────────
  /**
   * Register one command, tolerating a conflict with another plugin.
   *
   * A conflicting default is a deployment fact, not a bug in this package: it
   * means another mounted plugin already claims that combination. Skipping the
   * one command keeps every other contribution available.
   *
   * @param command - The command definition.
   * @returns Nothing.
   */
  const register = (command) => {
    try {
      ctx.effect(() => ctx.shortcuts.register(command), `keyboard-shortcut: ${command.id}`)
    } catch (error) {
      warn(`command "${command.id}" was not registered`, error)
    }
  }

  register({
    id: OPEN_COMMAND_ID,
    label: () => t('command.openSettings'),
    aliases: ['keyboard shortcuts', 'keybindings', 'hotkeys'],
    // No default: the built-in `shortcuts.open` already owns Ctrl+/. The
    // binding is claimed through the preference layer instead, so this command
    // does not make registration throw.
    defaults: {},
    regions: ['page', 'editable', 'terminal'],
    modals: [],
    resolve: () => ({
      status: 'handled',
      run: () => {
        void openShortcutSection(ctx, sectionLabel).catch((error) => {
          warn('could not open the shortcut settings', error)
        })
      }
    })
  })

  register({
    id: 'keyboard-shortcut.cycle-permission',
    label: () => t('command.cyclePermission'),
    aliases: ['permission', 'sandbox', 'approval'],
    defaults: PERMISSION_DEFAULTS,
    regions: ['page', 'editable'],
    modals: [],
    resolve: () => {
      const sessionId = currentSessionId()
      const session = sessionFace(ctx, sessionId)
      if (session === undefined) {
        return { status: 'blocked', reason: t('toast.noSession') }
      }
      return {
        status: 'handled',
        run: () => {
          void cyclePermissionMode(ctx, permissionCatalog, session).then(
            (mode) => {
              notices.show(t('toast.permission', { name: permissionLabel(permissionCatalog, mode.value) }))
            },
            (error) => {
              report(error, 'toast.permissionUnavailable')
            }
          )
        }
      }
    }
  })

  /**
   * Build a reasoning-effort command.
   *
   * @param id - Command id.
   * @param delta - `+1` for more effort, `-1` for less.
   * @param defaults - Per-profile default bindings.
   * @param labelKey - Locale key for the command label.
   * @param toastKey - Locale key for the success notice.
   * @returns The command definition.
   */
  const effortCommand = (id, delta, defaults, labelKey, toastKey) => ({
    id,
    label: () => t(labelKey),
    aliases: ['reasoning effort', 'thinking level'],
    defaults,
    regions: ['page', 'editable'],
    modals: [],
    resolve: () => {
      const sessionId = currentSessionId()
      const sessions = ctx.get('sessions')
      if (sessionId === undefined || sessions?.binding?.(sessionId) === undefined) {
        return { status: 'blocked', reason: t('toast.noSession') }
      }
      // Addressed subagent sessions cannot change their own model; their
      // selection belongs to the parent.
      if (sessions.subagentAddress?.(sessionId) !== undefined) {
        return { status: 'blocked', reason: t('toast.effortUnavailable') }
      }
      if (ctx.get('modelDirectories') === undefined) {
        return { status: 'blocked', reason: t('toast.effortUnavailable') }
      }
      return {
        status: 'handled',
        run: () => {
          void stepEffort(ctx, sessionId, delta).then(
            (name) => {
              notices.show(t(toastKey, { name }))
            },
            (error) => {
              report(error, 'toast.effortUnavailable')
            }
          )
        }
      }
    }
  })

  register(
    effortCommand(
      'keyboard-shortcut.effort-down',
      -1,
      EFFORT_DOWN_DEFAULTS,
      'command.effortDown',
      'toast.effortDown'
    )
  )
  register(
    effortCommand('keyboard-shortcut.effort-up', 1, EFFORT_UP_DEFAULTS, 'command.effortUp', 'toast.effortUp')
  )

  register({
    id: 'keyboard-shortcut.cycle-model',
    label: () => t('command.cycleModel'),
    aliases: ['switch model', 'cycle model', 'next model'],
    defaults: MODEL_CYCLE_DEFAULTS,
    regions: ['page', 'editable'],
    modals: [],
    resolve: () => {
      const sessionId = currentSessionId()
      const sessions = ctx.get('sessions')
      if (sessionId === undefined || sessions?.binding?.(sessionId) === undefined) {
        return { status: 'blocked', reason: t('toast.noSession') }
      }
      // Addressed subagent sessions cannot change their own model; their
      // selection belongs to the parent.
      if (sessions.subagentAddress?.(sessionId) !== undefined) {
        return { status: 'blocked', reason: t('toast.modelUnavailable') }
      }
      if (ctx.get('modelDirectories') === undefined) {
        return { status: 'blocked', reason: t('toast.modelUnavailable') }
      }
      return {
        status: 'handled',
        run: () => {
          void cycleModel(ctx, sessionId).then(
            (name) => {
              notices.show(t('toast.model', { name }))
            },
            (error) => {
              report(error, 'toast.modelUnavailable')
            }
          )
        }
      }
    }
  })

  register({
    id: 'keyboard-shortcut.status-page',
    label: () => t('command.statusPage'),
    aliases: ['status', 'deepseek status', 'service status'],
    defaults: STATUS_DEFAULTS,
    regions: ['page', 'editable'],
    modals: [],
    resolve: () => {
      // `sidebarRight` is a reflect-provided service, not an injected one: it is
      // read with `ctx.get` at the moment the key is pressed, so the plugin still
      // loads in a composition whose sidebar was never mounted.
      const sidebar = ctx.get('sidebarRight')
      if (sidebar === undefined) {
        return { status: 'blocked', reason: t('toast.sidebarUnavailable') }
      }
      return {
        status: 'handled',
        run: () => {
          try {
            const outcome = openStatusPage(sidebar)
            if (outcome === 'no-sidebar') notices.show(t('toast.sidebarUnavailable'))
            else if (outcome === 'no-session') notices.show(t('toast.noSession'))
          } catch (error) {
            report(error, 'toast.sidebarUnavailable')
          }
        }
      }
    }
  })

  register({
    id: 'keyboard-shortcut.toggle-todos',
    label: () => t('command.toggleTodos'),
    aliases: ['todo', 'task list', 'checklist'],
    defaults: TODO_DEFAULTS,
    regions: ['page', 'editable'],
    modals: [],
    resolve: () => {
      // The panel only exists while the session has a task list, and the list is
      // drawn in the composer region, so a blocked resolution here would be a
      // lie: the key is accepted and the run reports whether there was a list.
      if (doc === undefined) return { status: 'blocked', reason: t('toast.todoUnavailable') }
      return {
        status: 'handled',
        run: () => {
          try {
            if (toggleTodoList(doc) === 'unavailable') notices.show(t('toast.todoUnavailable'))
          } catch (error) {
            report(error, 'toast.todoUnavailable')
          }
        }
      }
    }
  })

  // ── Prompt navigation ─────────────────────────────────────────────────────
  // Page Up and Page Down carry no modifier and cannot be published as fixed
  // actions (see NAV_KEYS), so there is nothing to register: the keys are read
  // straight off the raw input stream. `observeFixedInput` delivers every
  // keydown regardless of registration, which is what makes this work.
  ctx.effect(
    () =>
      ctx.shortcuts.observeFixedInput((input) => {
        if (input.type !== 'keydown') return
        const { gesture, context } = input
        if (gesture.composing || gesture.defaultPrevented) return
        if (gesture.alt || gesture.control || gesture.meta || gesture.shift) return
        if (gesture.code !== 'PageUp' && gesture.code !== 'PageDown') return
        // A modal owns the keyboard, and a terminal owns Page Up/Down for its own
        // scrollback.
        if (context.modal !== null) return
        if (context.region === 'terminal') return
        if (doc === undefined) return

        input.consume()
        const delta = gesture.code === 'PageUp' ? -1 : 1
        void navigateInput(doc, delta).then(
          (outcome) => {
            if (outcome === 'edge') {
              notices.show(t('toast.navAtEdge', { direction: t(delta < 0 ? 'toast.previous' : 'toast.next') }))
            } else if (outcome === 'unavailable') {
              notices.show(t('toast.navUnavailable'))
            }
          },
          (error) => {
            report(error, 'toast.navUnavailable')
          }
        )
      }),
    'keyboard-shortcut: prompt navigation'
  )

  // ── Composer keys ─────────────────────────────────────────────────────────
  if (doc !== undefined) {
    ctx.effect(
      () => installComposerKeys(doc, () => prefs.getSnapshot().optimizeComposerKeys === true),
      'keyboard-shortcut: composer keys'
    )
  }

  // ── Settings page ─────────────────────────────────────────────────────────
  const service = createService(ctx, prefs, t, notices, warn)

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: SECTION_ID,
        order: SECTION_ORDER,
        label: sectionLabel,
        locale: NS
      },
      createSettingsPage(service)
    )
  )

  // ── Navigation glyph ──────────────────────────────────────────────────────
  if (doc !== undefined) {
    ctx.effect(
      () =>
        installNavIcon(
          { id: SECTION_ID, label: sectionLabel, renderSvg: () => keyboardIconSvg() },
          () => sectionIndex(ctx, 'settings.section', SECTION_ID)
        ),
      'keyboard-shortcut: settings navigation icon'
    )
  }

  // ── Ctrl+/ ────────────────────────────────────────────────────────────────
  let wanted = prefs.getSnapshot().takeOverShortcutKey === true
  ctx.effect(
    () =>
      prefs.subscribe(() => {
        const next = prefs.getSnapshot().takeOverShortcutKey === true
        if (next === wanted) return
        wanted = next
        void reconcileShortcutKey(ctx, next)
      }),
    'keyboard-shortcut: shortcut ownership'
  )

  /**
   * Retry the startup reconciliation until both commands are in the catalog.
   *
   * The built-in `shortcuts.open` is registered by another plugin, and the
   * catalog only populates once the shortcut service has read its
   * configuration, so neither may exist at the moment this plugin mounts.
   *
   * @param attempt - Attempts already spent.
   * @returns Nothing.
   */
  const reconcileWhenReady = (attempt) => {
    void reconcileShortcutKey(ctx, wanted).then((outcome) => {
      if (outcome === 'done' || outcome === 'skipped') return
      if (attempt >= RECONCILE_ATTEMPTS) {
        if (outcome !== 'not-registered') {
          warn(`Ctrl+/ was left with its built-in binding (${outcome})`)
        }
        return
      }
      setTimeout(() => {
        reconcileWhenReady(attempt + 1)
      }, RECONCILE_DELAY_MS)
    })
  }
  if (wanted) reconcileWhenReady(0)
}

/**
 * Build the faces the settings page renders from.
 *
 * @param ctx - The client plugin context.
 * @param prefs - The preference store.
 * @param t - The plugin's locale reader.
 * @param notices - The notice store.
 * @param warn - The plugin's warning reporter.
 * @returns The service object consumed by `createSettingsPage`.
 */
function createService(ctx, prefs, t, notices, warn) {
  return {
    /** Command ids editable from the page. */
    ownedCommandIds: new Set(OWNED_COMMANDS),

    /**
     * Fixed keys this plugin handles outside the shortcut registry.
     *
     * They have no catalog row — the registry cannot hold their codes — so the
     * page reads them from here. They are shown as reference rows because a
     * binding that cannot be registered cannot be rebound either.
     *
     * @returns One entry per fixed key, localized at read time.
     */
    fixedKeys: () =>
      NAV_KEYS.map((key) => ({
        id: key.id,
        label: t(key.labelKey),
        keys: [key.cap],
        hint: t('row.fixedHint')
      })),

    getCatalog: () => ctx.shortcuts.catalog.getSnapshot(),
    subscribeCatalog: (listener) => ctx.shortcuts.catalog.subscribe(listener),

    getPrefs: () => prefs.getSnapshot(),
    subscribePrefs: (listener) => prefs.subscribe(listener),
    setPref: (key, value) => {
      prefs.set(key, value)
    },

    describeBinding: (binding) => ctx.shortcuts.describeBinding(binding),

    /**
     * Persist one binding change.
     *
     * @param id - Command id.
     * @param binding - The new binding, or the string `'reset'` to restore the
     * command's own default.
     * @returns `'saved'` or a failure classification.
     */
    saveBinding: async (id, binding) => {
      const snapshot = ctx.shortcuts.config.getSnapshot()
      if (snapshot.status === 'unreadable') return 'unreadable'
      const edit =
        binding === 'reset' ? { type: 'reset', id } : { type: 'set', id, binding }
      const result = await ctx.shortcuts.edit(edit, snapshot.revision)
      if (result.status !== 'saved') {
        notices.show(t(result.status === 'conflict' ? 'status.failed' : 'status.failed'))
      }
      return result.status
    },

    /**
     * Suspend or resume the shortcut service's own interception.
     *
     * @param active - Whether a recorder is open.
     * @returns Nothing.
     */
    setRecording: async (active) => {
      try {
        await ctx.shortcuts.recording(active)
      } catch (error) {
        warn('could not change recording state', error)
      }
    }
  }
}

/**
 * Reach Web storage without throwing in a locked-down context.
 *
 * Privacy modes and sandboxed frames can throw on property access itself, so the
 * accessor is guarded rather than the use.
 *
 * @returns A `Storage`, or `undefined`.
 */
function safeStorage() {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}
