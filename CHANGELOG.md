# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  implements them.
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
