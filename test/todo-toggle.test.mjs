/**
 * Unit tests for the task-list toggle.
 *
 * The module exists because the list keeps its collapsed state inside a React
 * component, so the only control that exists is the header button. These tests
 * pin that contract: the right panel is chosen, its header is what gets pressed,
 * and a session without a list reports `unavailable` instead of throwing.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { toggleTodoList, PANEL_SELECTOR, COMPOSER_REGION } from '../src/client/todo-toggle.js'

/**
 * Build a fake panel element.
 *
 * @param clicks - Array the header records its presses into.
 * @returns A panel stand-in.
 */
function panel(clicks) {
  const header = {
    click: () => {
      clicks.push('header')
    }
  }
  return {
    querySelector: (selector) => (selector === 'button' ? header : null)
  }
}

/**
 * Build a fake document over a set of panels.
 *
 * @param panels - Panels, optionally marked as belonging to the composer region.
 * @returns A document stand-in.
 */
function document_(panels) {
  const composers = panels.filter((entry) => entry.composer === true).map((entry) => entry.element)
  const region = composers.length === 0 ? null : { contains: (element) => composers.includes(element) }
  return {
    querySelectorAll: (selector) => {
      assert.equal(selector, PANEL_SELECTOR)
      return panels.map((entry) => entry.element)
    },
    querySelector: (selector) => {
      assert.equal(selector, COMPOSER_REGION)
      return region
    }
  }
}

describe('toggleTodoList', () => {
  it('reports unavailable outside a document', () => {
    assert.equal(toggleTodoList(undefined), 'unavailable')
  })

  it('reports unavailable when no list is rendered', () => {
    // DSH renders nothing at all for an empty projection, so an absent panel is
    // the "this session has no task list" case, not a failure.
    assert.equal(toggleTodoList(document_([])), 'unavailable')
  })

  it('presses the header of the panel it finds', () => {
    const clicks = []
    const doc = document_([{ element: panel(clicks), composer: false }])
    assert.equal(toggleTodoList(doc), 'toggled')
    assert.deepEqual(clicks, ['header'])
  })

  it('prefers the panel belonging to the composer region', () => {
    const clicks = []
    const other = panel(clicks)
    const composer = panel(clicks)
    const doc = document_([
      { element: other, composer: false },
      { element: composer, composer: true }
    ])
    assert.equal(toggleTodoList(doc), 'toggled')
    assert.equal(clicks.length, 1)
  })

  it('falls back to the first panel when no composer region is marked', () => {
    const clicks = []
    const doc = document_([{ element: panel(clicks), composer: false }])
    assert.equal(toggleTodoList(doc), 'toggled')
    assert.deepEqual(clicks, ['header'])
  })

  it('reports unavailable when the panel has no header button', () => {
    const doc = document_([{ element: { querySelector: () => null }, composer: true }])
    assert.equal(toggleTodoList(doc), 'unavailable')
  })
})
