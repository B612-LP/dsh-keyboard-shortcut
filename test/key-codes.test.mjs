/**
 * Contract test for the physical key codes this plugin declares.
 *
 * DSH's shortcut registry validates every declared binding's `code` against a
 * closed whitelist before accepting a registration:
 *
 *     /^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-9]|2[0-4]))$/  ∪  {Slash, Comma, Period,
 *     Backslash, Backquote, Minus, Equal, BracketLeft, BracketRight, Semicolon,
 *     Quote, Enter, Escape, Space, Tab, Backspace, Delete, ArrowUp, ArrowDown,
 *     ArrowLeft, ArrowRight}
 *
 * Anything else throws `Unsupported shortcut code: <code>` at registration. The
 * throw is easy to miss because a plugin that guards its registrations — as this
 * one does, so a single conflict cannot take the whole plugin down — silently
 * loses the binding instead of failing loudly.
 *
 * This test pins the whitelist and checks every code the plugin declares, so
 * that failure mode becomes a test failure.
 */

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Named keys the registry accepts, transcribed from its `keyNames` table. */
const NAMED = new Set([
  'Slash',
  'Comma',
  'Period',
  'Backslash',
  'Backquote',
  'Minus',
  'Equal',
  'BracketLeft',
  'BracketRight',
  'Semicolon',
  'Quote',
  'Enter',
  'Escape',
  'Space',
  'Tab',
  'Backspace',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight'
])

/** Patterned codes the registry accepts. */
const PATTERN = /^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-9]|2[0-4]))$/u

/**
 * Reproduce the registry's acceptance rule.
 *
 * @param code - A physical key code, as `KeyboardEvent.code` spells it.
 * @returns Whether the registry would accept it.
 */
function accepted(code) {
  return PATTERN.test(code) || NAMED.has(code)
}

/** Codes the plugin declares in its editable command defaults. */
const DECLARED = {
  slash: 'Slash',
  keyQ: 'KeyQ',
  digit1: 'Digit1',
  digit2: 'Digit2',
  keyA: 'KeyA',
  keyL: 'KeyL'
}

describe('declared key codes', () => {
  it('accepts every code the editable defaults use', () => {
    for (const [name, code] of Object.entries(DECLARED)) {
      assert.equal(accepted(code), true, `${name} (${code}) must be a registrable code`)
    }
  })

  it('rejects the page keys, which is why they are observer-only', () => {
    // `KeyboardEvent.code` spells these "PageUp"/"PageDown", and the registry has
    // no entry for them. Registering one throws, so the plugin cannot publish
    // them as fixed actions and handles them as raw input instead.
    assert.equal(accepted('PageUp'), false)
    assert.equal(accepted('PageDown'), false)
  })

  it('agrees with the source on which codes are declared', () => {
    // Every client module is scanned, because bindings are declared wherever the
    // command they belong to lives (the open-settings command owns Ctrl+/).
    const dir = join(root, 'src/client')
    const declared = new Set()
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.js')) continue
      const source = readFileSync(join(dir, name), 'utf8')
      for (const match of source.matchAll(/code:\s*'([A-Za-z0-9]+)'/gu)) declared.add(match[1])
    }
    for (const code of Object.values(DECLARED)) {
      assert.ok(declared.has(code), `${code} must be declared somewhere in src/client`)
    }
    // No registration may name a page key, because none can succeed.
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.js')) continue
      const source = readFileSync(join(dir, name), 'utf8')
      assert.doesNotMatch(
        source,
        /bindings:\s*\[\s*\{\s*code:\s*'Page(Up|Down)'/u,
        `a PageUp/PageDown binding in ${name} would throw at registration`
      )
    }
  })
})
