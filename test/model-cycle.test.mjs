/**
 * Unit tests for model cycling.
 *
 * The behaviour that matters: the cycle order matches the composer picker's
 * display order, it wraps at the end, and a reasoning effort rides along only
 * when the target model advertises the same level. A blank session — no
 * projection frame yet — cycles from the directory's effective default, the
 * same selection the seat shows.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { cycleModel } from '../src/client/model-cycle.js'

/**
 * Build a Cordis-shaped client context around the given services.
 *
 * Mirrors the proxy in `effort-step.test.mjs`: reading an undeclared service
 * as a property must throw, so a regression to `ctx.sessions` stays impossible.
 *
 * @param services - Services to expose through `get`.
 * @returns The context.
 */
function clientContext(services) {
  return new Proxy(
    { get: (name) => services[name] },
    {
      get(target, prop) {
        if (prop in target || typeof prop === 'symbol') return Reflect.get(target, prop)
        throw new Error(`cannot get property "${String(prop)}" without inject`)
      }
    }
  )
}

/** One catalog model with a reasoning ladder. */
function model(id, { efforts, defaultEffort } = {}) {
  return {
    id,
    name: id.toUpperCase(),
    ...(efforts === undefined
      ? {}
      : {
          reasoning: {
            ...(defaultEffort === undefined ? {} : { defaultEffort }),
            efforts: efforts.map((level) => ({ id: level, name: level.toUpperCase() }))
          }
        })
  }
}

/**
 * Build a client context around a catalog and a current selection.
 *
 * @param options - Catalog and selection.
 * @param options.groups - Provider groups in catalog order.
 * @param options.projected - The `modelSelection` projection snapshot, or
 * `undefined` for a blank session.
 * @param options.directoryCurrent - The directory's effective `current`.
 * @returns The context plus a record of what `select` was called with.
 */
function contextFor({ groups, projected, directoryCurrent } = {}) {
  const calls = []
  const directory = {
    load: async () => {},
    store: { getSnapshot: () => ({ groups: groups ?? [], current: directoryCurrent ?? null }) },
    select: async (next) => {
      calls.push(next)
      return { ok: true, value: undefined }
    }
  }
  const services = {
    sessions: {
      binding: () => ({ session: { projections: { faceOf: () => ({ getSnapshot: () => projected }) } } })
    },
    modelDirectories: { directoryFor: () => directory }
  }
  return { ctx: clientContext(services), calls }
}

describe('cycleModel', () => {
  const catalog = [
    { id: 'deepseek-official', models: [model('official-chat', { efforts: ['low', 'high'], defaultEffort: 'low' })] },
    { id: 'deepseek-account', models: [model('account-chat', { efforts: ['low', 'high'], defaultEffort: 'low' })] },
    { id: 'other', models: [model('other-chat', { efforts: ['low', 'high'], defaultEffort: 'low' })] }
  ]

  it('cycles in the picker display order, account provider first', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: { next: { provider: 'deepseek-official', model: 'official-chat', reasoningEffort: 'low' } }
    })
    assert.equal(await cycleModel(ctx, 's1'), 'OTHER-CHAT · LOW')
    assert.deepEqual(calls, [{ provider: 'other', model: 'other-chat', reasoningEffort: 'low' }])
  })

  it('wraps from the last model to the first', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: { next: { provider: 'other', model: 'other-chat', reasoningEffort: 'high' } }
    })
    assert.equal(await cycleModel(ctx, 's1'), 'ACCOUNT-CHAT · HIGH')
    assert.deepEqual(calls, [{ provider: 'deepseek-account', model: 'account-chat', reasoningEffort: 'high' }])
  })

  it('drops an effort the target model does not advertise and uses its default', async () => {
    const groups = [
      { id: 'p', models: [model('wide', { efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' })] },
      { id: 'q', models: [model('narrow', { efforts: ['low', 'medium'], defaultEffort: 'medium' })] }
    ]
    const { ctx, calls } = contextFor({
      groups,
      projected: { next: { provider: 'p', model: 'wide', reasoningEffort: 'high' } }
    })
    await cycleModel(ctx, 's1')
    assert.deepEqual(calls, [{ provider: 'q', model: 'narrow', reasoningEffort: 'medium' }])
  })

  it('omits the effort entirely for a target without reasoning control', async () => {
    const groups = [
      { id: 'p', models: [model('thinker', { efforts: ['low', 'high'], defaultEffort: 'low' })] },
      { id: 'q', models: [model('plain')] }
    ]
    const { ctx, calls } = contextFor({
      groups,
      projected: { next: { provider: 'p', model: 'thinker', reasoningEffort: 'high' } }
    })
    assert.equal(await cycleModel(ctx, 's1'), 'PLAIN')
    assert.deepEqual(calls, [{ provider: 'q', model: 'plain' }])
  })

  it('cycles from the directory default on a session before its first message', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: undefined,
      directoryCurrent: { provider: 'deepseek-official', model: 'official-chat' }
    })
    assert.equal(await cycleModel(ctx, 's1'), 'OTHER-CHAT · LOW')
    assert.deepEqual(calls, [{ provider: 'other', model: 'other-chat', reasoningEffort: 'low' }])
  })

  it('reports a catalog with nothing to cycle to', async () => {
    const { ctx, calls } = contextFor({
      groups: [{ id: 'p', models: [model('only')] }],
      projected: { next: { provider: 'p', model: 'only' } }
    })
    await assert.rejects(() => cycleModel(ctx, 's1'), (error) => {
      assert.equal(error.code, 'model-none')
      return true
    })
    assert.deepEqual(calls, [], 'a refused cycle must not write')
  })

  it('surfaces a rejected selection', async () => {
    const ctx = clientContext({
      sessions: {
        binding: () => ({ session: { projections: { faceOf: () => ({ getSnapshot: () => undefined }) } } })
      },
      modelDirectories: {
        directoryFor: () => ({
          load: async () => {},
          store: {
            getSnapshot: () => ({
              current: null,
              groups: [
                { id: 'p', models: [model('a'), model('b')] }
              ]
            })
          },
          select: async () => ({ ok: false, error: { code: 'session/model-unavailable', message: 'nope' } })
        })
      }
    })
    await assert.rejects(() => cycleModel(ctx, 's1'), /session\/model-unavailable: nope/u)
  })
})

