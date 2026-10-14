/**
 * @module dsh-keyboard-shortcut
 *
 * Host half of `dsh-keyboard-shortcut`.
 *
 * ## Why this file exists at all
 *
 * The plugin's behaviour is entirely browser-side, but a client half is not
 * loaded on its own. `@deepseek-ai/dsh-client-modules` discovers browser halves
 * by scanning the live Loader entries and reading each enabled entry's package
 * `dsh.client` declaration; a package with no Host row is never scanned, so its
 * `client.js` is never served under `/plugins` and never registered as a
 * factory. This module is therefore a deliberate no-op that gives the package
 * that Host row.
 *
 * The row is inserted by `cordis.patch.yml`, which DSH applies because
 * `package.json` declares `dsh.bundle.patch`.
 *
 * ## Why `apply` is empty and stays empty
 *
 * Everything this plugin does — the Settings page, the shortcut commands, the
 * composer key remap — is client work reached through `ctx.slots` and
 * `ctx.shortcuts`, both of which are Client-side Cordis services. The Host
 * performs no enforcement, stores no state, and exposes no Remote for this
 * plugin, so there is nothing for a Host half to register.
 *
 * @example
 * // cordis.patch.yml, applied from dsh.profile.bundles:
 * - insert:
 *     - id: keyboard-shortcut
 *       name: 'dsh-keyboard-shortcut'
 */

/**
 * The Cordis plugin name. DSH reads it for diagnostics and for the Plugins
 * page; it must match the `name` in `cordis.patch.yml`.
 */
export const name = 'dsh-keyboard-shortcut'

/**
 * Mount the Host half.
 *
 * Intentionally empty: this package's Host plane owns no service, no Remote,
 * and no configuration schema. See the module docblock for why the plugin
 * needs a Host row even though it registers nothing here.
 *
 * @param _ctx - the Host plugin context, unused.
 * @returns Nothing.
 */
export function apply(_ctx) {}
