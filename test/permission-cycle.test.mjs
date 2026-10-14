/**
 * Unit tests for permission-mode cycling.
 *
 * The two properties worth pinning are that the cycle follows whatever the Host
 * advertises rather than a hardcoded triple, and that a session sitting on an
 * unlisted value still advances instead of stalling.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { cyclePermissionMode, createPermissionCatalog, readPermissionMode } from '../src/client/permission-cycle.js'

/**
 * Build a Remote namespace stub.
 *
 * @param options - Catalog contents and failure behaviour.
 * @param options.options - Advertised preset keys.
 * @param options.fail - When true, the read returns a Remote failure.
 * @returns The namespace plus a call counter.
 */
function remoteStub({ options = ['read-only', 'workspace-write', 'danger-full-access'], fail = false } = {}) {
  const state = { reads: 0, listeners: [] }
  return {
    state,
    namespace: {
      catalog: async () => {
        state.reads += 1
        if (fail) return { ok: false, error: { code: 'x', message: 'y' } }
        return { ok: true, value: { options: options.map((value) => ({ value, name: value })) } }
      }
    },
    on(event, listener) {
      state.listeners.push({ event, listener })
      return () => {}
    }
  }
}

/**
 * Build a context carrying a Remote namespace.
 *
 * @param remote - A stub from {@link remoteStub}.
 * @returns The context.
 */
function ctxWith(remote) {
  return {
    get: (name) => {
      if (name !== 'remote') return undefined
      return { permissionPresets: remote.namespace, $on: remote.on }
    }
  }
}

/**
 * Build a session face with a current mode and a command recorder.
 *
 * @param current - The session's current preset key.
 * @param options - Command behaviour.
 * @returns The session plus the recorded command lines.
 */
function sessionWith(current, options = {}) {
  const commands = []
  return {
    commands,
    session: {
      projections: { faceOf: () => ({ getSnapshot: () => ({ currentValue: current }) }) },
      command: async (line) => {
        commands.push(line)
        return options.fail === true
          ? { ok: false, error: { code: 'session/writer-held', message: 'busy' } }
          : { ok: true, value: { matched: options.unmatched !== true } }
      }
    }
  }
}

describe('readPermissionMode', () => {
  it('reads the projection value', () => {
    const { session } = sessionWith('workspace-write')
    assert.equal(readPermissionMode(session), 'workspace-write')
  })

  it('reports undefined for an absent session', () => {
    assert.equal(readPermissionMode(undefined), undefined)
  })
})

describe('cyclePermissionMode', () => {
  it('advances to the next advertised mode', async () => {
    const remote = remoteStub()
    const catalog = createPermissionCatalog(ctxWith(remote))
    await catalog.load()
    const { session, commands } = sessionWith('read-only')
    const next = await cyclePermissionMode({ get: ctxWith(remote).get }, catalog, session)
    assert.equal(next.value, 'workspace-write')
    assert.deepEqual(commands, ['/permission workspace-write'])
  })

  it('wraps from the last mode to the first', async () => {
    const remote = remoteStub()
    const ctx = ctxWith(remote)
    const catalog = createPermissionCatalog(ctx)
    await catalog.load()
    const { session, commands } = sessionWith('danger-full-access')
    const next = await cyclePermissionMode(ctx, catalog, session)
    assert.equal(next.value, 'read-only')
    assert.deepEqual(commands, ['/permission read-only'])
  })

  it('follows a Host that advertises a different set', async () => {
    // The point of reading the catalog: a deployment that renamed or added
    // presets must be followed, not overridden by a hardcoded triple.
    const remote = remoteStub({ options: ['locked-down', 'trusted', 'auto'] })
    const ctx = ctxWith(remote)
    const catalog = createPermissionCatalog(ctx)
    await catalog.load()
    const { session, commands } = sessionWith('trusted')
    const next = await cyclePermissionMode(ctx, catalog, session)
    assert.equal(next.value, 'auto')
    assert.deepEqual(commands, ['/permission auto'])
  })

  it('advances from an unlisted current value to the first option', async () => {
    const remote = remoteStub()
    const ctx = ctxWith(remote)
    const catalog = createPermissionCatalog(ctx)
    await catalog.load()
    const { session, commands } = sessionWith('custom')
    const next = await cyclePermissionMode(ctx, catalog, session)
    assert.equal(next.value, 'read-only')
    assert.deepEqual(commands, ['/permission read-only'])
  })

  it('refuses an empty catalog rather than looping', async () => {
    const remote = remoteStub({ options: [] })
    const ctx = ctxWith(remote)
    const catalog = createPermissionCatalog(ctx)
    await catalog.load()
    const { session } = sessionWith('read-only')
    await assert.rejects(() => cyclePermissionMode(ctx, catalog, session), /no permission modes are available/u)
  })

  it('surfaces a rejected command', async () => {
    const remote = remoteStub()
    const ctx = ctxWith(remote)
    const catalog = createPermissionCatalog(ctx)
    await catalog.load()
    const { session } = sessionWith('read-only', { fail: true })
    await assert.rejects(() => cyclePermissionMode(ctx, catalog, session), /permission switch failed/u)
  })

  it('reports a deployment with no permission Remote', async () => {
    const catalog = createPermissionCatalog({ get: () => undefined })
    const { session } = sessionWith('read-only')
    await assert.rejects(
      () => cyclePermissionMode({ get: () => undefined }, catalog, session),
      /not available in this deployment/u
    )
  })
})

describe('createPermissionCatalog', () => {
  it('subscribes before the first read, so an early invalidation is not lost', async () => {
    const remote = remoteStub()
    const order = []
    const originalCatalog = remote.namespace.catalog
    remote.namespace.catalog = async () => {
      order.push('read')
      return originalCatalog()
    }
    remote.on = (event, listener) => {
      order.push(`on:${event}`)
      return () => {}
    }
    createPermissionCatalog(ctxWith(remote))
    // `load()` is kicked off synchronously, but the subscription is registered
    // first, which is the property under test.
    assert.deepEqual(order[0], 'on:permission-presets/catalog-changed')
    assert.equal(order[1], 'read')
  })

  it('reports a Remote failure without throwing', async () => {
    const remote = remoteStub({ fail: true })
    const catalog = createPermissionCatalog(ctxWith(remote))
    await catalog.load()
    assert.equal(catalog.get(), undefined)
    assert.match(String(catalog.failure()), /x: y/u)
  })

  it('never reads when the namespace is absent', async () => {
    const catalog = createPermissionCatalog({ get: () => undefined })
    await catalog.load()
    assert.equal(catalog.get(), undefined)
    assert.match(String(catalog.failure()), /not available/u)
  })
})