describe('cycleModel with a scope', () => {
  // The user-facing case: flash models across two providers, with a pro model
  // in the catalog that the cycle must skip.
  const catalog = [
    { id: 'deepseek-account', models: [model('deepseek-flash', { efforts: ['low', 'high'], defaultEffort: 'low' }), model('deepseek-pro', { efforts: ['low', 'high'], defaultEffort: 'low' })] },
    { id: 'zai-coding-cn', models: [model('glm-5.3-flash', { efforts: ['low', 'high'], defaultEffort: 'low' })] }
  ]

  it('cycles only the models matching the scope, in display order', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: { next: { provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'low' } }
    })
    assert.equal(await cycleModel(ctx, 's1', 'flash'), 'GLM-5.3-FLASH · LOW')
    assert.deepEqual(calls, [{ provider: 'zai-coding-cn', model: 'glm-5.3-flash', reasoningEffort: 'low' }])
  })

  it('wraps within the scope', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: { next: { provider: 'zai-coding-cn', model: 'glm-5.3-flash', reasoningEffort: 'high' } }
    })
    assert.equal(await cycleModel(ctx, 's1', 'flash'), 'DEEPSEEK-FLASH · HIGH')
    assert.deepEqual(calls, [{ provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'high' }])
  })

  it('matches case-insensitively around trimmed comma entries', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: { next: { provider: 'deepseek-account', model: 'deepseek-pro', reasoningEffort: 'low' } }
    })
    assert.equal(await cycleModel(ctx, 's1', '  FLASH , zai '), 'DEEPSEEK-FLASH · LOW')
    assert.deepEqual(calls, [{ provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'low' }])
  })

  it('reports an empty scope match without writing', async () => {
    const { ctx, calls } = contextFor({
      groups: catalog,
      projected: { next: { provider: 'deepseek-account', model: 'deepseek-flash' } }
    })
    await assert.rejects(() => cycleModel(ctx, 's1', 'pro-nothing'), (error) => {
      assert.equal(error.code, 'scope-empty')
      return true
    })
    assert.deepEqual(calls, [])
  })

  it('treats a blank scope as unrestricted', async () => {
    const { ctx, calls } = contextFor({
      groups: [{ id: 'p', models: [model('a'), model('b')] }],
      projected: { next: { provider: 'p', model: 'a' } }
    })
    assert.equal(await cycleModel(ctx, 's1', '  ,  '), 'B')
    assert.deepEqual(calls, [{ provider: 'p', model: 'b' }])
  })
})
