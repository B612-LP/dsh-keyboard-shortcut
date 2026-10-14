/**
 * @module dsh-keyboard-shortcut/slots
 *
 * Small, defensive readers over DSH's slot ledger.
 *
 * `ctx.slots.entries(key)` publishes the raw registrations of a slot: each entry
 * carries the registrant's own `id`, `order`, and `label`, plus whatever store
 * handle the registrant passed as `store`. Those are the only registration
 * fields DSH stores, so they are also the only handles an outside plugin has for
 * reaching a slot owner's internals.
 *
 * Every reader here returns `undefined` rather than throwing when the ledger is
 * shaped differently than expected. A plugin that reads another plugin's
 * registration must degrade to "feature unavailable", never to a broken GUI.
 */

/**
 * Read one slot's entries.
 *
 * @param ctx - The client plugin context.
 * @param key - Slot key.
 * @returns The entries, or an empty array when the ledger is unavailable.
 */
export function entries(ctx, key) {
  try {
    const value = ctx.slots?.entries?.(key)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

/**
 * Find the registration of one section id.
 *
 * @param ctx - The client plugin context.
 * @param key - Slot key, for example `sidebar.settings`.
 * @param id - Section id to match. Omit to take the first entry.
 * @returns The matching entry, or `undefined`.
 */
export function findSectionEntry(ctx, key, id) {
  const all = entries(ctx, key)
  if (id === undefined) return all[0]
  return all.find((entry) => entry?.options?.id === id)
}

/**
 * Read the current index of one registered entry inside its slot's order.
 *
 * DSH sorts a list slot by `priority`, then `order`, and renders in that
 * sequence. Reproducing that sort here lets a reader address a row positionally
 * — which is what locating a navigation row needs, because the shell renders no
 * identifier into the DOM.
 *
 * @param ctx - The client plugin context.
 * @param key - Slot key.
 * @param id - Section id to locate.
 * @returns The zero-based index, or `undefined` when the entry is absent.
 */
export function sectionIndex(ctx, key, id) {
  const all = entries(ctx, key)
  if (all.length === 0) return undefined
  const sorted = [...all].sort((left, right) => {
    const byPriority = (left?.options?.priority ?? 0) - (right?.options?.priority ?? 0)
    if (byPriority !== 0) return byPriority
    return (left?.options?.order ?? 0) - (right?.options?.order ?? 0)
  })
  const at = sorted.findIndex((entry) => entry?.options?.id === id)
  return at === -1 ? undefined : at
}

/**
 * Resolve a registration's label to plain text.
 *
 * A slot label may be a string or a thunk, and DSH re-reads thunks on every
 * projection so localized text follows the active language. Readers that need
 * text rather than a rendered element must do the same.
 *
 * @param label - The registration's label, or `undefined`.
 * @returns The current text, or an empty string.
 */
export function labelText(label) {
  try {
    const value = typeof label === 'function' ? label() : label
    return typeof value === 'string' ? value : ''
  } catch {
    return ''
  }
}
