/**
 * @module dsh-keyboard-shortcut/icons
 *
 * The keyboard glyph used for this plugin's Settings navigation row.
 *
 * ## Matching the product icon set
 *
 * DSH's icons are hand-authored outline artwork, not a third-party icon font:
 * every one of them is a 16x16 `viewBox` with `fill="none"`, `stroke`
 * `currentColor`, round joins, and a 1.3 stroke width for the "Medium" weight
 * (`ICON_MEDIUM_STROKE` in `@deepseek-ai/dsh-client-ui-primitives`). This glyph
 * copies those conventions exactly — same box, same stroke, same caps — so it
 * sits beside the shipped gear, user, data, agent-preset and archive glyphs
 * without reading as foreign.
 *
 * ## Geometry
 *
 * The body is a 13 x 7 rounded rectangle inset one pixel from the 16px box, so
 * it optically matches the weight of the shipped rounded-rectangle icons. Keys
 * are one-unit ticks on a 2.4-unit pitch in two rows, with a wider space bar on
 * the third row, which stays legible at the 16px render size the settings
 * navigation uses.
 *
 * @example
 * ctx.slots.register({ ..., navIcon: keyboardIcon })
 */

/** Stroke width matching DSH's "Medium" icon weight. */
export const ICON_MEDIUM_STROKE = 1.3

/**
 * Build the keyboard icon as an inline SVG source string.
 *
 * The result is raw SVG markup rather than a React element so the same glyph
 * can be injected as a CSS mask by the navigation-icon patch, which runs
 * outside React and must not hold a reference to a React node.
 *
 * @param options - Optional rendering options.
 * @param options.size - Rendered edge length in CSS pixels. Defaults to 16.
 * @param options.strokeWidth - Outline weight in viewBox units. Defaults to
 * {@link ICON_MEDIUM_STROKE}.
 * @returns SVG markup with no XML declaration, safe to inline or to encode as a
 * `data:` URI.
 */
export function keyboardIconSvg({ size = 16, strokeWidth = ICON_MEDIUM_STROKE } = {}) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 16 16" fill="none" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    // Body: 13 x 7 rounded rectangle, 1px inset from the 16px box.
    `<rect x="1.65" y="4.5" width="12.7" height="7" rx="1.5" stroke="currentColor"/>` +
    // Upper key row, four keys on a 2.8-unit pitch.
    `<path d="M4.15 6.65h.01" stroke="currentColor"/>` +
    `<path d="M6.95 6.65h.01" stroke="currentColor"/>` +
    `<path d="M9.75 6.65h.01" stroke="currentColor"/>` +
    `<path d="M11.85 6.65h.01" stroke="currentColor"/>` +
    // Lower key row, three keys.
    `<path d="M4.15 8.35h.01" stroke="currentColor"/>` +
    `<path d="M6.95 8.35h.01" stroke="currentColor"/>` +
    `<path d="M9.75 8.35h.01" stroke="currentColor"/>` +
    // Space bar: the widest key, centred.
    `<path d="M4.65 10.05h6.7" stroke="currentColor"/>` +
    `</svg>`
  )
}
