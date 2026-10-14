/**
 * Unit tests for the navigation-glyph data URI and the slot readers.
 *
 * The data URI matters because a silent failure there renders an invisible mask
 * rather than an error: a missing XML namespace, or a `currentColor` that
 * survives into an isolated image document, both produce a blank glyph.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { svgMaskUri } from '../src/client/nav-icon.js'
import { keyboardIconSvg } from '../src/client/icons.js'
import { entries, findSectionEntry, labelText, sectionIndex } from '../src/client/slots.js'

describe('svgMaskUri', () => {
  it('returns an empty string for empty input', () => {
    assert.equal(svgMaskUri('   '), '')
  })

  it('adds the XML namespace when the source omits it', () => {
    const uri = svgMaskUri('<svg viewBox="0 0 1 1"></svg>')
    assert.match(decodeURIComponent(uri), /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/u)
  })

  it('keeps an existing namespace rather than duplicating it', () => {
    const uri = decodeURIComponent(svgMaskUri('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))
    assert.equal(uri.match(/xmlns=/gu)?.length, 1)
  })

  it('replaces currentColor, which has no meaning in an isolated document', () => {
    const uri = decodeURIComponent(svgMaskUri('<svg><path stroke="currentColor"/></svg>'))
    assert.doesNotMatch(uri, /currentColor/u)
    assert.match(uri, /#000/u)
  })

  it('wraps the result as a CSS url()', () => {
    assert.match(svgMaskUri('<svg/>'), /^url\("data:image\/svg\+xml,/u)
  })
})

describe('keyboardIconSvg', () => {
  it('matches the product icon conventions', () => {
    const svg = keyboardIconSvg()
    assert.match(svg, /viewBox="0 0 16 16"/u)
    assert.match(svg, /fill="none"/u)
    assert.match(svg, /stroke-width="1\.3"/u)
    assert.match(svg, /aria-hidden="true"/u)
  })

  it('honours an explicit size and stroke width', () => {
    const svg = keyboardIconSvg({ size: 20, strokeWidth: 1 })
    assert.match(svg, /width="20"/u)
    assert.match(svg, /height="20"/u)
    assert.match(svg, /stroke-width="1"/u)
  })

  it('survives the mask conversion', () => {
    assert.notEqual(svgMaskUri(keyboardIconSvg()), '')
  })
})

/**
 * Build a fake client context whose slot ledger returns `value`.
 *
 * @param value - The value `ctx.slots.entries` should return.
 * @returns The fake context.
 */
function ctxWithEntries(value) {
  return { slots: { entries: () => value } }
}

describe('slot readers', () => {
  it('returns an empty array when the ledger is unavailable', () => {
    assert.deepEqual(entries({ slots: {} }, 'settings.section'), [])
    assert.deepEqual(entries({}, 'settings.section'), [])
  })

  it('returns an empty array when the ledger throws', () => {
    const ctx = {
      slots: {
        entries() {
          throw new Error('not ready')
        }
      }
    }
    assert.deepEqual(entries(ctx, 'settings.section'), [])
  })

  it('finds an entry by id and by position', () => {
    const list = [
      { options: { id: 'general', order: 0 } },
      { options: { id: 'keyboard-shortcut', order: 5 } }
    ]
    const ctx = ctxWithEntries(list)
    assert.equal(findSectionEntry(ctx, 'settings.section', 'keyboard-shortcut')?.options.order, 5)
    assert.equal(findSectionEntry(ctx, 'settings.section')?.options.id, 'general')
    assert.equal(findSectionEntry(ctx, 'settings.section', 'absent'), undefined)
  })

  it('reproduces the shell sort: priority first, then order', () => {
    const list = [
      { options: { id: 'later', order: 20 } },
      { options: { id: 'first', order: -10 } },
      { options: { id: 'middle', order: 5 } },
      { options: { id: 'shadowing', order: 0, priority: -1 } }
    ]
    const ctx = ctxWithEntries(list)
    assert.equal(sectionIndex(ctx, 'settings.section', 'shadowing'), 0)
    assert.equal(sectionIndex(ctx, 'settings.section', 'first'), 1)
    assert.equal(sectionIndex(ctx, 'settings.section', 'middle'), 2)
    assert.equal(sectionIndex(ctx, 'settings.section', 'later'), 3)
  })

  it('reports an absent id as undefined rather than as an index', () => {
    const ctx = ctxWithEntries([{ options: { id: 'general' } }])
    assert.equal(sectionIndex(ctx, 'settings.section', 'missing'), undefined)
  })

  it('resolves a label that is a string or a thunk', () => {
    assert.equal(labelText('Shortcuts'), 'Shortcuts')
    assert.equal(labelText(() => 'Shortcuts'), 'Shortcuts')
    assert.equal(labelText(undefined), '')
    assert.equal(labelText(42), '')
    assert.equal(
      labelText(() => {
        throw new Error('bad thunk')
      }),
      ''
    )
  })
})
