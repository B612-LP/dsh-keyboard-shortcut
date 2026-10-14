/**
 * Unit tests for the Ctrl+/ reconciliation.
 *
 * This is the one place the plugin writes into another command's binding, and
 * the write order is load-bearing: the preference layer rejects claiming a
 * combination that is still held, so the built-in must be cleared first. These
 * tests pin that order, the refusal to fight a user's own pinning, and the
 * outcome contract.
 *
 * The outcome contract: a classification describes the *end state*, not whether
 * a write happened. `'done'` means the wanted state holds — by reading, by
 * writing, or by having already been written. That is what makes the function
 * safe to call repeatedly and on a timer.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { reconcileShortcutKey } from '../src/client/open-settings.js'

/** The combination under test, as the preference layer stores it. */
const PRIMARY_SLASH = { code: 'Slash', modifiers: ['control'] }

/** The same combination, as a fresh edit writes it. */
const CLAIM = { type: 'set', id: 'keyboard-shortcut.open', binding: { code: 'Slash', modifiers: ['primary'] } }

/** Clearing the built-in. */
const CLEAR = { type: 'set', id: 'shortcuts.open', binding: null }

/**
 * Build a context whose shortcut service records edits.
 *
 * @param rows - Catalog rows to publish.
 * @param options - Edit behaviour.
 * @returns The context plus the recorded edits.
 */
function contextWith(rows, options = {}) {
  const edits = []
  let revision = 0
  return {
    edits,
    context: {
      slots: { entries: () => [] },
      shortcuts: {
        catalog: { getSnapshot: () => rows, subscribe: () => () => {} },
        config: { getSnapshot: () => ({ status: options.status ?? 'ready', revision: `rev-${revision}` }) },
        async edit(operation) {
          edits.push(operation)
          revision += 1
          return { status: options.failWith ?? 'saved', snapshot: {} }
        }
      }
    }
  }
}

/**
 * Build one catalog row.
 *
 * @param id - Command id.
 * @param extra - Row fields.
 * @returns The row.
 */
function row(id, extra = {}) {
  return { id, binding: null, modified: false, keys: [], issue: null, conflicts: [], ...extra }
}

/** A row for this plugin's command, bound and marked as overridden. */
const MINE_BOUND = row('keyboard-shortcut.open', { binding: PRIMARY_SLASH, modified: true })

/** A row for the built-in at its shipped default. */
const BUILTIN_DEFAULT = row('shortcuts.open', { binding: PRIMARY_SLASH })

/** A row for the built-in already cleared by this plugin. */
const BUILTIN_CLEARED = row('shortcuts.open', { binding: null, modified: true })

describe('reconcileShortcutKey, takeover enabled', () => {
  it('claims the combination on a fresh install, clearing the built-in first', async () => {
    const { context, edits } = contextWith([row('keyboard-shortcut.open'), BUILTIN_DEFAULT])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [CLEAR, CLAIM], 'the built-in must be released before the claim')
  })

  it('is idempotent once the wanted state holds', async () => {
    const { context, edits } = contextWith([MINE_BOUND, BUILTIN_CLEARED])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [], 'a settled state must not write')
  })

  it('finishes a takeover interrupted after the claim', async () => {
    // Bound, but the built-in still holds the combination: the previous run
    // stopped between the two steps.
    const { context, edits } = contextWith([MINE_BOUND, BUILTIN_DEFAULT])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [CLEAR])
  })

  it('finishes a takeover interrupted before the claim', async () => {
    const { context, edits } = contextWith([row('keyboard-shortcut.open'), BUILTIN_CLEARED])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [CLAIM])
  })

  it('stands down when the user pinned the built-in to this combination', async () => {
    // Modified *and* still holding it: the user put it there on purpose.
    const { context, edits } = contextWith([
      row('keyboard-shortcut.open'),
      row('shortcuts.open', { binding: PRIMARY_SLASH, modified: true })
    ])
    assert.equal(await reconcileShortcutKey(context, true), 'skipped')
    assert.deepEqual(edits, [])
  })

  it('claims a combination the user freed by moving the built-in elsewhere', async () => {
    // The user rebound the reference to Ctrl+K. Ctrl+/ is now unoccupied, so
    // taking it costs them nothing — this is the case the earlier revision got
    // wrong by standing down.
    const { context, edits } = contextWith([
      row('keyboard-shortcut.open'),
      row('shortcuts.open', { binding: { code: 'KeyK', modifiers: ['primary'] }, modified: true })
    ])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [CLAIM], 'the built-in must be left where the user put it')
  })

  it('claims the combination when the built-in is not mounted at all', async () => {
    const { context, edits } = contextWith([row('keyboard-shortcut.open')])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [CLAIM])
  })

  it('claims the combination when the built-in is unbound without an override', async () => {
    const { context, edits } = contextWith([row('keyboard-shortcut.open'), row('shortcuts.open', { binding: null })])
    assert.equal(await reconcileShortcutKey(context, true), 'done')
    assert.deepEqual(edits, [CLAIM])
  })
})

describe('reconcileShortcutKey, takeover disabled', () => {
  it('does nothing when no override exists', async () => {
    const { context, edits } = contextWith([row('keyboard-shortcut.open'), BUILTIN_DEFAULT])
    assert.equal(await reconcileShortcutKey(context, false), 'done')
    assert.deepEqual(edits, [])
  })

  it('restores both commands, releasing this plugin first', async () => {
    const { context, edits } = contextWith([MINE_BOUND, BUILTIN_CLEARED])
    assert.equal(await reconcileShortcutKey(context, false), 'done')
    assert.deepEqual(edits, [
      { type: 'reset', id: 'keyboard-shortcut.open' },
      { type: 'reset', id: 'shortcuts.open' }
    ])
    assert.equal(edits[0].id, 'keyboard-shortcut.open', 'releasing ours first avoids a transient conflict')
  })

  it('reports a refused restore', async () => {
    const { context } = contextWith([MINE_BOUND, BUILTIN_CLEARED], { failWith: 'conflict' })
    assert.equal(await reconcileShortcutKey(context, false), 'conflict')
  })
})

describe('reconcileShortcutKey, not ready', () => {
  it('reports an unregistered command so the caller retries', async () => {
    const { context } = contextWith([BUILTIN_DEFAULT])
    assert.equal(await reconcileShortcutKey(context, true), 'not-registered')
  })

  it('reports an unavailable catalog rather than throwing', async () => {
    const context = { shortcuts: { catalog: { getSnapshot: () => undefined } } }
    assert.equal(await reconcileShortcutKey(context, true), 'unavailable')
  })

  it('surfaces an unreadable preference document without writing', async () => {
    const { context, edits } = contextWith([row('keyboard-shortcut.open'), BUILTIN_DEFAULT], {
      status: 'unreadable'
    })
    assert.equal(await reconcileShortcutKey(context, true), 'unreadable')
    assert.deepEqual(edits, [])
  })

  it('surfaces a refused write', async () => {
    const { context } = contextWith([row('keyboard-shortcut.open'), BUILTIN_DEFAULT], { failWith: 'conflict' })
    assert.equal(await reconcileShortcutKey(context, true), 'conflict')
  })
})
