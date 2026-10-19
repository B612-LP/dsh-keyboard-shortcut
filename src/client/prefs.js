/**
 * @module dsh-keyboard-shortcut/prefs
 *
 * This plugin's own preferences.
 *
 * ## Why browser storage rather than the Host settings document
 *
 * DSH's usual home for a feature preference is the Host settings document,
 * reached through `ctx.configForms.get(entryId)`. That works when the owning
 * package has a Host row carrying a configuration schema, because the schema is
 * what the Host serves and what the settings mirror projects.
 *
 * This plugin's Host half is deliberately empty (`src/host/index.js`): every
 * behaviour here is a property of *this browser's* keyboard, and key bindings
 * themselves already live in device-local storage rather than the Host document
 * (`localStorage` on Web, Electron's `userData/keybindings.json` on Desktop).
 * Keeping the two switches beside the bindings they affect means one device's
 * choice cannot rewrite another's, and it keeps the Host half a true no-op.
 *
 * ## Consequences, stated plainly
 *
 * - The preference is **per device and per origin**, like the key bindings
 *   themselves. Opening the GUI from a different port or host is a different
 *   origin for Web storage.
 * - A profile reset that clears site data resets these switches to their
 *   defaults.
 *
 * Both switches default to *off*, so a fresh install changes nothing until the
 * user asks for it.
 */

/** Storage key, versioned so a future shape change cannot misread old data. */
export const STORAGE_KEY = 'dsh.keyboard-shortcut.v1'

/**
 * Preference shape and defaults.
 *
 * Entries are plain booleans or strings. Adding a field is a minor version
 * change; changing a field's meaning requires a new {@link STORAGE_KEY}.
 */
export const DEFAULTS = Object.freeze({
  /** Rotate the composer's Enter gestures. See `composer-keys.js`. */
  optimizeComposerKeys: false,
  /** Give Ctrl+/ to this plugin's Settings page. See `open-settings.js`. */
  takeOverShortcutKey: true,
  /**
   * Restrict the model cycle to models whose id, name, or provider contains
   * one of these comma-separated texts. Empty cycles every model. See
   * `model-cycle.js`.
   */
  cycleModels: ''
})

/**
 * A minimal observable store.
 *
 * Deliberately not `@deepseek-ai/dsh-client-store`: this store is read through
 * React's `useSyncExternalStore` in the settings page and by plain key handlers
 * elsewhere, so all it needs is a stable snapshot identity plus subscribe.
 *
 * @typedef {object} PrefsStore
 * @property {() => object} getSnapshot - Current values. Identity is stable
 * until a change, as `useSyncExternalStore` requires.
 * @property {(listener: () => void) => () => void} subscribe - Observe changes.
 * @property {(key: string, value: boolean | string) => void} set - Write one preference.
 * @property {(event: StorageEvent) => void} adopt - Fold another tab's write.
 */

/**
 * Read the stored document, falling back to defaults.
 *
 * A malformed or unreadable document is treated as "no stored document" rather
 * than as an error: a preference store must not be able to stop the GUI from
 * working.
 *
 * @param storage - A `Storage`-like object, or `undefined`.
 * @returns The resolved values.
 */
export function readPrefs(storage) {
  if (storage === undefined) return { ...DEFAULTS }
  let raw
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { ...DEFAULTS }
  }
  if (raw === null) return { ...DEFAULTS }

  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULTS }
    }
    const resolved = { ...DEFAULTS }
    for (const key of Object.keys(DEFAULTS)) {
      if (typeof parsed[key] === typeof DEFAULTS[key]) resolved[key] = parsed[key]
    }
    return resolved
  } catch {
    return { ...DEFAULTS }
  }
}

/**
 * Create the preference store.
 *
 * @param storage - A `Storage`-like object, or `undefined` when unavailable.
 * In that case the store still works, but values are process-local.
 * @returns A {@link PrefsStore}.
 */
export function createPrefs(storage) {
  let value = readPrefs(storage)
  const listeners = new Set()

  const publish = (next) => {
    value = next
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-keyboard-shortcut] preference listener failed', error)
      }
    }
  }

  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    set: (key, next) => {
      if (!(key in DEFAULTS)) throw new Error(`unknown preference: ${key}`)
      if (value[key] === next) return
      const updated = { ...value, [key]: next }
      publish(updated)
      if (storage === undefined) return
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        // Storage can refuse writes (quota, privacy mode). The in-memory value
        // is already published, so the session keeps working; only durability
        // is lost.
        console.warn('[dsh-keyboard-shortcut] preference was not persisted', error)
      }
    },
    adopt: (event) => {
      if (event.key !== STORAGE_KEY) return
      publish(readPrefs(storage))
    }
  }
}
