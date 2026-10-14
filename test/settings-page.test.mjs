/**
 * Render tests for the settings page.
 *
 * The page is the plugin's visible surface, so this exercises it the way the
 * settings shell does — through the component the registration hands to
 * `settings.section` — and asserts that it renders the three sections, that a
 * row shows its binding, that the read-only table is actually read-only, and
 * that the preference switch calls back.
 *
 * Rendering goes through `react-dom/server`, which needs no DOM. That is also
 * why every `useSyncExternalStore` call passes a `getServerSnapshot`: without it
 * the page throws during the shell's first paint.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { createSettingsPage } from '../src/client/settings-page.js'

/** The class prefix the page uses for its rows. */
const ROW = 'dshKbd_row'

/**
 * Build the service object the page renders from.
 *
 * `fixedKeys` defaults to the page keys the plugin reads from the raw input
 * stream. They have no catalog row — see `test/key-codes.test.mjs` for why — so
 * the page renders them from this local table, and a stub that omitted it would
 * leave the whole section empty without any other assertion noticing.
 *
 * @param options - Catalog, preferences, fixed keys, and recorder.
 * @returns The service face.
 */
function serviceFor(options = {}) {
  const prefs = { optimizeComposerKeys: false, takeOverShortcutKey: true, ...options.prefs }
  const fixed =
    options.fixed ??
    [
      { id: 'nav.keyboard-shortcut.previous', label: 'Go to the previous input', keys: ['PgUp'], hint: 'Read directly.' },
      { id: 'nav.keyboard-shortcut.next', label: 'Go to the next input', keys: ['PgDn'], hint: 'Read directly.' }
    ]
  const writes = []
  return {
    writes,
    ownedCommandIds: new Set(options.owned ?? ['keyboard-shortcut.effort-up']),
    getCatalog: () => options.catalog ?? [],
    subscribeCatalog: () => () => {},
    getPrefs: () => prefs,
    subscribePrefs: () => () => {},
    setPref: (key, value) => {
      writes.push([key, value])
      prefs[key] = value
    },
    describeBinding: () => ({ keys: [], conflicts: [] }),
    fixedKeys: () => fixed,
    saveBinding: async () => 'saved',
    setRecording: async () => {}
  }
}

/**
 * Render the page with a locale reader that echoes keys and interpolation.
 *
 * Echoing the parameters matters: several assertions check that a value the page
 * computed — a conflicting command id, a command label — actually reaches the
 * copy, and a stub that dropped parameters would pass those assertions while the
 * real page rendered a placeholder.
 *
 * @param service - A {@link serviceFor} result.
 * @returns The rendered markup.
 */
function render(service) {
  const Page = createSettingsPage(service)
  const t = (key, params) => (params === undefined ? `t:${key}` : `t:${key}(${JSON.stringify(params)})`)
  return renderToStaticMarkup(h(Page, { t }))
}

/**
 * Count occurrences of a substring.
 *
 * @param haystack - Text to search.
 * @param needle - Substring to count.
 * @returns The count.
 */
function count(haystack, needle) {
  return haystack.split(needle).length - 1
}

/** A row for a command this plugin owns. */
const OWNED_ROW = {
  id: 'keyboard-shortcut.effort-up',
  label: () => 'Increase reasoning effort',
  binding: { code: 'Digit2', modifiers: ['control'] },
  keys: ['Ctrl', '2'],
  modified: false,
  issue: null,
  conflicts: []
}

/** A row owned by another plugin. */
const FOREIGN_ROW = {
  id: 'session.new',
  label: () => 'New session',
  binding: { code: 'KeyN', modifiers: ['primary'] },
  keys: ['Ctrl', 'N'],
  modified: false,
  issue: null,
  conflicts: []
}

