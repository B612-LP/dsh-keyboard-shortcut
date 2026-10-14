/**
 * @module dsh-keyboard-shortcut/composer-keys
 *
 * Remaps the composer's Enter gestures when the input-optimisation option is on.
 *
 * ## What the stock composer does
 *
 * DSH's composer owns a Lexical keymap. Its Enter command reads the event's
 * modifier flags and branches:
 *
 * | Stroke | Meaning in stock DSH |
 * |---|---|
 * | `Enter` | Send — Queue while the agent is busy, Steer when steered |
 * | `Ctrl`/`Cmd` + `Enter` | The *complementary* Queue/Steer action |
 * | `Shift` + `Enter` | Line break |
 *
 * The option rotates those three roles:
 *
 * | Stroke | Meaning with the option on |
 * |---|---|
 * | `Enter` | Line break |
 * | `Ctrl`/`Cmd` + `Enter` | Send |
 * | `Shift` + `Enter` | The complementary Queue/Steer action |
 *
 * ## How the remap works, and why it is only a property rewrite
 *
 * The composer's keymap is private to `dsh-client-ui-conversation`, and the
 * command that owns Enter is registered on the Lexical editor instance, which
 * no outside plugin can reach. What that handler *does* read, however, is the
 * event's own modifier flags. So this module does not intercept the action — it
 * rewrites the three readable flags on the event in place, in the capture
 * phase, and then lets the event continue untouched.
 *
 * That matters for the line-break case. The command returns "not handled" for
 * a shifted Enter, which hands the stroke back to the browser; because the
 * original event is still the real, trusted one, the browser's own default
 * action inserts the line break. A module that swallowed the key and
 * synthesised its own replacement could not reproduce that — untrusted events
 * have no default action — so the line break would have to be faked through a
 * `beforeinput` event or `execCommand`, both of which fight the editor instead
 * of using it.
 *
 * Rewriting is confined to one event object and skips the three keys DSH's
 * own shortcut layer reads for *fixed* actions, which are display-only rows
 * that take no action. It never calls `preventDefault` or `stopPropagation`.
 *
 * ## When the remap stands down
 *
 * The rewrite is skipped, leaving stock behaviour, whenever the stroke does not
 * belong to the composer or its meaning is already owned by something else:
 *
 * - the option is off;
 * - the event is not a bare Enter keydown;
 * - the event is inside IME composition;
 * - the target is not the composer editor;
 * - the target sits inside an inert subtree;
 * - a slash/mention menu is open, in which case Enter picks the highlighted
 *   candidate and DSH's arbitration must see the untouched stroke;
 * - the stroke carries `Alt`, or `Ctrl` together with `Meta`, both of which the
 *   stock command already maps to "consume and do nothing".
 *
 * ## Known limitation
 *
 * If a future DSH moves the Enter decision out of a DOM event — an accelerator
 * registered with the desktop keyboard bridge, for instance — the flags this
 * module rewrites would no longer be the input the composer reads, and the
 * option would stop having an effect. The module detects nothing and breaks
 * nothing in that case; it simply stops mattering.
 */

/** The composer's editable root, written by `dsh-client-ui-conversation`. */
const COMPOSER_SELECTOR = '[data-composer-input]'

/** The slash/mention menu surface; while it is open, Enter picks a candidate. */
const MENU_SELECTOR = '[data-trigger-menu]'

/**
 * Modifier flags this module rewrites.
 *
 * All three are accessor properties inherited from `KeyboardEvent.prototype`,
 * so an own property defined on the instance shadows them for every reader
 * while leaving the browser's own notion of the pressed keys alone — which is
 * exactly what the line-break case needs.
 */
const FLAGS = ['shiftKey', 'ctrlKey', 'metaKey']

/**
 * Apply a modifier rewrite and verify it took.
 *
 * `Object.defineProperty` is the whole mechanism, so a host that made these
 * properties non-extensible would silently leave the stroke stock. The offsets
 * are read back and the attempt is reported, so an ineffective rewrite is
 * treated as "stand down" rather than as a half-applied state.
 *
 * @param event - The keyboard event to rewrite.
 * @param next - Flags to set.
 * @returns Whether every flag now reads as requested.
 */
