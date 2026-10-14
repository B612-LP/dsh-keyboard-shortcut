# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/OZONGO/dsh-keyboard-shortcut/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OZONGO/dsh-keyboard-shortcut/releases/tag/v0.1.0
