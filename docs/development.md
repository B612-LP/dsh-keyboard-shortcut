# Development

How to build, test, install for local development, and release
`dsh-keyboard-shortcut`.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | `>=22.12.0` | `npm test` runs the suite with `node --test` |
| npm | any recent | only for installing dev dependencies |

Nothing else is needed. The build uses esbuild; the tests use Node's built-in
test runner and no test framework.

## Setup

```sh
git clone https://github.com/OZONGO/dsh-keyboard-shortcut.git
cd dsh-keyboard-shortcut
npm install
npm run build
```

## Layout

```
src/host/index.js        Host half — an empty apply, and the docblock explaining why
src/client/
  index.js               composition root: owns stores, wires every registration
  locales.js             en/zh dictionaries
  prefs.js               the two preferences, in browser storage
  icons.js               the keyboard glyph
  nav-icon.js            DOM patch that puts the glyph on the settings row
  slots.js               defensive readers over the slot ledger
  settings-page.js       the settings page component
  notices.js             the transient feedback surface
  open-settings.js       opens the page, and owns the Ctrl+/ takeover
  permission-cycle.js    permission-mode cycling
  effort-step.js         reasoning-effort stepping
  prompt-nav.js          previous/next input
  composer-keys.js       the Enter-gesture remap
scripts/build.mjs        the build
lib/                     build output, committed
test/                    unit, activation, and manifest tests
docs/                    design, shortcuts, development
```

`lib/` is committed on purpose. DSH loads `lib/client.js` directly, and several
local installation paths — a `file:` dependency, a linked workspace, a tarball —
copy the package rather than re-resolving it, so a stale `lib/` is the most
common cause of "my change did nothing".

## Build

```sh
npm run build     # write lib/index.js and lib/client.js
npm run watch     # rebuild the client half on change
npm run check     # fail if lib/ is not what the sources would produce
```

`npm run build` prints a content digest per artifact and whether it changed, so a
build that did nothing is visible rather than assumed.

`npm run check` is what CI runs to enforce that committed output matches the
sources. It compares built bytes against committed bytes rather than
re-building-and-trusting.

### What the build produces

- **`lib/index.js`** — the Host half, copied verbatim. It is hand-written ESM
  with no dependencies, so bundling it would only strip the JSDoc that explains
  why it exists.
- **`lib/client.js`** — the browser half, wrapped in the module-registration
  envelope the browser kernel expects:

  ```js
  window.__ModuleLoader__.load({
    id: 'dsh-keyboard-shortcut',
    factory: (require) => { /* bundled CommonJS */ return module.exports },
  })
  ```

  `react` is marked external and left as a `require` call, because the kernel's
  platform table already provides it and a second copy would break hooks.

## Test

```sh
npm test          # build check + the whole suite
npm run test:unit # the suite only
node --test test/prefs.test.mjs   # one file
```

| Suite | Covers |
|---|---|
| `prefs.test.mjs` | The preference store under absent, throwing, and unreadable storage |
| `composer-keys.test.mjs` | The gesture table and the property rewrite, including a non-extensible event |
| `nav-icon.test.mjs` | The mask data URI and the slot readers, including the shell's sort order |
| `locales.test.mjs` | Key-set and placeholder parity between languages |
| `manifest.test.mjs` | Every packaging fact the client-module kernel validates |
| `activation.test.mjs` | That `apply` survives a context carrying only its declared services |

Two of these exist because of specific defects rather than for coverage:

- **`activation.test.mjs`** mounts the plugin against a fake context that
  withholds everything outside the `inject` list, which is what a real first
  mount looks like. The most expensive defect found during development was an
  activation-time throw that removed every registration at once while the Host
  still reported the row `active` — the page simply never appeared.
- **`manifest.test.mjs`** reproduces the kernel's own manifest checks, so a
  packaging mistake fails a local test instead of looking like a live-graph
  problem.

## Install for local development

