/**
 * Unit tests for the preference store.
 *
 * `prefs.js` is the plugin's only durable state, so the cases that matter are
 * the ones where storage misbehaves: absent, throwing, and holding a document
 * this version cannot read.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULTS, STORAGE_KEY, createPrefs, readPrefs } from '../src/client/prefs.js'

/**
 * Build a `Storage`-like stub.
 *
 * @param options - Stub behaviour.
 * @param options.initial - Value returned by `getItem`.
 * @param options.throwOnRead - Whether `getItem` should throw.
 * @param options.throwOnWrite - Whether `setItem` should throw.
 * @returns The stub and a record of writes.
 */
function storageStub({ initial = null, throwOnRead = false, throwOnWrite = false } = {}) {
  const writes = []
  return {
    writes,
    getItem(key) {
      if (throwOnRead) throw new Error('read blocked')
      return key === STORAGE_KEY ? initial : null
    },
    setItem(key, value) {
      if (throwOnWrite) throw new Error('write blocked')
      writes.push([key, value])
    }
  }
}

describe('readPrefs', () => {
  it('returns defaults when storage is unavailable', () => {
    assert.deepEqual(readPrefs(undefined), { ...DEFAULTS })
  })

  it('returns defaults for a missing document', () => {
    assert.deepEqual(readPrefs(storageStub()), { ...DEFAULTS })
  })

  it('returns defaults when reading throws', () => {
    assert.deepEqual(readPrefs(storageStub({ throwOnRead: true })), { ...DEFAULTS })
  })

  it('returns defaults for malformed JSON', () => {
    assert.deepEqual(readPrefs(storageStub({ initial: '{not json' })), { ...DEFAULTS })
  })

  it('returns defaults for a non-object document', () => {
    assert.deepEqual(readPrefs(storageStub({ initial: '"a string"' })), { ...DEFAULTS })
    assert.deepEqual(readPrefs(storageStub({ initial: '[1,2]' })), { ...DEFAULTS })
    assert.deepEqual(readPrefs(storageStub({ initial: 'null' })), { ...DEFAULTS })
  })

  it('keeps stored booleans and ignores non-boolean fields', () => {
    const value = readPrefs(
      storageStub({
        initial: JSON.stringify({ optimizeComposerKeys: true, takeOverShortcutKey: 'yes' })
      })
    )
    assert.equal(value.optimizeComposerKeys, true)
    assert.equal(value.takeOverShortcutKey, DEFAULTS.takeOverShortcutKey)
  })

  it('ignores unknown fields so a newer writer cannot corrupt this one', () => {
    const value = readPrefs(storageStub({ initial: JSON.stringify({ fromTheFuture: 7 }) }))
    assert.deepEqual(value, { ...DEFAULTS })
  })
})

describe('createPrefs', () => {
  it('starts from the stored document', () => {
    const store = createPrefs(storageStub({ initial: JSON.stringify({ optimizeComposerKeys: true }) }))
    assert.equal(store.getSnapshot().optimizeComposerKeys, true)
  })

  it('publishes before persisting, so a blocked write still takes effect', () => {
    const storage = storageStub({ throwOnWrite: true })
    const store = createPrefs(storage)
    store.set('optimizeComposerKeys', true)
    assert.equal(store.getSnapshot().optimizeComposerKeys, true)
  })

  it('writes the whole document on change', () => {
    const storage = storageStub()
    const store = createPrefs(storage)
    store.set('optimizeComposerKeys', true)
    assert.deepEqual(storage.writes, [
      [STORAGE_KEY, JSON.stringify({ ...DEFAULTS, optimizeComposerKeys: true })]
    ])
  })

  it('notifies subscribers and stops after unsubscribe', () => {
    const store = createPrefs(storageStub())
    let calls = 0
    const off = store.subscribe(() => {
      calls += 1
    })
    store.set('optimizeComposerKeys', true)
    assert.equal(calls, 1)
    off()
    store.set('optimizeComposerKeys', false)
    assert.equal(calls, 1)
  })

  it('is a no-op when the value is unchanged', () => {
    const storage = storageStub()
    const store = createPrefs(storage)
    let calls = 0
    store.subscribe(() => {
      calls += 1
    })
    store.set('optimizeComposerKeys', DEFAULTS.optimizeComposerKeys)
    assert.equal(calls, 0)
    assert.equal(storage.writes.length, 0)
  })

  it('keeps a stable snapshot identity until a change', () => {
    const store = createPrefs(storageStub())
    const before = store.getSnapshot()
    assert.equal(store.getSnapshot(), before)
    store.set('optimizeComposerKeys', true)
    assert.notEqual(store.getSnapshot(), before)
  })

  it('rejects an unknown preference key', () => {
    const store = createPrefs(storageStub())
    assert.throws(() => {
      store.set('madeUpSwitch', true)
    }, /unknown preference/u)
  })

  it('adopts another tab\u2019s write for its own key only', () => {
    const storage = storageStub({ initial: JSON.stringify({ optimizeComposerKeys: true }) })
    const store = createPrefs(storage)
    store.adopt({ key: 'some.other.key' })
    assert.equal(store.getSnapshot().optimizeComposerKeys, true)
  })
})
