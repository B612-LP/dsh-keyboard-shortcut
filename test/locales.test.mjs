/**
 * Contract tests for the locale dictionaries.
 *
 * A missing key renders as the key itself, which is a visible defect that only
 * shows up in one language at a time. Asserting the key sets match turns that
 * into a build failure instead.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { NS, en, zh } from '../src/client/locales.js'

describe('locales', () => {
  it('uses a namespaced dictionary key', () => {
    assert.equal(NS, 'keyboard-shortcut')
  })

  it('defines the same keys in both languages', () => {
    const english = Object.keys(en).sort()
    const chinese = Object.keys(zh).sort()
    const missingInChinese = english.filter((key) => !(key in zh))
    const missingInEnglish = chinese.filter((key) => !(key in en))
    assert.deepEqual(missingInChinese, [], 'zh is missing keys')
    assert.deepEqual(missingInEnglish, [], 'en is missing keys')
  })

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries({ ...en, ...zh })) {
      assert.equal(typeof value, 'string', `${key} must be a string`)
      assert.notEqual(value.trim(), '', `${key} must not be empty`)
    }
  })

  it('only interpolates placeholders both languages declare', () => {
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/gu)].map((match) => match[1]).sort()
    for (const key of Object.keys(en)) {
      assert.deepEqual(placeholders(zh[key]), placeholders(en[key]), `placeholder mismatch for ${key}`)
    }
  })
})
