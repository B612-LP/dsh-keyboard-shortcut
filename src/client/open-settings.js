/**
 * @module dsh-keyboard-shortcut/open-settings
 *
 * Opens this plugin's Settings page, and points <kbd>Ctrl</kbd>+<kbd>/</kbd> at it.
 *
 * ## Opening a specific Settings page
 *
 * DSH's Settings shell owns the panel's open state and its selected section.
 * Two interfaces exist and neither is sufficient on its own:
 *
 * - the `settings.launcher` slot receives `openSettings()`, which opens the
 *   panel but leaves the section to the shell's own memory; and
 * - `settings.onboarding` receives `openSection(id)`, but only for a registrant
 *   that is a first-run step.
 *
 * What *is* reachable is the shell's own store handle, which the shell passes
 * as the `store` option of its `sidebar.settings` registration and which the
 * slot ledger publishes through `ctx.slots.entries('sidebar.settings')`. The
 * shell pins that handle's `create()` to the one live instance, so calling it
 * from here yields the same store the panel is rendering, and its
 * `openSection(id)` action is exactly the operation needed.
 *
 * That is an internal shape rather than a contract, so the module treats it as
 * a fast path: when the handle is missing or shaped differently it falls back
 * to clicking the panel's own navigation row. A future DSH that publishes
 * `openSection` on the launcher slot props should use that instead.
 *
 * ## Pointing Ctrl+/ here
 *
 * The built-in shortcut reference registers `shortcuts.open` with
 * <kbd>Ctrl</kbd>+<kbd>/</kbd> as its default on every device profile. Two
 * commands cannot both default to one combination — the registry rejects the
 * second registration — and a command's `resolve` is owned by whoever
 * registered it, so the built-in cannot be redirected in place.
 *
 * The supported way to move a binding is the preference layer, which is what
 * the shipped shortcut editor itself writes. This module therefore:
 *
 * 1. clears `shortcuts.open`'s binding with an explicit `null` override, then
 * 2. gives this plugin's command the same combination with an explicit
 *    override.
 *
 * Both steps are ordinary user-level overrides: they appear in the shortcut
 * reference as customised rows, and "Restore default" on either row undoes
 * them. The order matters — binding this plugin's command first would be
 * rejected as a conflict — and each step re-reads the revision the previous one
 * produced.
 *
 * Nothing is written when the user has already customised `shortcuts.open`
 * themselves, and nothing is written when the plugin's own preference switch is
 * off; turning that switch off restores the built-in binding.
 */

import { findSectionEntry } from './slots.js'

/** Section id this plugin registers on `settings.section`. */
export const SECTION_ID = 'keyboard-shortcut'

/** Command id for "open the keyboard shortcut settings". */
export const OPEN_COMMAND_ID = 'keyboard-shortcut.open'

/** The built-in shortcut-reference command this plugin displaces. */
const BUILTIN_COMMAND_ID = 'shortcuts.open'

/** The combination both commands want, expressed with `primary`. */
const SHORTCUT_BINDING = { code: 'Slash', modifiers: ['primary'] }

/** Navigation row selector inside the Settings panel. */
const NAV_CELL_SELECTOR = '[class*="navCell"]'

/** Navigation label selector inside a row. */
const NAV_LABEL_SELECTOR = '[class*="navLabel"]'

/** Attempts allowed for one preference write before giving up. */
const WRITE_ATTEMPTS = 4

/** Frames allowed for the panel to render before the DOM fallback gives up. */
const PANEL_FRAME_BUDGET = 30

/**
 * Resolve the shell's live settings store, if it is reachable.
 *
 * @param ctx - The client plugin context.
 * @returns The store instance, or `undefined`.
 */
function settingsStore(ctx) {
  const entry = findSectionEntry(ctx, 'sidebar.settings')
  const handle = entry?.store
  if (handle === undefined || typeof handle.create !== 'function') return undefined
  try {
    const instance = handle.create()
    return typeof instance?.actions?.openSection === 'function' ? instance : undefined
  } catch {
    return undefined
  }
}

/**
 * Wait one animation frame.
 *
 * @param doc - Owning document.
 * @returns A promise resolving after the frame.
 */
function nextFrame(doc) {
  return new Promise((resolve) => {
    const view = doc.defaultView
    if (view === null || typeof view.requestAnimationFrame !== 'function') {
      setTimeout(resolve, 16)
      return
    }
    view.requestAnimationFrame(() => {
      resolve()
    })
  })
}

/**
 * Click this plugin's navigation row inside an open panel.
 *
 * @param doc - Owning document.
 * @param label - Current display text of the section.
 * @returns Whether the row was found and clicked.
 */
function clickNavRow(doc, label) {
  if (label === '') return false
  const panel = doc.querySelector('[data-shortcut-modal="settings"]')
  if (panel === null) return false
  const cells = [...panel.querySelectorAll(NAV_CELL_SELECTOR)]
  const target = cells.find((cell) => cell.querySelector(NAV_LABEL_SELECTOR)?.textContent?.trim() === label)
  if (target === undefined) return false
  target.click()
  return true
}

/**
 * Open the Settings panel on this plugin's page.
 *
 * @param ctx - The client plugin context.
 * @param label - Reads the section's current display text.
 * @returns A promise resolving once the attempt is complete. Failure is silent
 * by design: a shortcut that cannot reach its target must not throw into the
 * keyboard dispatcher.
 */
