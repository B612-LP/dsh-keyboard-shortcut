# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-19

### Added

- **A configurable cycle scope for the model shortcut.** The new Keyboard
  Shortcuts page section "Model cycling" takes a comma-separated text: the
  `Cmd`/`Ctrl`+`3` cycle then only walks models whose id, display name, or
  provider contains one of those texts (case-insensitive substrings). A
  conversation between flash models is `flash`; a single provider is its id.
  Leaving the field empty cycles every model, as before. The current
  selection sitting outside the scope starts the cycle at the first scoped
  model; a scope matching nothing reports "No model matches the cycle
  scope." and changes nothing.

## [0.3.1] - 2026-10-19

### Changed

- **The model-cycle default on macOS is now <kbd>Cmd</kbd>+<kbd>3</kbd>**
  (was <kbd>Ctrl</kbd>+<kbd>3</kbd>). The declaration uses the `primary`
  modifier there, which the desktop reservation check admits; Windows and
  Linux keep <kbd>Ctrl</kbd>+<kbd>3</kbd>. An explicitly saved binding
  continues to win over the default.

## [0.3.0] - 2026-10-19

### Added

- **`Ctrl+3` cycles to the next model** (Desktop). One press moves the
  session to the next model in the composer picker's display order — the
  account provider first, then the official one, then every other provider in
  catalog order — and wraps to the first after the last. The write goes
  through the same shared `modelDirectories` selection the picker uses, so the
  seat, the shortcut, and the next request can never disagree. A conversation
  before its first message cycles from the model the seat already shows, and
  the current reasoning effort rides along whenever the target model
  advertises the same level id, falling back to the target model's own
  default otherwise. A catalog with no second model reports "No other model
  is available to cycle to." instead of writing a no-op selection.

## [0.2.1] - 2026-10-19

### Fixed

- **Reasoning-effort shortcuts work on a conversation before its first
  message.** `Ctrl+1`/`Ctrl+2` read the session's `modelSelection` projection
  directly, and a brand-new session has never seen that key — the projection
  store reads `undefined` until a value is pushed — so every step reported
  "no model selection" (shown as "this model has no reasoning effort levels")
  on a fresh conversation while the composer's own picker displayed a model
  and level just fine. `stepEffort` now resolves the selection through the
  same shared `modelDirectories` surface the picker renders: the projection's
  `next` when present, otherwise the directory's effective `current`, which
  for a blank session is the catalog default. A Host accepts
  `selectModel` on a blank session (it installs the selection for the next
  request), so the stepped level applies to the first message. Clamping and
  the projection-wins-over-default ordering are unchanged. A carried test
  pins the blank-session path; the old "no selection anywhere" refusal keeps
  its test with a directory-shaped mock.

## [0.2.0] - 2026-10-16

### Added

- **`Alt+A` opens the DeepSeek status page in the sidebar browser** (Desktop).
  The page is reused: a second press reveals the browser tab that is already
  open, expanding the column first if it is collapsed, instead of piling up
  duplicate tabs. The sidebar's own `openTab` cannot do this — the browser tab
  type is registered `multiple: true`, so it always mints a new tab — so the
  lookup is done against the sidebar's tab inventory before opening. A tab
  belonging to another session is ignored, because the sidebar only reveals tabs
  in the session on screen.
- **`Ctrl+L` expands or collapses the task list** (Desktop). DSH keeps the
  collapsed state inside the panel component and publishes no handle, so the
  shortcut presses the same header button a click would. A session with no task
  list renders no panel at all, which is reported as "no task list is open"
  rather than treated as a failure.

### Fixed

- **`Ctrl+Q`, `Ctrl+1` and `Ctrl+2` reported their capability as unavailable.**
  The Remote permission namespace is a Cordis service named
  `remote.permissionPresets`, not a property of the `remote` service, and the
  `sessions` and `modelDirectories` services were read as bare context
  properties. Cordis rejects all three reads for a plugin that does not declare
  them in `inject`, so every shortcut failed its resolution no matter how the
  session was configured and the generic "unavailable" notice was shown. They
  are now resolved with `ctx.get`, the lookup form that works for any provided
  service. The on-screen pickers were never affected because they belong to
  plugins that do declare these services.
- **The settings page rendered three `+` signs per binding.** DSH's
  `describeBinding` already returns a presentation array carrying its own `+`
  separators (`['Ctrl', '+', 'Q']` on Windows), and the page added a second
  separator while rendering. Keycaps are now drawn verbatim, matching the
  `ShortcutKeys` primitive, so wide combinations keep their single separator
  and chords (`Ctrl+K`, `C`) stay adjacent as the service intends.
- **Every row on the settings page reported a conflict with itself.** The page
  asked `describeBinding` about the row's own binding, and that function
  answers for an arbitrary candidate: it lists every command holding the
  combination, and a binding trivially overlaps itself. Each row therefore
  accused itself — `Ctrl+Q` naming `keyboard-shortcut.cycle-permission`,
  `Ctrl+1` naming `keyboard-shortcut.effort-down`. The row's own id is now
  filtered out before the hint is rendered, matching the shipped shortcut
  editor, so only genuine conflicts with other commands are shown.

## [0.1.0] - 2026-10-14

Initial release.

### Added

- **Keyboard shortcuts settings page.** A page in DSH's Settings panel, placed
  directly after General, listing this plugin's editable bindings, a read-only
  reference of every other registered command, and the input-optimisation
  switch.
- **Keyboard glyph on the settings navigation row.** Drawn in the product icon
  language — 16×16 box, `currentColor` outline strokes, 1.25 unit weight — and
  applied with a CSS mask because DSH chooses navigation icons with a hardcoded
  switch on the section id.
- **`Ctrl+/` opens the settings page.** Claimed through the shortcut preference
  layer, so it appears as a customised binding and can be restored. The built-in
  shortcut reference moves off that key and stays reachable from Settings →
  General → Edit shortcuts.
- **`Ctrl+Q` cycles the permission mode** (Desktop Windows and macOS). The mode
  list is read live from the Host catalog and followed when it changes, so modes
  contributed by other plugins are included.
- **`Ctrl+1` and `Ctrl+2` step the reasoning effort** down and up (Desktop). Steps
  clamp at both ends rather than wrapping, because the level past the maximum is
  usually "off".
- **`PgUp` and `PgDn` move between inputs.** They activate DSH's turn rail marks,
  so history paging and scroll compensation stay owned by the feature that
  implements them. Because DSH's shortcut registry rejects `PageUp`/`PageDown` as
  binding codes, these two keys are read from the raw input stream instead of
  being registered, and appear on the settings page as read-only rows.
- **Input-optimisation switch** (off by default). Rotates the composer's Enter
  gestures: Enter inserts a line break, `Ctrl+Enter` sends, and `Shift+Enter`
  uses the complementary Queue/Steer action.
- **Transient notices** for permission-mode changes, reasoning-effort changes,
  end stops, and unavailable capabilities.

### Notes

- Both preferences are stored per device in browser storage, beside the key
  bindings DSH itself stores there. One machine's choice cannot rewrite
  another's.
- Every integration degrades to "the feature is unavailable" rather than breaking
  the interface.

[Unreleased]: https://github.com/OZONGO/dsh-keyboard-shortcut/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/OZONGO/dsh-keyboard-shortcut/releases/tag/v0.2.0
[0.1.0]: https://github.com/OZONGO/dsh-keyboard-shortcut/releases/tag/v0.1.0
