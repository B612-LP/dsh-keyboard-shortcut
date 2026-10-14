# Contributing

Thanks for considering a contribution. This document covers the ground rules and
the workflow.

## Before you start

Open an issue describing what you intend to change. For a behaviour change, that
avoids building something that conflicts with how DSH works — several of the
integrations here are shaped by constraints that are not obvious from the outside
and are documented in [docs/design.md](docs/design.md).

## Ground rules

These are the conventions the existing code follows. A change that breaks one of
them needs to say why.

**Comments explain why, not what.** The code says what it does. Comments carry
the reasoning that is not recoverable from the code: which interface is being
read, why it is the only one available, and what happens when DSH changes it.

**Every integration that reads another package's interface opens with a
docblock** naming the interface, its owner, why no supported alternative exists,
and the failure mode. That is the information a future maintainer needs when DSH
changes shape beneath them.

**Nothing throws into a user's session.** Activation dereferences only injected
services; everything else is reached defensively and reports "unavailable". A
recoverable problem is logged through `ctx.logger` or shown as a notice.

**Degrade, never break.** An integration that cannot find what it needs disables
its own feature and leaves the rest of the interface alone.

**JSDoc on every exported symbol**, with `@param` and `@returns`. The type
declarations are generated from these, and the modules are read on their own.

**No new runtime dependencies** without discussing it first. The browser half
depends on React and nothing else, which is what keeps it loading in any
composition that has a GUI at all.

## Workflow

```sh
git clone https://github.com/OZONGO/dsh-keyboard-shortcut.git
cd dsh-keyboard-shortcut
npm install
npm test          # build check plus the suite
```

1. Branch from `main`.
2. Make the change, with tests.
3. Run `npm run build` and commit the updated `lib/` — it is committed on purpose,
   and `npm run check` fails if it does not match the sources.
4. Update the docs the change affects: `README.md`, `README.zh-CN.md`,
   `docs/shortcuts.md` for any binding change, `docs/design.md` for any
   architectural one.
5. Add a `CHANGELOG.md` entry under `Unreleased`.
6. Open a pull request describing the change and how it was verified.

## Tests

```sh
npm test                          # everything, including the build check
npm run test:unit                 # the suite only
node --test test/prefs.test.mjs   # one file
```

Two suites exist because of specific defects rather than for coverage, and both
should be extended rather than worked around:

- **`activation.test.mjs`** mounts the plugin against a context that withholds
  everything outside the `inject` list. Add a case here when you add a service
  the plugin needs at mount time.
- **`manifest.test.mjs`** reproduces the packaging checks the client-module
  kernel performs. Extend it when the package layout changes.

If you fix a bug, add the test that would have caught it.

## Verifying a change against a running DSH

Behaviour that depends on another plugin — the settings shell, the composer, the
turn rail — cannot be covered by unit tests. Verify it live:

1. Install into a test profile: `dsh plugin --profile <profile> add file:<path>`.
2. Rebuild, then copy `lib/` into the installed package as described in
   [docs/development.md](docs/development.md) — a `file:` dependency is copied,
   not linked.
3. Toggle the bundle off and on in **Settings → Plugins** to recompose.
4. Confirm the registrations through the Host Inspect providers, then exercise
   the shortcut by hand.

Say in the pull request what you exercised and what you saw.

## Reporting a bug

Include:

- DSH version (`dsh --version`) and platform.
- The plugin version.
- What you did, what you expected, and what happened.
- Anything from the browser console or the Host log. The plugin names itself in
  every message it emits (`dsh-keyboard-shortcut`), and a degraded integration
  logs a single warning explaining what it could not find.

## Scope

In scope: the settings page, the shortcuts it documents, the input-optimisation
switch, and their integration with DSH.

Out of scope, and better raised with DSH itself: the behaviour of the composer's
keymap, the permission-mode catalog, the model selector, and the turn rail. This
plugin deliberately reuses those rather than reimplementing them, so a change to
their behaviour belongs upstream.

## License

By contributing you agree that your contribution is licensed under the
[MIT License](LICENSE).
