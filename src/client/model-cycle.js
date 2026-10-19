/**
 * @module dsh-keyboard-shortcut/model-cycle
 *
 * Cycles a session's model one entry forward, wrapping at the end.
 *
 * ## Where the order comes from
 *
 * The session model directory (`ctx.get('modelDirectories')`) is the same
 * shared surface the composer's model seat renders from: its snapshot carries
 * the joined catalog (`groups`, each provider with its models) and the
 * effective `current` selection. The cycle walks the models in the order the
 * picker displays them — the account provider first, then the official one,
 * then every other provider in catalog order, each with its models in catalog
 * order — so "next" from the keyboard matches "one row down" in the menu.
 *
 * ## Reading and writing
 *
 * The current selection is read exactly as `effort-step` reads it: the
 * `modelSelection` projection first (`next`, then `lastUsed`), then the
 * directory's `current`, which for a session before its first message is the
 * catalog default. The write goes through `directory.select`, the same verb
 * the picker uses, so the keyboard, the seat, and the next request can never
 * disagree.
 *
 * ## Reasoning effort across a switch
 *
 * A reasoning effort belongs to a model's own ladder, so carrying one across a
 * switch needs care: the current effort rides along only when the target model
 * advertises the same level id; otherwise the switch omits the effort and the
 * Host resolves the target model's own default. A blank session with no
 * selection at all starts the cycle from the first model with a fresh default.
 */

import { readSelection, reasoningFor } from './effort-step.js'

/**
 * Sort providers the way the composer's picker displays them.
 *
 * Mirrors the picker's own display order — the account provider first, the
 * official one second, everything else in catalog order — without importing
 * from DSH, which publishes no such helper for plugins.
 *
 * @param groups - Model catalog groups from the directory snapshot.
 * @returns The groups in display order (a stable reordered copy).
 */
function orderedGroups(groups) {
  const rank = (id) => (id === 'deepseek-account' ? 0 : id === 'deepseek-official' ? 1 : 2)
  return [...groups].sort((left, right) => rank(left.id) - rank(right.id))
}

/**
 * Flatten the catalog into the cycle's ordered model list.
 *
 * @param groups - Model catalog groups from the directory snapshot.
 * @returns One entry per model: its provider id and the catalog model object.
 */
function orderedModels(groups) {
  return orderedGroups(groups).flatMap((group) =>
    group.models.map((model) => ({ provider: group.id, model }))
  )
}

/**
 * Move a session to the next model in display order, wrapping to the first.
 *
 * @param ctx - The client plugin context. Must carry `sessions` and
 * `modelDirectories`.
 * @param sessionId - The session to change.
 * @returns The applied selection's display label: the model name, joined with
 * the applied effort's name when one was set explicitly.
 * @throws When the catalog lists no models, or the Host rejects the change.
 */
export async function cycleModel(ctx, sessionId) {
  const directories = ctx.get('modelDirectories')
  if (directories === undefined) throw new Error('the model directory is not available in this deployment')
  const directory = directories.directoryFor(sessionId)
  await directory.load()
  const state = directory.store.getSnapshot()

  const models = orderedModels(state.groups ?? [])
  if (models.length === 0) {
    const error = new Error('the catalog lists no models')
    error.code = 'model-none'
    throw error
  }
  if (models.length === 1) {
    const error = new Error('the catalog lists no other model to cycle to')
    error.code = 'model-none'
    throw error
  }

  // Same reading chain as the effort step: projection intent first, then the
  // directory's effective current, which covers a session before its first
  // message.
  const selection = readSelection(ctx, sessionId) ?? state.current ?? undefined
  const index =
    selection === undefined
      ? -1
      : models.findIndex((entry) => entry.provider === selection.provider && entry.model.id === selection.model)

  // An unlisted current selection (or none at all) simply starts the cycle at
  // the first model; a listed one advances and wraps at the end, which is the
  // point of a cycle.
  const target = models[(index + 1) % models.length]
  if (target === undefined) {
    const error = new Error('the catalog lists no models')
    error.code = 'model-none'
    throw error
  }

  // The current effort rides along only when the target model advertises the
  // same level; otherwise the switch falls back to the target's own default,
  // and a model with no reasoning control omits the effort entirely.
  const currentReasoning = selection === undefined ? undefined : reasoningFor(state.groups ?? [], selection)
  const currentEffort = selection?.reasoningEffort ?? currentReasoning?.defaultEffort
  const targetReasoning = target.model.reasoning
  const effort =
    targetReasoning === undefined || targetReasoning.efforts.length === 0
      ? undefined
      : currentEffort !== undefined && targetReasoning.efforts.some((level) => level.id === currentEffort)
        ? currentEffort
        : targetReasoning.defaultEffort

  const result = await directory.select({
    provider: target.provider,
    model: target.model.id,
    ...(effort === undefined ? {} : { reasoningEffort: effort })
  })
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)

  const effortName =
    effort === undefined ? undefined : targetReasoning.efforts.find((level) => level.id === effort)?.name ?? effort
  return effortName === undefined ? target.model.name : `${target.model.name} · ${effortName}`
}
