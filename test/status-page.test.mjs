/**
 * Unit tests for the status-page shortcut.
 *
 * The module carries the reuse rule, which is the whole point of the shortcut:
 * a second press must reveal the page that is already open rather than mint
 * another tab. `openTab` cannot do that — the browser tab type is registered
 * `multiple: true`, so it always mints — which is why the rule lives here and is
 * pinned here.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { openStatusPage, STATUS_URL, BROWSER_KIND } from '../src/client/status-page.js'

/**
 * Build a fake `sidebarRight` face.
 *
 * @param options - On-screen session, open tabs, and expansion state.
 * @returns The face plus the calls it recorded.
 */
function sidebarFor(options = {}) {
  const calls = { opened: [], focused: [], toggled: 0 }
  // `sessionId: undefined` means "no on-screen surface", so the default has to be
  // keyed on presence rather than on the value.
  const sessionId = 'sessionId' in options ? options.sessionId : 's1'
  return {
    calls,
    screen: () => (sessionId === undefined ? undefined : { sessionId }),
    isExpanded: () => options.expanded ?? false,
    toggleExpanded: () => {
      calls.toggled += 1
    },
    focus: (tabId) => {
      calls.focused.push(tabId)
    },
    openTab: (kind, opts) => {
      calls.opened.push({ kind, opts })
    },
    openTabs: { getSnapshot: () => options.tabs ?? [] }
  }
}

describe('openStatusPage', () => {
  it('reports no-sidebar without the service', () => {
    assert.equal(openStatusPage(undefined), 'no-sidebar')
  })

  it('reports no-session without an on-screen surface', () => {
    const sidebar = sidebarFor({ sessionId: undefined })
    assert.equal(openStatusPage(sidebar), 'no-session')
    assert.deepEqual(sidebar.calls.opened, [])
  })

  it('opens a browser tab at the status page when none is open', () => {
    const sidebar = sidebarFor({ tabs: [] })
    assert.equal(openStatusPage(sidebar), 'opened')
    assert.deepEqual(sidebar.calls.opened, [{ kind: BROWSER_KIND, opts: { params: { url: STATUS_URL } } }])
    assert.deepEqual(sidebar.calls.focused, [])
  })

  it('reveals an already-open browser tab instead of opening another', () => {
    const sidebar = sidebarFor({
      tabs: [{ sessionId: 's1', tabId: 'tab-7', kind: BROWSER_KIND, contentId: 'sidebar://browser/abc' }],
      expanded: true
    })
    assert.equal(openStatusPage(sidebar), 'focused')
    assert.deepEqual(sidebar.calls.focused, ['tab-7'])
    assert.deepEqual(sidebar.calls.opened, [], 'a second press must not mint another tab')
    assert.equal(sidebar.calls.toggled, 0, 'an expanded column must be left alone')
  })

  it('expands a collapsed column before revealing the tab', () => {
    // `focus` is a no-op for a tab the user cannot see, so the column has to be
    // open before the reveal is worth anything.
    const sidebar = sidebarFor({
      tabs: [{ sessionId: 's1', tabId: 'tab-7', kind: BROWSER_KIND, contentId: 'sidebar://browser/abc' }],
      expanded: false
    })
    assert.equal(openStatusPage(sidebar), 'focused')
    assert.equal(sidebar.calls.toggled, 1)
    assert.deepEqual(sidebar.calls.focused, ['tab-7'])
  })

  it('ignores a browser tab that belongs to another session', () => {
    // `focus` is a no-op outside the on-screen layout, so counting another
    // session's tab as "already open" would make the shortcut do nothing.
    const sidebar = sidebarFor({
      tabs: [{ sessionId: 'other', tabId: 'tab-9', kind: BROWSER_KIND, contentId: 'sidebar://browser/xyz' }]
    })
    assert.equal(openStatusPage(sidebar), 'opened')
    assert.deepEqual(sidebar.calls.opened, [{ kind: BROWSER_KIND, opts: { params: { url: STATUS_URL } } }])
  })

  it('ignores a non-browser tab in the same session', () => {
    const sidebar = sidebarFor({
      tabs: [{ sessionId: 's1', tabId: 'tab-1', kind: 'guide', contentId: 'sidebar://guide' }]
    })
    assert.equal(openStatusPage(sidebar), 'opened')
  })
})