export async function openShortcutSection(ctx, label) {
  const store = settingsStore(ctx)
  if (store !== undefined) {
    store.actions.openSection(SECTION_ID)
    return true
  }

  // Fallback: drive the panel the way a user would. The panel may already be
  // open; if it is not, click the shell's trigger first.
  const doc = typeof document === 'undefined' ? undefined : document
  if (doc === undefined) return false
  if (clickNavRow(doc, label())) return true

  const trigger = [...doc.querySelectorAll('button[aria-haspopup="dialog"]')].find(
    (button) => button.closest('[data-shortcut-modal="settings"]') === null
  )
  if (trigger === undefined) return false
  trigger.click()
  for (let frame = 0; frame < PANEL_FRAME_BUDGET; frame += 1) {
    await nextFrame(doc)
    if (clickNavRow(doc, label())) return true
  }
  return false
}

/**
 * Read the shortcut catalog as a lookup by command id.
 *
 * @param ctx - The client plugin context.
 * @returns A map from command id to its projected row, or `undefined` when the
 * service is unavailable.
 */
function catalogById(ctx) {
  const rows = ctx.shortcuts?.catalog?.getSnapshot?.()
  if (!Array.isArray(rows)) return undefined
  return new Map(rows.map((row) => [row.id, row]))
}

/**
 * Test whether a row's effective binding is the combination this plugin wants.
 *
 * @param row - A catalog row, or `undefined`.
 * @returns Whether the row is bound to primary+Slash.
 */
function isWantedBinding(row) {
  const binding = row?.binding
  if (binding === undefined || binding === null) return false
  if (binding.code !== 'Slash') return false
  return binding.modifiers.length === 1 && ['control', 'meta'].includes(binding.modifiers[0])
}

/**
 * Apply one shortcut preference write, retrying a stale revision.
 *
 * @param ctx - The client plugin context.
 * @param edit - The `set` or `reset` operation.
 * @returns `'saved'`, or a classification describing why it did not save.
 */
async function writeShortcut(ctx, edit) {
  const shortcuts = ctx.shortcuts
  if (typeof shortcuts?.edit !== 'function') return 'unavailable'
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const snapshot = shortcuts.config.getSnapshot()
    if (snapshot.status === 'loading') {
      await new Promise((resolve) => setTimeout(resolve, 50))
      continue
    }
    if (snapshot.status === 'unreadable') return 'unreadable'
    const result = await shortcuts.edit(edit, snapshot.revision)
    if (result.status === 'saved') return 'saved'
    // `stale` means another writer moved the document; re-read and retry.
    if (result.status !== 'stale') return result.status
  }
  return 'stale'
}

/**
 * Reconcile Ctrl+/ with the plugin's preference.
 *
 * Idempotent, and safe to call on every preference change and on a timer: it
 * reads the effective bindings first and writes only what differs from the
 * wanted state.
 *
 * Outcomes:
 *
 * - `'done'` — the wanted state holds, with or without a write.
 * - `'skipped'` — the user has explicitly pinned the built-in command to this
 *   combination, so taking it would undo their decision.
 * - `'not-registered'`, `'unavailable'` — this plugin or the catalog is not
 *   ready yet; the caller should retry.
 * - any other classification — a write was refused, and the caller should
 *   surface it.
 *
 * @param ctx - The client plugin context.
 * @param enabled - Whether this plugin should own Ctrl+/.
 * @returns The outcome classification.
 */
export async function reconcileShortcutKey(ctx, enabled) {
  const rows = catalogById(ctx)
  if (rows === undefined) return 'unavailable'
  const mine = rows.get(OPEN_COMMAND_ID)
  const builtin = rows.get(BUILTIN_COMMAND_ID)
  if (mine === undefined) return 'not-registered'

  const mineIsBound = isWantedBinding(mine)
  const builtinHolds = isWantedBinding(builtin)

  if (!enabled) {
    if (mine.modified !== true && builtin?.modified !== true) return 'done'
    // Release this plugin's claim first: restoring the built-in while the
    // combination is still held would be refused as a conflict.
    const released = await writeShortcut(ctx, { type: 'reset', id: OPEN_COMMAND_ID })
    if (released !== 'saved') return released
    if (builtin?.modified === true) {
      const restored = await writeShortcut(ctx, { type: 'reset', id: BUILTIN_COMMAND_ID })
      if (restored !== 'saved') return restored
    }
    return 'done'
  }

  // Wanted state already holds, and nothing else is contesting the combination.
  if (mineIsBound && !builtinHolds) return 'done'

  // `modified` records that the stored document carries an override; it does not
  // say who wrote it. A *modified built-in that still holds this combination* is
  // one the user pinned there deliberately, so the takeover stands down. A
  // modified-but-unbound built-in is this plugin's own earlier step, and a
  // built-in the user moved *elsewhere* leaves this combination free, so both
  // continue.
  if (builtinHolds && builtin?.modified === true && !mineIsBound) return 'skipped'

  // Step 1 frees the combination; step 2 claims it. Reversing the order is
  // rejected as a conflict by the preference layer.
  if (builtinHolds) {
    const cleared = await writeShortcut(ctx, { type: 'set', id: BUILTIN_COMMAND_ID, binding: null })
    if (cleared !== 'saved') return cleared
  }
  if (!mineIsBound) {
    const claimed = await writeShortcut(ctx, { type: 'set', id: OPEN_COMMAND_ID, binding: SHORTCUT_BINDING })
    if (claimed !== 'saved') return claimed
  }
  return 'done'
}

export { BUILTIN_COMMAND_ID, SHORTCUT_BINDING }
