/**
 * @module dsh-keyboard-shortcut/status-page
 *
 * Opens the DeepSeek status page in the right sidebar's browser, reusing the
 * browser page that is already there.
 *
 * ## Why the plugin performs the reuse itself
 *
 * `ctx.sidebarRight.openTab('browser', …)` always mints a new tab. The browser
 * tab type is registered `multiple: true`, and the controller derives a multiple
 * type's content address as `sidebar://browser/<uuid>`, so two calls can never
 * land on one tab. The deduplicating path is the layout store's own
 * `openContent` action, which focuses an existing page when the content address
 * is exactly `sidebar://browser` — but that path carries no `params`, so it
 * cannot also hand the page a URL, and the public face offers no way to address
 * it. `openResource` is not an alternative either: it accepts only
 * `dsh-resource://` addresses and throws for a page address.
 *
 * The plugin therefore reads the controller's own open-tab inventory, which
 * publishes `{sessionId, tabId, kind, contentId}` for every session, and focuses
 * an existing browser tab itself. Only when the on-screen session has none does
 * it ask for a new tab, which is also the only case where a URL must be
 * supplied.
 *
 * ## What the controller will and will not do
 *
 * `focus(tabId)` is a no-op for a tab outside the on-screen session's layout, and
 * `openTab` throws when no session surface is mounted, so both paths are gated on
 * `screen()` rather than on a `try`/`catch`. The column expands itself on any
 * open, so only the reuse path needs an explicit expansion.
 *
 * If DSH later exposes "reveal this address, reusing the tab that already holds
 * it", this module should call that instead and the inventory read should be
 * deleted.
 */

/** The page this shortcut exists for. */
export const STATUS_URL = 'https://status.deepseek.com/'

/** The sidebar tab kind that renders a web page. */
const BROWSER_KIND = 'browser'

/**
 * Open the status page, or reveal the browser page already showing in the
 * on-screen session.
 *
 * @param sidebar - The `sidebarRight` face, or `undefined` when the plugin that
 * provides it is not mounted.
 * @returns `'focused'` when an existing browser tab was revealed, `'opened'`
 * when a new one was requested, `'no-sidebar'` without the service, or
 * `'no-session'` without a session surface to open into.
 */
export function openStatusPage(sidebar) {
  if (sidebar === undefined) return 'no-sidebar'

  const screen = typeof sidebar.screen === 'function' ? sidebar.screen() : undefined
  if (screen === undefined) return 'no-session'
  const sessionId = screen.sessionId

  const tabs = sidebar.openTabs?.getSnapshot?.() ?? []
  const existing = tabs.find((tab) => tab.kind === BROWSER_KIND && tab.sessionId === sessionId)
  if (existing !== undefined) {
    // Content the user cannot see is not opened, and a collapsed column would
    // hide the tab this shortcut is meant to reveal.
    if (sidebar.isExpanded?.() !== true) sidebar.toggleExpanded?.()
    sidebar.focus?.(existing.tabId)
    return 'focused'
  }

  sidebar.openTab(BROWSER_KIND, { params: { url: STATUS_URL } })
  return 'opened'
}

export { BROWSER_KIND }
