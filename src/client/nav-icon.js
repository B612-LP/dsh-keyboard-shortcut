/**
 * @module dsh-keyboard-shortcut/nav-icon
 *
 * Puts a keyboard glyph on this plugin's Settings navigation row.
 *
 * ## Why this needs a DOM patch
 *
 * DSH's Settings shell chooses navigation icons with a hardcoded switch on the
 * section id (`navIcon(id)` in `@deepseek-ai/dsh-client-ui-settings-general`).
 * It knows five ids — `account`, `models`, `agent-presets`, `plugins`,
 * `archived-sessions` — and falls back to the settings gear for anything else.
 * The `settings.section` registration contract carries only `id`, `order`, and
 * `label`; there is no icon slot, and the projection the shell builds from
 * `ctx.slots.entries('settings.section')` has no icon field either. A
 * third-party section therefore cannot ask for its own glyph through any
 * supported interface, and this plugin's section would show a second gear next
 * to DSH's own General row.
 *
 * So the glyph is applied at the DOM layer: find the navigation row, mark its
 * `<button>`, and draw the glyph with a CSS `::before` mask while hiding the
 * gear the shell drew.
 *
 * ## Why a mark plus CSS, and not replacing the `<svg>`
 *
 * That `<svg>` is a node React owns. `replaceWith()` would hand React a
 * detached child, and the row's unmount would then call `removeChild` on a node
 * that is no longer its child, which throws inside React's commit phase and
 * takes the Settings panel down with it. This module never touches the
 * structure: it adds one `data-*` attribute React does not diff and paints the
 * glyph from a pseudo-element, so React stays unaware.
 *
 * ## How a row is identified
 *
 * Preferred key: the section's index in the ledger. The shell renders the
 * navigation as `ctx.slots.entries('settings.section')` sorted by priority then
 * `order`, and this module reads the same ledger in the same order, so indices
 * correspond without depending on display text or locale.
 *
 * Fallback key: the row's label text. The ledger is authoritative, but a shell
 * revision could add a child to the navigation list; when the indexed button's
 * label disagrees with the expected text, the module searches by label instead
 * of marking the wrong row.
 *
 * ## Failure behaviour
 *
 * Every stage degrades to "no glyph, gear stays":
 *
 * 1. No `document`, `document.body`, or `MutationObserver` — not installed, one
 *    warning.
 * 2. Glyph cannot be rendered — not installed, one warning.
 * 3. Target row not found, or the label disagrees — nothing marked, no throw.
 * 4. Panel opened and closed repeatedly — the observer re-marks, idempotently.
 *
 * A future DSH that accepts an icon in the `settings.section` registration
 * makes this module and its call site removable.
 */

/**
 * A glyph to place on one navigation row.
 *
 * @typedef {object} NavIconTarget
 * @property {string} id - Section id as registered on `settings.section`.
 * @property {() => string} label - Current display text of that section, read
 * fresh on every scan so a language change is picked up by re-marking.
 * @property {() => string} renderSvg - Renders the glyph as inline SVG source.
 */

/** Style element identity, following DSH's `data-plugin-css` convention. */
const STYLE_TAG = 'dsh-keyboard-shortcut/nav-icon.css'

/** Mark attribute. React never diffs it, so it survives re-renders. */
const MARK = 'data-dsh-keyboard-shortcut-nav'

/** Panel root: the shell portals it to `document.body`. */
const PANEL_SELECTOR = '[data-shortcut-modal="settings"]'

/**
 * Class-name fragments. CSS Modules hash the prefix per build, so only the
 * source-written name is matched — the same technique `dsh-pet` uses, and the
 * reason this keeps working across DSH rebuilds.
 */
const LIST_SELECTOR = '[class*="navList"]'
const CELL_SELECTOR = '[class*="navCell"]'
const LABEL_SELECTOR = '[class*="navLabel"]'

/**
 * Convert inline SVG source into a CSS `mask` value.
 *
 * Two details are load-bearing:
 *
 * - `xmlns`. React-rendered DOM SVG omits the namespace, but a `data:` URI is
 *   parsed as a standalone image document, where a missing namespace renders
 *   nothing.
 * - `currentColor`. A mask reads only alpha, and `currentColor` has no meaning
 *   in an isolated document; it is pinned to opaque black so the mask is solid
 *   and the visible colour comes from `background-color: currentColor`.
 *
 * @param svg - Inline SVG source.
 * @returns A `url("data:image/svg+xml,…")` value, or an empty string when the
 * input is empty.
 */
export function svgMaskUri(svg) {
  const source = svg.trim()
  if (source === '') return ''
  const namespaced = /<svg[^>]*\sxmlns=/iu.test(source)
    ? source
    : source.replace(/<svg\b/iu, '<svg xmlns="http://www.w3.org/2000/svg"')
  return `url("data:image/svg+xml,${encodeURIComponent(namespaced.split('currentColor').join('#000'))}")`
}