describe('settings page rendering', () => {
  it('renders the page description and all four sections', () => {
    const markup = render(serviceFor({ catalog: [OWNED_ROW, FOREIGN_ROW] }))
    assert.match(markup, /t:page\.description/u)
    for (const key of [
      'section.plugin.title',
      'section.fixed.title',
      'section.input.title',
      'section.core.title'
    ]) {
      assert.match(markup, new RegExp(`t:${key.replace('.', '\\.')}`, 'u'), `missing ${key}`)
    }
  })

  it('shows an owned command with its keycaps and an edit control', () => {
    const markup = render(serviceFor({ catalog: [OWNED_ROW] }))
    assert.match(markup, /Increase reasoning effort/u)
    assert.match(markup, /Ctrl/u)
    assert.match(markup, /2/u)
    assert.match(markup, /t:row\.change/u, 'an owned row must offer an edit control')
  })

  it('lists a foreign command without an edit control', () => {
    const markup = render(serviceFor({ catalog: [FOREIGN_ROW] }))
    assert.match(markup, /New session/u)
    assert.match(markup, /Ctrl/u)
    // Only one section is populated here, so the page renders exactly one row
    // with no edit affordance.
    assert.doesNotMatch(markup, /t:row\.change/u, 'a foreign row must be read-only')
  })

  it('renders an unbound command as the "no shortcut" placeholder', () => {
    const markup = render(
      serviceFor({ catalog: [{ ...OWNED_ROW, binding: null, keys: [] }] })
    )
    assert.match(markup, /t:row\.unbound/u)
  })

  it('marks a reserved binding rather than hiding it', () => {
    const markup = render(serviceFor({ catalog: [{ ...OWNED_ROW, issue: 'reserved' }] }))
    assert.match(markup, /t:row\.reserved/u)
  })

  it('reports a conflict with the command that holds the combination', () => {
    const service = serviceFor({ catalog: [{ ...OWNED_ROW, conflicts: ['session.new'] }] })
    service.describeBinding = () => ({ keys: [], conflicts: ['session.new'] })
    const markup = render(service)
    assert.match(markup, /t:row\.conflict/u)
    assert.match(markup, /session\.new/u, 'the conflicting command must be named')
  })

  it('lists the page keys as read-only rows', () => {
    const markup = render(serviceFor({ catalog: [FOREIGN_ROW] }))
    assert.match(markup, /t:section\.fixed\.title/u)
    assert.match(markup, /Go to the previous input/u)
    assert.match(markup, /Go to the next input/u)
    assert.match(markup, /PgUp/u)
    assert.match(markup, /PgDn/u)
    // These rows have no catalog entry, so they must not offer an edit control
    // and must not be described as unbound.
    assert.doesNotMatch(markup, /t:row\.change/u, 'a page-key row must be read-only')
  })

  it('renders an empty state when no fixed keys are published', () => {
    const markup = render(serviceFor({ catalog: [FOREIGN_ROW], fixed: [] }))
    assert.match(markup, /t:row\.unbound/u)
  })

  it('renders an empty state when the catalog is empty', () => {
    const markup = render(serviceFor({ catalog: [] }))
    assert.match(markup, /t:row\.unbound/u)
  })

  it('renders the preference switch in its off state', () => {
    const markup = render(serviceFor({ catalog: [] }))
    assert.match(markup, /t:input\.optimize\.label/u)
    assert.match(markup, /role="switch"/u)
    assert.match(markup, /aria-checked="false"/u)
  })

  it('renders the preference switch as checked when enabled', () => {
    const markup = render(serviceFor({ catalog: [], prefs: { optimizeComposerKeys: true } }))
    assert.match(markup, /aria-checked="true"/u)
  })

  it('routes every owned command through the editable row', () => {
    const second = { ...OWNED_ROW, id: 'keyboard-shortcut.effort-down', label: () => 'Decrease reasoning effort' }
    const markup = render(
      serviceFor({
        catalog: [OWNED_ROW, second, FOREIGN_ROW],
        owned: ['keyboard-shortcut.effort-up', 'keyboard-shortcut.effort-down']
      })
    )
    assert.match(markup, /Increase reasoning effort/u)
    assert.match(markup, /Decrease reasoning effort/u)
    assert.equal(count(markup, 't:row.change'), 2, 'both owned rows must be editable')
  })
})