DSH's plugin manager owns the profile manifest, and it rewrites `package.json`
when it recomposes. Editing the profile by hand therefore works only until the
running app next writes it — use the CLI:

```sh
dsh plugin --profile <profile> add file:/absolute/path/to/dsh-keyboard-shortcut
```

Then restart the profile, or toggle the bundle off and on from **Settings →
Plugins** to recompose a live profile.

### Two traps worth knowing

**`file:` dependencies are copied, not linked.** pnpm dereferences the directory,
so editing the sources and rebuilding does not change what the app loads. After
`npm run build`, copy the artifacts into the installed package and recompose:

```sh
cp lib/client.js lib/index.js \
  "$DSH_HOME/profiles/<profile>/node_modules/dsh-keyboard-shortcut/lib/"
```

Then toggle the bundle off and on. Check that the installed file's digest matches
`npm run build`'s output if a change seems to have no effect.

**A recomposition is needed for a new client row.** Adding a package to a profile
does not retroactively add it to the browser page's boot graph. Toggling the
bundle off and on re-runs the scan; a full restart is the reliable option.

### Verifying against a running instance

The Host exposes read-only Inspect providers. After enabling the plugin:

- `Slots` with root `settings.section` should list this plugin's section at its
  configured order.
- `Slots` with root `shell.overlay` should list `keyboard-shortcut-notices`.
- `Config` with name `dsh-keyboard-shortcut` should report the Host row.

On Electron, the key-binding overrides land in
`%APPDATA%/@deepseek-ai/dsh-desktop/keybindings.json`; on Web they land in
`localStorage` under `dsh.keybindings.v1`.

## Conventions

**Comments explain why, not what.** The code says what it does. Comments carry
the reasoning that is not recoverable from the code: which interface is being
read, why it is the only one available, and what happens when it changes. Every
module that reads another package's interface opens with that argument.

**Integration modules open with a docblock** naming the interface, its owner, why
no supported alternative exists, and the failure mode. This is the information a
future maintainer needs when DSH changes shape beneath them.

**Nothing throws into a user's session.** Activation dereferences only injected
services; everything else is reached defensively and reports "unavailable". A
recoverable problem is logged or shown as a notice.

**Degrade, never break.** An integration that cannot find what it needs disables
its own feature and leaves the rest of the GUI alone.

**JSDoc on every exported symbol**, including `@param` and `@returns`, because
the type declarations are generated from these and the modules are read on their
own.

## Releasing

1. Update `CHANGELOG.md`; move `Unreleased` entries under the new version.
2. Bump `version` in `package.json`.
3. Update `dsh.compatibility.dshReleases` for any DSH release this version was
   verified against. Record compatibility per release as evidence rather than as
   a range.
4. `npm test` — the suite includes the build check, so this also proves the
   committed artifacts match the sources.
5. `npm pack --dry-run` and confirm the tarball contains `lib/`, `src/`, `docs/`,
   and `cordis.patch.yml`.
6. Tag `v<version>` and push the tag with the commit.
7. `npm publish` — `prepack` rebuilds, so the published artifacts always match
   the tag.

### What counts as a breaking change

Changing any identifier a user or another plugin can depend on requires a major
version: command ids (`keyboard-shortcut.*`, `fixed.keyboard-shortcut.*`), the
section id (`keyboard-shortcut`), the storage key
(`dsh.keyboard-shortcut.v1`), and the locale namespace (`keyboard-shortcut`).

Adding a shortcut, a preference, or a settings section is a minor release.
Behaviour fixes that change no identifier are patches.

### Before publishing

- `README.md` and `README.zh-CN.md` describe the shipped behaviour, including
  every platform restriction.
- `docs/shortcuts.md` matches the defaults in `src/client/index.js`.
- No `console.log` left behind; recoverable problems go through the Cordis
  logger.
- The `.ref/` and `.tools/` directories are development aids and are not
  published; confirm with `npm pack --dry-run`.
