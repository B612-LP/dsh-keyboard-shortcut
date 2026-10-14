/**
 * @module dsh-keyboard-shortcut/todo-toggle
 *
 * Expands or collapses the task list DSH renders above the composer.
 *
 * ## Why this drives the DOM
 *
 * The list is DSH's own `TodoPanel`. It renders from the `todos` session
 * projection and keeps its collapsed state in a component-local `useState(true)`,
 * so it always starts collapsed and exposes no handle an outside plugin could
 * flip: the projection is read-only, and no client service publishes that bit.
 * The header is therefore the only control that exists, and pressing it is the
 * only way to toggle the list.
 *
 * ## Why the selectors are what they are
 *
 * The panel is found by the stable `data-testid="todo-panel"` attribute DSH
 * writes, not by its hashed CSS-module classes, and the header is the panel's
 * only `button`. DSH renders nothing at all when the projection is empty, so a
 * missing panel is not a failure — it is the "no task list" case, reported as
 * `unavailable` so the caller can say so.
 *
 * ## Scoping
 *
 * Several conversation surfaces can be mounted at once — the main view and any
 * sidebar chat tab — each with its own dock and its own list. The composer
 * region is preferred so the shortcut acts on the conversation the user is
 * reading; the first panel found is the fallback for layouts whose markers this
 * module does not recognise.
 *
 * If DSH later publishes the collapse state, this module should call that and
 * the DOM work should be deleted.
 */

/** The panel DSH renders for the `todos` projection. */
const PANEL_SELECTOR = '[data-testid="todo-panel"]'

/** The conversation region that owns the dock the panel sits in. */
const COMPOSER_REGION = '[data-conversation-region="composer"]'

/**
 * Find the task-list panel belonging to the active conversation.
 *
 * @param doc - Owning document.
 * @returns The panel, or `undefined` when no list is rendered.
 */
function findPanel(doc) {
  const panels = [...doc.querySelectorAll(PANEL_SELECTOR)]
  if (panels.length === 0) return undefined

  const region = doc.querySelector(COMPOSER_REGION)
  if (region === null) return panels[0]
  return panels.find((panel) => region.contains(panel)) ?? panels[0]
}

/**
 * Toggle the task list by pressing its header.
 *
 * @param doc - Owning document, or `undefined` outside a browser frame.
 * @returns `'toggled'` when the header was pressed, `'unavailable'` when there
 * is no list to toggle.
 */
export function toggleTodoList(doc) {
  if (doc === undefined) return 'unavailable'

  const panel = findPanel(doc)
  if (panel === undefined) return 'unavailable'

  const header = panel.querySelector('button')
  if (header === null) return 'unavailable'

  header.click()
  return 'toggled'
}

export { PANEL_SELECTOR, COMPOSER_REGION }
