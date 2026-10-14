/**
 * @module dsh-keyboard-shortcut/effort-step
 *
 * Steps a session's reasoning effort one level up or down.
 *
 * ## Where the levels come from
 *
 * A model advertises its reasoning levels as an *array*
 * (`model.reasoning.efforts`), and that array order is the escalation order —
 * for the pi-ai adapter it is a subsequence of
 * `[off, minimal, low, medium, high, xhigh, max]`, filtered by which levels the
 * deployment declared for that model. Nothing downstream sorts or ranks it, and
 * DSH ships no notion of a numeric level or a step helper, so the array is the
 * only ordering that exists and stepping is this plugin's job.
 *
 * ## Reading and writing
 *
 * The selected model for a session is the `modelSelection` projection. The
 * richer surface — the catalog joined with the session's current selection —
 * is the shared per-session directory at `ctx.modelDirectories`, which is also
 * the writer that keeps the composer's model seat in sync. Using that shared
 * directory rather than calling the Remote directly means the shortcut and the
 * on-screen picker can never disagree.
 *
 * ## Clamping
 *
 * Steps clamp at both ends. Wrapping would be actively misleading at the top:
 * the next level past the maximum is usually `off`, so a wrap would silently
 * turn reasoning *off* when the user asked for more.
 */

/** Projection key carrying a session's model selection. */
const MODEL_SELECTION = 'modelSelection'

/**
 * Read a session's current model selection.
 *
 * `next` is the pending intent and `lastUsed` the last durable choice; `next`
 * wins so a rapid second keypress steps from what the first one asked for
 * rather than from the stale recorded value.
 *
 * @param ctx - The client plugin context.
 * @param sessionId - The session to read.
 * @returns The selection, or `undefined` when the session has none.
 */
export function readSelection(ctx, sessionId) {
  const binding = ctx.sessions.binding(sessionId)
  if (binding === undefined) return undefined
  const projection = binding.session.projections.faceOf(MODEL_SELECTION).getSnapshot()
  return projection?.next ?? projection?.lastUsed ?? undefined
}

/**
 * Resolve the reasoning levels a selection's model advertises.
 *
 * @param groups - Model catalog groups from the directory snapshot.
 * @param selection - The current model selection.
 * @returns The ordered levels and the model's default effort, or `undefined`
 * when the model exposes no reasoning control at all.
 */
function reasoningFor(groups, selection) {
  const model = groups
    .find((group) => group.id === selection.provider)
    ?.models.find((candidate) => candidate.id === selection.model)
  const reasoning = model?.reasoning
  if (reasoning === undefined || reasoning.efforts.length === 0) return undefined
  return reasoning
}

/**
 * Move a session's reasoning effort by one level.
 *
 * @param ctx - The client plugin context. Must carry `sessions` and
 * `modelDirectories`.
 * @param sessionId - The session to change.
 * @param delta - `+1` for more effort, `-1` for less.
 * @returns The applied level's display name.
 * @throws When the session has no selection, the model advertises no levels, or
 * the Host rejects the change.
 */
export async function stepEffort(ctx, sessionId, delta) {
  const selection = readSelection(ctx, sessionId)
  if (selection === undefined) throw new Error('this session has no model selection yet')

  const directory = ctx.modelDirectories.directoryFor(sessionId)
  await directory.load()
  const state = directory.store.getSnapshot()

  const reasoning = reasoningFor(state.groups ?? [], selection)
  if (reasoning === undefined) throw new Error('this model advertises no reasoning effort levels')

  const levels = reasoning.efforts
  const effective = selection.reasoningEffort ?? reasoning.defaultEffort
  const index = levels.findIndex((level) => level.id === effective)

  // An unrecognised level means the selection is riding the provider's own
  // default, which sits below the first advertised level. Increasing therefore
  // establishes a concrete level; decreasing is already as low as it goes.
  if (index === -1) {
    if (delta < 0) {
      const error = new Error('already at the lowest reasoning effort')
      error.code = 'effort-at-bottom'
      throw error
    }
  }

  const from = index === -1 ? -1 : index
  const to = Math.min(Math.max(from + delta, 0), levels.length - 1)
  if (to === index) {
    const limit = delta > 0 ? 'top' : 'bottom'
    const error = new Error(`already at the ${limit} reasoning effort`)
    error.code = limit === 'top' ? 'effort-at-top' : 'effort-at-bottom'
    throw error
  }

  const target = levels[to]
  if (target === undefined) throw new Error('this model advertises no reasoning effort levels')

  const result = await directory.select({
    provider: selection.provider,
    model: selection.model,
    reasoningEffort: target.id
  })
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return target.name
}

export { MODEL_SELECTION }