function applyFlags(event, next) {
  for (const flag of FLAGS) {
    try {
      Object.defineProperty(event, flag, {
        value: next[flag] ?? false,
        configurable: true,
        enumerable: true,
        writable: true
      })
    } catch {
      return false
    }
  }
  return FLAGS.every((flag) => event[flag] === (next[flag] ?? false))
}

/**
 * Decide the rewrite for one stroke.
 *
 * @param event - The Enter keydown.
 * @returns Flags to apply, or `undefined` to leave the stroke alone.
 */
function rewriteFor(event) {
  const { altKey, ctrlKey, metaKey, shiftKey } = event

  // The stock command consumes Alt and Ctrl+Meta combinations without doing
  // anything; there is no gesture to rotate, so leave them.
  if (altKey || (ctrlKey && metaKey)) return undefined

  if (ctrlKey || metaKey) {
    // Send: present an unmodified Enter so the command takes its "send" branch.
    return { shiftKey: false, ctrlKey: false, metaKey: false }
  }
  if (shiftKey) {
    // Complementary Queue/Steer: the command reads Ctrl as the accelerated
    // gesture, so present one.
    return { shiftKey: false, ctrlKey: true, metaKey: false }
  }
  // Line break: return "not handled" by presenting a shifted Enter, which hands
  // the stroke back to the browser for its own insertion.
  return { shiftKey: true, ctrlKey: false, metaKey: false }
}

/**
 * Test whether a stroke belongs to the composer editor.
 *
 * The element must be the composer's editable root, and it must actually be
 * editable: DSH renders the same `data-composer-input` attribute for the
 * workspace-picker and inert states, where the editor is detached and the
 * element carries `contenteditable="false"`.
 *
 * @param event - The keydown.
 * @returns Whether the composed path runs through the editable composer.
 */
function isComposerEvent(event) {
  for (const node of event.composedPath()) {
    if (!(node instanceof Element)) continue
    if (node.closest('[inert]') !== null) return false
    if (!node.matches(COMPOSER_SELECTOR)) continue
    const editable = node.getAttribute('contenteditable')
    return editable === 'true' || editable === ''
  }
  return false
}

/**
 * Test whether the slash or mention menu is open.
 *
 * While it is open, Enter settles the highlighted candidate and DSH arbitrates
 * the stroke itself, so the flags must reach it unchanged.
 *
 * @param doc - Owning document.
 * @returns Whether a trigger menu is mounted.
 */
function isMenuOpen(doc) {
  return doc.querySelector(MENU_SELECTOR) !== null
}

/**
 * Install the composer key remap.
 *
 * The listener is registered on `window` in the capture phase, which runs
 * before the composer's own handler, and it never stops propagation — it
 * rewrites flags and lets the event travel on.
 *
 * @param doc - Owning document.
 * @param isEnabled - Reads whether the input-optimisation option is on. Called
 * per keystroke so toggling the option takes effect without reinstalling.
 * @returns A disposer removing the listener.
 */
export function installComposerKeys(doc, isEnabled) {
  const view = doc.defaultView
  if (view === null) return () => {}

  /**
   * Rewrite one Enter stroke, or leave it untouched.
   *
   * @param event - The keydown.
   * @returns Nothing.
   */
  const onKeyDown = (event) => {
    if (!isEnabled()) return
    if (event.key !== 'Enter' || event.code !== 'Enter') return
    // IME composition owns every key until it settles; the composer also treats
    // a just-finished composition as protected.
    if (event.isComposing || event.keyCode === 229) return
    if (event.defaultPrevented) return
    if (!isComposerEvent(event)) return
    if (isMenuOpen(doc)) return

    const next = rewriteFor(event)
    if (next === undefined) return
    applyFlags(event, next)
  }

  view.addEventListener('keydown', onKeyDown, true)
  return () => {
    view.removeEventListener('keydown', onKeyDown, true)
  }
}

export { COMPOSER_SELECTOR, MENU_SELECTOR, rewriteFor, applyFlags }
