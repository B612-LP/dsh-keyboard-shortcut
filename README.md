# dsh-keyboard-shortcut

A Keyboard Shortcuts settings page for DeepSeek Harness (DSH), with permission-mode
cycling, reasoning-effort stepping, prompt navigation, and an optional composer
key remap.

[中文文档](README.zh-CN.md)

## Overview

`dsh-keyboard-shortcut` adds one page to DSH's Settings panel and five shortcuts
to the application. The page lists every binding in the running application,
lets you change the ones this plugin owns, and carries a switch for remapping the
composer's Enter keys.

Every shortcut this plugin adds is an ordinary DSH command. It appears in the
shortcut reference, it can be rebound, and it respects the same conflict rules as
the built-in commands.

## Requirements

| Requirement | Minimum |
|---|---|
| DeepSeek Harness | `0.2.0-rc.2` |
| Node.js (for building from source) | `22.12.0` |

This plugin is a **client plugin**: everything it does happens in the browser
half. Its Host half is an empty `apply` that exists only so DSH serves the
browser bundle.

## Install

Install into a profile with the DSH plugin command:

```sh
dsh plugin --profile <profile> add dsh-keyboard-shortcut
```

Then restart the profile, or toggle the bundle off and on from **Settings →
Plugins** if the profile reloads live.

## What you get

### A Keyboard Shortcuts settings page

**Settings → Keyboard shortcuts** sits directly after General. It has three
sections:

- **Plugin shortcuts** — the commands this plugin owns, each row editable. Click
  a row, press a combination, and it saves. Press Escape to cancel.
- **Input optimisation** — the composer key switch described below.
- **Application shortcuts** — every other registered command, read-only. This is
  the table that makes a binding conflict comprehensible: when a combination is
  refused, the row that already owns it is visible right there.

### Shortcuts

| Shortcut | Action | Platforms |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Q</kbd> | Cycle to the next permission mode | Desktop Windows, macOS |
| <kbd>Ctrl</kbd>+<kbd>1</kbd> | Lower the reasoning effort one level | Desktop |
| <kbd>Ctrl</kbd>+<kbd>2</kbd> | Raise the reasoning effort one level | Desktop |
| <kbd>PgUp</kbd> | Go to the previous input | All |
| <kbd>PgDn</kbd> | Go to the next input | All |
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | Open this plugin's settings page | All |

<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>/</kbd> is the built-in shortcut reference's
default binding. This plugin claims it through the shortcut preference layer, so
the reference dialog moves off that key and stays reachable from **Settings →
General → Edit shortcuts**. Turning the switch off restores the original
binding.

### Input optimisation

When enabled, the composer's three Enter gestures rotate:

| Stroke | Default | With input optimisation |
|---|---|---|
| <kbd>Enter</kbd> | Send | Insert a line break |
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> | Complementary Queue/Steer | Send |
| <kbd>Shift</kbd>+<kbd>Enter</kbd> | Insert a line break | Complementary Queue/Steer |

The switch is off by default.

## Configuration

The plugin reads two preferences from browser storage. Both are off-by-default
except the shortcut takeover, and both are per device.

| Key | Default | Meaning |
|---|---|---|
| `optimizeComposerKeys` | `false` | Rotate the composer's Enter gestures |
| `takeOverShortcutKey` | `true` | Give <kbd>Ctrl</kbd>+<kbd>/</kbd> to this plugin |

Preferences live in `localStorage` under `dsh.keyboard-shortcut.v1`, beside the
key bindings DSH itself stores per device. They are not in the Host settings
document, so one machine's choice cannot rewrite another's.

Changing a binding through the settings page writes to the same store DSH's own
shortcut editor uses: `localStorage` on Web, and `userData/keybindings.json`
under Electron.

## Permissions

The plugin requests no elevated permissions. It reads the session projections
DSH already publishes to the browser and runs the same `/permission` command the
built-in picker runs. It performs no filesystem access and no network requests.

## Known limitations

- **Cycle and effort shortcuts are Desktop-only by default.** DSH reserves
  <kbd>Ctrl</kbd>+<kbd>Q</kbd> outside Desktop Windows and macOS, and browsers
  claim <kbd>Ctrl</kbd>+<kbd>1</kbd>…<kbd>Ctrl</kbd>+<kbd>8</kbd> for tab
  switching. Both commands exist on every platform and can be bound by hand; they
  simply ship unbound where the combination cannot work.
- **Prompt navigation drives the turn rail.** DSH publishes no service for
  jumping to a turn, so the shortcut activates the rail's own marks. A turn is
  anchored at its first user message, so "previous input" means "previous turn".
- **The composer remap is a DOM-layer integration.** The composer's keymap is
  private to `dsh-client-ui-conversation`; the option rewrites an event's
  modifier flags rather than reimplementing the send logic. See
  [docs/design.md](docs/design.md) for the reasoning and the failure mode.
- **The settings navigation glyph is a DOM patch.** DSH chooses navigation icons
  with a hardcoded switch on the section id and offers no icon field on the
  registration, so the glyph is applied with a CSS mask.
- **Recording loses React state.** Rebinding re-registers the command and
  re-renders the page, like any catalog change.

## Development

```sh
npm install
npm run build      # writes lib/index.js and lib/client.js
npm test           # build check + unit tests
npm run watch      # rebuild the client half on change
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/development.md](docs/development.md).

## Documentation

- [docs/design.md](docs/design.md) — architecture and the decisions behind it
- [docs/shortcuts.md](docs/shortcuts.md) — every binding, its owner, and its
  failure modes
- [docs/development.md](docs/development.md) — building, testing, releasing

## License

[MIT](LICENSE)
