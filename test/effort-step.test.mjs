/**
 * Unit tests for reasoning-effort stepping.
 *
 * The branching that matters is at the ends of the ladder and when the current
 * level is unrecognised. Clamping is a deliberate choice over wrapping, so these
 * tests pin that choice: a regression to wrapping would silently turn reasoning
 * *off* when the user asked for more, because the level past the maximum is
 * usually `off`.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { stepEffort } from '../src/client/effort-step.js'

/**
 * Build a client context around one model's reasoning ladder.
 *
 * @param options - Ladder and selection.
 * @param options.efforts - Advertised levels, in escalation order.
 * @param options.defaultEffort - The model's own default level.
 * @param options.reasoningEffort - The session's currently selected level.
 * @param options.noReasoning - When true, the model advertises no levels.
 * @returns The context plus a record of what `select` was called with.
 */
function contextFor(options = {}) {
  const calls = []
  const selection = {
    provider: 'p',
    model: 'm',
    ...options.reasoningEffort === undefined ? {} : { reasoningEffort: options.reasoningEffort }
  }
  const model = {
    id: 'm',
    ...options.noReasoning === true
      ? {}
      : {
          reasoning: {
            efforts: (options.efforts ?? [{ id: 'low' }, { id: 'high' }]).map((level) => ({
              id: level.id,
              name: level.id.toUpperCase()
            })),
            ...options.defaultEffort === undefined ? {} : { defaultEffort: options.defaultEffort }
          }
        }
  }
  const directory = {
    load: async () => {},
    store: { getSnapshot: () => ({ groups: [{ id: 'p', models: [model] }] }) },
    select: async (next) => {
      calls.push(next)
      return { ok: true, value: undefined }
    }
  }
  const ctx = {
    sessions: {
      binding: () => ({ session: { projections: { faceOf: () => ({ getSnapshot: () => ({ next: selection }) }) } } })
    },
    modelDirectories: { directoryFor: () => directory }
  }
  return { ctx, calls }
}

describe('stepEffort', () => {
  it('raises one level', async () => {
    const { ctx, calls } = contextFor({ reasoningEffort: 'low' })
    assert.equal(await stepEffort(ctx, 's1', 1), 'HIGH')
    assert.deepEqual(calls, [{ provider: 'p', model: 'm', reasoningEffort: 'high' }])
  })

  it('lowers one level', async () => {
    const { ctx, calls } = contextFor({
      efforts: [{ id: 'low' }, { id: 'medium' }, { id: 'high' }],
      reasoningEffort: 'high'
    })
    assert.equal(await stepEffort(ctx, 's1', -1), 'MEDIUM')
    assert.equal(calls[0].reasoningEffort, 'medium')
  })

  it('clamps at the top instead of wrapping', async () => {
    const { ctx, calls } = contextFor({ reasoningEffort: 'high' })
    await assert.rejects(() => stepEffort(ctx, 's1', 1), (error) => {
      assert.equal(error.code, 'effort-at-top')
      return true
    })
    assert.deepEqual(calls, [], 'a clamped step must not write')
  })

  it('clamps at the bottom instead of wrapping', async () => {
    const { ctx, calls } = contextFor({ reasoningEffort: 'low' })
    await assert.rejects(() => stepEffort(ctx, 's1', -1), (error) => {
      assert.equal(error.code, 'effort-at-bottom')
      return true
    })
    assert.deepEqual(calls, [], 'a clamped step must not write')
  })

  it('treats an unrecognised level as below the first one when raising', async () => {
    // The selection rides the provider default, which is not an advertised id.
    const { ctx, calls } = contextFor({ reasoningEffort: 'provider-magic' })
    assert.equal(await stepEffort(ctx, 's1', 1), 'LOW')
    assert.equal(calls[0].reasoningEffort, 'low')
  })

  it('reports the bottom when lowering from an unrecognised level', async () => {
    const { ctx, calls } = contextFor({ reasoningEffort: 'provider-magic' })
    await assert.rejects(() => stepEffort(ctx, 's1', -1), (error) => {
      assert.equal(error.code, 'effort-at-bottom')
      return true
    })
    assert.deepEqual(calls, [])
  })

  it('uses the model default when the session has no explicit level', async () => {
    const { ctx, calls } = contextFor({ defaultEffort: 'low' })
    assert.equal(await stepEffort(ctx, 's1', 1), 'HIGH')
    assert.equal(calls[0].reasoningEffort, 'high')
  })

  it('refuses a model that advertises no levels', async () => {
    const { ctx, calls } = contextFor({ noReasoning: true })
    await assert.rejects(() => stepEffort(ctx, 's1', 1), /no reasoning effort levels/u)
    assert.deepEqual(calls, [])
  })

  it('refuses a level on a session with no model selection', async () => {
    const ctx = {
      sessions: { binding: () => ({ session: { projections: { faceOf: () => ({ getSnapshot: () => undefined }) } } }) },
      modelDirectories: { directoryFor: () => ({}) }
    }
    await assert.rejects(() => stepEffort(ctx, 's1', 1), /no model selection/u)
  })

  it('surfaces a rejected selection', async () => {
    const { ctx } = contextFor({ reasoningEffort: 'low' })
    ctx.modelDirectories.directoryFor = () => ({
      load: async () => {},
      store: { getSnapshot: () => ({ groups: [{ id: 'p', models: [{ id: 'm', reasoning: { efforts: [{ id: 'low', name: 'L' }, { id: 'high', name: 'H' }] } }] }] }) },
      select: async () => ({ ok: false, error: { code: 'session/model-unavailable', message: 'nope' } })
    })
    await assert.rejects(() => stepEffort(ctx, 's1', 1), /session\/model-unavailable: nope/u)
  })
})
