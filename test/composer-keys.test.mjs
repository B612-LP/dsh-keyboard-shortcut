/**
 * Unit tests for the composer key remap.
 *
 * The remap is a pure function from an event's modifier flags to the flags to
 * write back, plus a guarded property rewrite. Both are testable without a DOM
 * because `Object.defineProperty` works on any object whose shape mimics the
 * three accessors the composer reads.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { applyFlags, rewriteFor } from '../src/client/composer-keys.js'

/**
 * Build an object shaped like the modifier flags of a `KeyboardEvent`.
 *
 * The flags live on a prototype, mirroring the real accessor properties, so the
 * rewrite has to shadow them rather than assign.
 *
 * @param flags - Initial flag values.
 * @returns The stub event.
 */
function eventStub(flags = {}) {
  const prototype = {
    get shiftKey() {
      return false
    },
    get ctrlKey() {
      return false
    },
    get metaKey() {
      return false
    },
    get altKey() {
      return false
    }
  }
  const event = Object.create(prototype)
  for (const key of ['shiftKey', 'ctrlKey', 'metaKey', 'altKey']) {
    if (key in flags) {
      Object.defineProperty(event, key, { value: flags[key], configurable: true, enumerable: true })
    }
  }
  return event
}

describe('rewriteFor', () => {
  it('turns a bare Enter into a shifted Enter, so the browser inserts the break', () => {
    assert.deepEqual(rewriteFor(eventStub()), { shiftKey: true, ctrlKey: false, metaKey: false })
  })

  it('turns Ctrl+Enter into a bare Enter, which the composer reads as send', () => {
    assert.deepEqual(rewriteFor(eventStub({ ctrlKey: true })), {
      shiftKey: false,
      ctrlKey: false,
      metaKey: false
    })
  })

  it('turns Cmd+Enter into a bare Enter as well', () => {
    assert.deepEqual(rewriteFor(eventStub({ metaKey: true })), {
      shiftKey: false,
      ctrlKey: false,
      metaKey: false
    })
  })

  it('turns Shift+Enter into Ctrl+Enter, the complementary Queue/Steer gesture', () => {
    assert.deepEqual(rewriteFor(eventStub({ shiftKey: true })), {
      shiftKey: false,
      ctrlKey: true,
      metaKey: false
    })
  })

  it('leaves Alt combinations alone, because the stock command absorbs them', () => {
    assert.equal(rewriteFor(eventStub({ altKey: true })), undefined)
    assert.equal(rewriteFor(eventStub({ altKey: true, shiftKey: true })), undefined)
  })

  it('leaves Ctrl+Meta alone, because the stock command already consumes it', () => {
    assert.equal(rewriteFor(eventStub({ ctrlKey: true, metaKey: true })), undefined)
  })
})

describe('applyFlags', () => {
  it('makes the requested flags readable, shadowing the prototype accessors', () => {
    const event = eventStub()
    assert.equal(applyFlags(event, { shiftKey: true }), true)
    assert.equal(event.shiftKey, true)
    assert.equal(event.ctrlKey, false)
    assert.equal(event.metaKey, false)
  })

  it('reports failure when a flag cannot be redefined', () => {
    const event = eventStub()
    Object.defineProperty(event, 'shiftKey', { value: false, configurable: false })
    assert.equal(applyFlags(event, { shiftKey: true }), false)
  })

  it('does not touch the keys the remap never writes', () => {
    const event = eventStub({ altKey: true })
    applyFlags(event, { shiftKey: true })
    assert.equal(event.altKey, true)
  })
})
