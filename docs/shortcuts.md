# Shortcuts

Every binding this plugin adds, what delivers it, and how it behaves when the
underlying capability is missing.

## Bindings

| Shortcut | Command id | Action | Default profiles |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | `keyboard-shortcut.open` | Open this plugin's settings page | All, via the preference layer |
| <kbd>Ctrl</kbd>+<kbd>Q</kbd> | `keyboard-shortcut.cycle-permission` | Cycle to the next permission mode | `desktop:windows`, `desktop:macos` |
| <kbd>Ctrl</kbd>+<kbd>1</kbd> | `keyboard-shortcut.effort-down` | Lower the reasoning effort one level | `desktop:*` |
| <kbd>Ctrl</kbd>+<kbd>2</kbd> | `keyboard-shortcut.effort-up` | Raise the reasoning effort one level | `desktop:*` |
| <kbd>PgUp</kbd> | `fixed.keyboard-shortcut.previous` | Go to the previous input | All (fixed action) |
| <kbd>PgDn</kbd> | `fixed.keyboard-shortcut.next` | Go to the next input | All (fixed action) |

All six are rebindable except the two fixed actions, which are read-only rows in
the shortcut reference — the same treatment DSH gives Enter, Shift+Enter and
Escape.

## Why some defaults are Desktop-only

DSH validates a command's default bindings against a reservation table before
registering the command, and rejects a reserved combination outright.

| Combination | Verdict | Reason |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Q</kbd> | Reserved, except Desktop Windows and macOS | `KeyQ` with the primary modifier is on the reservation list |
| <kbd>Ctrl</kbd>+<kbd>1</kbd> / <kbd>Ctrl</kbd>+<kbd>2</kbd> | Not an admitted browser combination | A one-modifier digit chord is not in the Web allowlist |
| <kbd>PgUp</kbd> / <kbd>PgDn</kbd> | Rejected for editable commands | A combination with no modifier fails the "modifier required" rule |

The two Desktop profiles short-circuit the reservation check, which is why
<kbd>Ctrl</kbd>+<kbd>Q</kbd> is declared for those two only. An omitted profile
is simply unbound, so the command still exists everywhere and can be assigned by
hand; it just ships without a default where the combination cannot work.

For macOS the modifier is written literally as `control` rather than as
`primary`, so the shortcut is <kbd>Ctrl</kbd>+<kbd>Q</kbd> and not
<kbd>Cmd</kbd>+<kbd>Q</kbd>, which is the system quit shortcut.

Page Up and Page Down take the fixed-action route instead, which skips the
reservation table entirely. That is the same route DSH's own Enter and Escape
rows take, and it is why a bare key can work here at all.

## Behaviour reference

### `keyboard-shortcut.open` — open the settings page

Opens the Settings panel on the Keyboard shortcuts section.

- Reports `handled`; the action is asynchronous and reports its own failures.
- If the panel's store handle is unreachable, falls back to clicking the panel's
  navigation row, opening the panel first if needed.
- Fails silently after a bounded number of frames rather than throwing into the
  keyboard dispatcher.

### `keyboard-shortcut.cycle-permission` — cycle the permission mode

Advances one step through the modes the Host currently advertises, wrapping at
the end.

- **Blocked** with "No session is open." when no session is bound.
- Shows a notice naming the new mode on success.
- A session sitting on an unlisted value — `custom`, or a preset the Host has
  since removed — advances to the first advertised option.
- Unavailable when the Host serves no permission catalog.
- The mode list is read live, so a plugin that adds or removes a mode is followed
  without a restart.
- The step is immediate: it does not route through the confirmation dialog the
  built-in picker shows for the most permissive modes.

### `keyboard-shortcut.effort-up` / `.effort-down` — step the reasoning effort

Moves one level along the model's advertised escalation ladder.

- **Blocked** with "No session is open." when no session is bound.
- **Blocked** for an addressed subagent session, whose selection belongs to its
  parent.
- Shows a notice naming the new level on success.
- At either end it shows "Already at the highest/lowest reasoning effort." and
  changes nothing. It does **not** wrap: the level past the maximum is usually
  `off`, so wrapping would silently disable reasoning.
- A model that advertises no levels reports that instead.
- An unknown current level is treated as sitting before the first one, so the
  first press establishes a concrete level.

### `fixed.keyboard-shortcut.previous` / `.next` — move between inputs

Activates the turn rail's own mark for the previous or next turn.

- A turn is anchored at its first user message, so "previous input" means
  "previous turn".
- If the target mark is not mounted, the rail is scrolled to bring it in and the
  shortcut retries over a bounded number of animation frames.
- Shows "No previous/next input to move to." at either end of the transcript.
- Shows "No turn navigator is available for this session." when the layout has
  none — for example a transcript narrower than the rail's container threshold.
- **Not delivered** inside a modal, or inside a terminal, which owns
  <kbd>PgUp</kbd>/<kbd>PgDn</kbd> for its own scrollback.

## The input-optimisation switch

A separate switch on the settings page rotates the composer's three Enter
gestures. It is not a set of bindings; the strokes stay hardcoded in DSH and the
switch changes which role each one plays.

| Stroke | Switch off | Switch on |
|---|---|---|
| <kbd>Enter</kbd> | Send | Insert a line break |
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> | Complementary Queue/Steer | Send |
| <kbd>Shift</kbd>+<kbd>Enter</kbd> | Insert a line break | Complementary Queue/Steer |

The switch is off by default, so a fresh install changes nothing until it is
turned on.

It stands down — leaving stock behaviour — while an IME is composing, while the
slash or mention menu is open, outside the composer, and for
<kbd>Alt</kbd>+<kbd>Enter</kbd> or <kbd>Ctrl</kbd>+<kbd>Meta</kbd>+<kbd>Enter</kbd>.

## Customising

Every editable binding can be changed from **Settings → Keyboard shortcuts** by
clicking its row and pressing a new combination, or removed with the button
beside it. "Restore default" returns one command to its shipped binding.

The same changes appear in DSH's own shortcut reference and can be made there
instead; both write to the same per-device store.

### The Ctrl+/ takeover

`keyboard-shortcut.open` has no declared default. Its <kbd>Ctrl</kbd>+<kbd>/</kbd>
binding is written as an explicit user override, paired with clearing
`shortcuts.open`:

```json
{
  "schemaVersion": 2,
  "profiles": {
    "desktop:windows": {
      "shortcuts.open": null,
      "keyboard-shortcut.open": { "code": "Slash", "modifiers": ["primary"] }
    }
  }
}
```

Two consequences follow from that, and both are intended:

- **The takeover is visible and reversible.** Both commands appear in the
  shortcut reference as customised rows, and "Restore default" on either undoes
  its half.
- **It is not applied over a user's own choice.** If `shortcuts.open` has already
  been customised, the plugin leaves it alone.

Turning off `takeOverShortcutKey` restores both defaults.

## Conflicts

A combination belongs to one command. When recording a new binding, the
preference layer refuses a combination that another command already holds, and
the page marks the row with the id it collides with. The read-only **Application
shortcuts** table lists those other commands, which is what makes the refusal
legible.

At registration time the same rule applies to declared defaults: if another
mounted plugin already claims one of the combinations above, that single command
is skipped and a warning is logged, while the rest of the plugin stays
available.