/**
 * Build the stylesheet that hides the shipped gear and draws `glyph`.
 *
 * @param glyph - A CSS mask value from {@link svgMaskUri}.
 * @returns CSS text.
 */
function cssFor(glyph) {
  return [
    `/* Keyboard glyph on this plugin's Settings row: see src/client/nav-icon.js */`,
    `[${MARK}] [class*="navIcon"]{display:none}`,
    `[${MARK}]::before{content:"";flex:none;width:16px;height:16px;` +
      `background-color:currentColor;` +
      `-webkit-mask:${glyph} center/16px 16px no-repeat;` +
      `mask:${glyph} center/16px 16px no-repeat}`
  ].join('\n')
}

/**
 * Inject the stylesheet once per document.
 *
 * @param doc - Owning document.
 * @param glyph - A CSS mask value.
 * @returns Nothing.
 */
function injectCss(doc, glyph) {
  if (doc.querySelector(`style[data-plugin-css="${STYLE_TAG}"]`) !== null) return
  const tag = doc.createElement('style')
  tag.dataset.plugin = 'dsh-keyboard-shortcut'
  tag.dataset.pluginCss = STYLE_TAG
  tag.textContent = cssFor(glyph)
  doc.head.appendChild(tag)
}

/**
 * Read a navigation button's label text.
 *
 * @param cell - The navigation `<button>`.
 * @returns Trimmed label text, or an empty string.
 */
function labelOf(cell) {
  return cell.querySelector(LABEL_SELECTOR)?.textContent?.trim() ?? ''
}

/**
 * Place a glyph on one Settings navigation row.
 *
 * @param target - Section id, label reader, and glyph renderer.
 * @param readIndex - Resolves the row's position in the navigation ledger, or
 * `undefined` when the ledger is unavailable.
 * @returns A disposer that disconnects the observer. Injected styles and
 * existing marks are deliberately left in place: they are inert once the
 * observer stops, and removing them would race React.
 */
export function installNavIcon(target, readIndex) {
  const doc = typeof document === 'undefined' ? undefined : document
  const Observer = typeof MutationObserver === 'undefined' ? undefined : MutationObserver
  if (doc === undefined || Observer === undefined || doc.body === null) {
    console.warn('[dsh-keyboard-shortcut] Settings navigation icon unavailable: no document, body, or MutationObserver')
    return () => {}
  }

  let glyph
  try {
    glyph = svgMaskUri(target.renderSvg())
  } catch (error) {
    console.warn(`[dsh-keyboard-shortcut] Settings navigation icon unavailable: ${describe(error)}`)
    return () => {}
  }
  if (glyph === '') {
    console.warn('[dsh-keyboard-shortcut] Settings navigation icon unavailable: the glyph rendered empty')
    return () => {}
  }

  injectCss(doc, glyph)

  let warned = false

  /**
   * Mark the target row inside one panel, if present.
   *
   * @param panel - The Settings panel element.
   * @returns Nothing.
   */
  const markPanel = (panel) => {
    try {
      const list = panel.querySelector(LIST_SELECTOR)
      if (list === null) return
      const cells = [...list.querySelectorAll(`:scope > ${CELL_SELECTOR}`)]
      if (cells.length === 0) return

      const wanted = target.label()
      const index = readIndex?.()

      // Preferred: the ledger index. Confirm with the label when both exist, so
      // a shell revision that added a navigation child cannot silently shift us
      // onto a neighbouring row.
      if (typeof index === 'number' && index >= 0 && index < cells.length) {
        const candidate = cells[index]
        if (wanted === '' || labelOf(candidate) === wanted) {
          candidate.toggleAttribute(MARK, true)
          return
        }
      }

      // Fallback: match the display text.
      if (wanted === '') {
        if (!warned) {
          warned = true
          console.warn('[dsh-keyboard-shortcut] Settings navigation icon: the section label is empty, so only the ledger index can identify the row')
        }
        return
      }
      const byLabel = cells.find((cell) => labelOf(cell) === wanted)
      if (byLabel === undefined) return
      byLabel.toggleAttribute(MARK, true)
    } catch (error) {
      if (warned) return
      warned = true
      console.warn(`[dsh-keyboard-shortcut] Settings navigation icon failed: ${describe(error)}`)
    }
  }

  /** Re-scan every open panel. */
  const scan = () => {
    for (const panel of doc.querySelectorAll(PANEL_SELECTOR)) markPanel(panel)
  }

  const observer = new Observer(scan)
  // `childList` only: writing our own attribute would otherwise re-enter the
  // callback. React remounting the navigation arrives as a childList change.
  observer.observe(doc.body, { childList: true, subtree: true })
  scan()

  return () => {
    observer.disconnect()
  }
}

/**
 * Render an error as one line.
 *
 * @param error - Thrown value.
 * @returns Message text.
 */
function describe(error) {
  return error instanceof Error ? error.message : String(error)
}
