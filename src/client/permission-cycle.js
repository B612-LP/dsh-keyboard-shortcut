/**
 * @module dsh-keyboard-shortcut/permission-cycle
 *
 * Cycles the active session's permission mode.
 *
 * ## Why the mode list is read, never hardcoded
 *
 * DSH's permission modes are *preset keys* from the Host plugin's `presets`
 * configuration table, not a closed enum. The shipped bundles happen to define
 * `read-only`, `workspace-write`, and `danger-full-access`, which makes the set
 * look fixed, but the table is deployment data: a profile may rename, add, or
 * remove entries, and `dsh-permission-presets` additionally publishes a
 * reserved `auto` entry while an Auto-review integration is mounted. This
 * module therefore reads the live catalog on every activation and steps through
 * whatever it advertises.
 *
 * ## The three surfaces involved
 *
 * | Fact | Source |
 * |---|---|
 * | Available modes | `ctx.get('remote.permissionPresets').catalog()` |
 * | Whether that list changed | `ctx.get('remote').$on('permission-presets/catalog-changed')` |
 * | Current mode of one session | the session's `permissions` projection |
 * | Applying a mode | `session.command('/permission <preset>')` |
 *
 * There is no client-side setter: `set()` exists only on the Host service, and
 * the shipped picker applies a mode by running the Host's slash command, which
 * is what this module does too.
 */

/**
 * Remote namespace name, as it appears under `ctx.remote`.
 *
 * The full service name is `remote.permissionPresets`: the gateway registers
 * every Remote namespace as a Cordis service named `remote.<namespace>`, so it
 * must be resolved with `ctx.get` rather than read off the `remote` service.
 * Reading it as a property of `remote` is rewritten by Cordis into the service
 * look-up `remote.permissionPresets`, which fails for a plugin whose `inject`
 * list does not declare it.
 */
const PERMISSION_REMOTE = 'permissionPresets'

/** Fully qualified Cordis service name of the permission namespace. */
const PERMISSION_SERVICE = `remote.${PERMISSION_REMOTE}`

/** Forwarded event that invalidates the catalog. */
const CATALOG_CHANGED = 'permission-presets/catalog-changed'

/** Projection key carrying a session's current mode. */
const PERMISSION_PROJECTION = 'permissions'

/**
 * Reserved id used when a session's knobs match no available preset.
 *
 * It is a legitimate *current* value but never a valid switch target, so a
 * cycle that starts here advances to the first real option.
 */
const CUSTOM = 'custom'

/**
 * A permission catalog entry.
 *
 * @typedef {object} PermissionOption
 * @property {string} value - Preset key, the value to switch to.
 * @property {string} name - Host-supplied display name.
 * @property {string} [description] - Optional Host-supplied description.
 */

/**
 * Read the current mode of a session.
 *
 * @param session - A `ClientSession` face, or `undefined`.
 * @returns The preset key, `custom`, or `undefined` when the capability is
 * absent for this session.
 */
export function readPermissionMode(session) {
  if (session === undefined) return undefined
  return session.projections.faceOf(PERMISSION_PROJECTION).getSnapshot()?.currentValue
}

/**
 * Create a reader that keeps the permission catalog current.
 *
 * The reader subscribes to the invalidation event *before* its first read. The
 * event is payload-free — it says "re-read", not what changed — so a
 * notification that lands during the initial fetch would otherwise be lost and
 * the reader would keep serving a stale list.
 *
 * A deployment without the Remote namespace yields a reader that always reports
 * "unavailable" instead of throwing: the permission command is optional, and a
 * plugin that needs it must not be able to fail its own activation over it.
 *
 * @param ctx - The client plugin context. Both `remote` and
 * `remote.permissionPresets` are read defensively through `ctx.get`.
 * @returns A reader with `load()` (latest-wins, never throws), `get()` (cached
 * options or `undefined`), and `dispose()`.
 */
export function createPermissionCatalog(ctx) {
  let options
  let failure
  let epoch = 0
  let disposed = false

  /** Resolve the Remote namespace service, or `undefined`. */
  const namespace = () => {
    try {
      return ctx.get?.(PERMISSION_SERVICE)
    } catch {
      return undefined
    }
  }

  /** Latest-wins read. A superseded response is discarded. */
  const load = async () => {
    const remote = namespace()
    if (typeof remote?.catalog !== 'function') {
      failure = new Error('the permission catalog is not available in this deployment')
      return options
    }
    const mine = ++epoch
    try {
      const result = await remote.catalog()
      if (disposed || mine !== epoch) return options
      if (!result.ok) {
        failure = new Error(`${result.error.code}: ${result.error.message}`)
        return options
      }
      failure = undefined
      options = result.value.options.map((option) => ({ ...option }))
      return options
    } catch (error) {
      if (!disposed && mine === epoch) failure = error
      return options
    }
  }

  // Subscribe before the first read, so an invalidation that lands mid-fetch is
  // not lost. An absent Remote means there is nothing to keep current.
  let off
  try {
    off = ctx.get?.('remote')?.$on?.(CATALOG_CHANGED, () => {
      void load()
    })
  } catch {
    off = undefined
  }
  void load()

  return {
    load,
    get: () => options,
    failure: () => failure,
    dispose: () => {
      disposed = true
      off?.()
    }
  }
}

/**
 * Advance a session to the next available permission mode.
 *
 * The cycle wraps. A session sitting on an unlisted value — `custom`, or a
 * preset that the Host has since removed — advances to the first option rather
 * than stalling.
 *
 * @param ctx - The client plugin context.
 * @param catalog - A reader from {@link createPermissionCatalog}.
 * @param session - The `ClientSession` to switch.
 * @returns The applied preset key.
 * @throws When no mode list is available, the list is empty, or the Host
 * rejects the switch.
 */
export async function cyclePermissionMode(ctx, catalog, session) {
  const options = catalog.get() ?? (await catalog.load())
  if (options === undefined) {
    throw catalog.failure() ?? new Error('the permission catalog has no complete value')
  }
  if (options.length === 0) throw new Error('no permission modes are available')

  const current = readPermissionMode(session)
  const at = options.findIndex((option) => option.value === current)
  const next = options[(at + 1) % options.length]
  if (next === undefined) throw new Error('the permission catalog advertised no usable option')

  // The Host command is the only client-side write path. Note that `command()`
  // reports whether the command *matched*, not whether the preset was valid, so
  // the target is validated against the catalog above instead of relying on the
  // result.
  const result = await session.command(`/permission ${next.value}`)
  if (!result.ok) {
    throw new Error(`permission switch failed: ${result.error.code}: ${result.error.message}`)
  }
  if (!result.value.matched) throw new Error('the Host offers no /permission command')
  return next
}

/**
 * Find the display name for a preset key.
 *
 * @param catalog - A reader from {@link createPermissionCatalog}.
 * @param value - The preset key.
 * @returns The Host-supplied name, or the key itself as a fallback.
 */
export function permissionLabel(catalog, value) {
  return catalog.get()?.find((option) => option.value === value)?.name ?? value
}

export { CUSTOM as PERMISSION_CUSTOM, PERMISSION_PROJECTION }
