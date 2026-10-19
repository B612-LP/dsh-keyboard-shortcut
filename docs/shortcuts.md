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
| <kbd>Cmd</kbd>+<kbd>3</kbd> (macOS) / <kbd>Ctrl</kbd>+<kbd>3</kbd> | `keyboard-shortcut.cycle-model` | Cycle to the next model, wrapping at the end | `desktop:*` |
| <kbd>Alt</kbd>+<kbd>A</kbd> | `keyboard-shortcut.status-page` | Open the DeepSeek status page in the sidebar browser | `desktop:*` |
| <kbd>Ctrl</kbd>+<kbd>L</kbd> | `keyboard-shortcut.toggle-todos` | Expand or collapse the task list | `desktop:*` |
| <kbd>PgUp</kbd> | — | Go to the previous input | All |
| <kbd>PgDn</kbd> | — | Go to the next input | All |

All seven commands are rebindable. The two page keys have no command id at all:
they are read by the plugin rather than registered, so they appear on the
settings page as read-only rows. The reason is covered under
[Why the page keys have no binding](#why-the-page-keys-have-no-binding).

## Why some defaults are Desktop-only

DSH validates a command's default bindings against a reservation table before
registering the command, and rejects a reserved combination outright.

| Combination | Verdict | Reason |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Q</kbd> | Reserved, except Desktop Windows and macOS | `KeyQ` with the primary modifier is on the reservation list |
| <kbd>Ctrl</kbd>+<kbd>1</kbd> / <kbd>Ctrl</kbd>+<kbd>2</kbd> | Not an admitted browser combination | A one-modifier digit chord is not in the Web allowlist |
| <kbd>Alt</kbd>+<kbd>A</kbd> | Not an admitted browser combination | A single non-primary modifier is not in the Web allowlist, and `Ctrl+A` is reserved |
| <kbd>Ctrl</kbd>+<kbd>L</kbd> | Not an admitted browser combination | `KeyL` is not in the Web allowlist, and a browser owns the key |
| <kbd>PgUp</kbd> / <kbd>PgDn</kbd> | Rejected for editable commands | A combination with no modifier fails the "modifier required" rule |

The two Desktop profiles short-circuit the reservation check, which is why
<kbd>Ctrl</kbd>+<kbd>Q</kbd> is declared for those two only. An omitted profile
is simply unbound, so the command still exists everywhere and can be assigned by
hand; it just ships without a default where the combination cannot work.

For macOS the modifier is written literally as `control` rather than as
`primary`, so the shortcut is <kbd>Ctrl</kbd>+<kbd>Q</kbd> and not
<kbd>Cmd</kbd>+<kbd>Q</kbd>, which is the system quit shortcut. The same rule
applies to <kbd>Ctrl</kbd>+<kbd>L</kbd>, which would otherwise become the
<kbd>Cmd</kbd>+<kbd>L</kbd> the browser and the application both claim, and to
<kbd>Alt</kbd>+<kbd>A</kbd>, which would otherwise become the
<kbd>Cmd</kbd>+<kbd>A</kbd> "select all".

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

### `keyboard-shortcut.cycle-model` — cycle to the next model

Steps to the next model in the composer picker's display order — the account
provider first, then the official one, then every other provider in catalog
order — and wraps to the first after the last.

- **Blocked** with "No session is open." when no session is bound.
- **Blocked** for an addressed subagent session, whose selection belongs to its
  parent.
- Shows a notice naming the new model, joined with the applied effort when one
  was set explicitly.
- A conversation before its first message cycles from the model the seat
  already shows — the catalog default — because the read goes through the same
  shared directory the picker renders from.
- The current reasoning effort rides along only when the target model
  advertises the same level id; otherwise the switch applies the target
  model's own default, and a target without reasoning control omits the
  effort entirely.
- A catalog with no second model shows "No other model is available to cycle
  to." and changes nothing.

### `keyboard-shortcut.status-page` — open the DeepSeek status page

Opens <https://status.deepseek.com/> in the sidebar browser.

- **Blocked** with "No session is open." when no session is on screen. The
  sidebar's own commands behave the same way: a column is always bound to a
  session, so a shortcut with no session has nothing to attach a tab to.
- **Reuses the open page.** A second press reveals the browser tab that is
  already there instead of opening another one, and expands the column first if
  it is collapsed.
- A tab belonging to another session is not treated as "already open": the
  sidebar only reveals tabs in the session on screen, so counting it would make
  the shortcut do nothing.
- **Not delivered** inside a modal.
- The URL is fixed. Rebinding the key does not change it; the sidebar browser's
  own address bar is still the way to navigate anywhere else.

### `keyboard-shortcut.toggle-todos` — expand or collapse the task list

Toggles the checklist DSH shows above the composer.

- Shows "No task list is open." when the session has no checklist. DSH renders
  nothing at all for an empty list, so an absent panel is the "nothing to toggle"
  case rather than a failure.
- Expands a collapsed list and collapses an expanded one; the header's own
  chevron and `aria-expanded` state are what change, so the panel behaves exactly
  as if the header had been clicked.
- **Not delivered** inside a modal.
- The list is expanded by default when a turn writes one, and collapses again
  when the next turn starts, so this shortcut is for reading back a list that has
  already scrolled past.

### Page navigation — move between inputs

Activates the turn rail's own mark for the previous or next turn.

- These two keys have **no command id and no catalog row**. They are read
  directly by the plugin, so they do not appear in DSH's shortcut reference and
  cannot be rebound. See [Why the page keys have no binding](#why-the-page-keys-have-no-binding).
- A turn is anchored at its first user message, so "previous input" means
  "previous turn".
- If the target mark is not mounted, the rail is scrolled to bring it in and the
  shortcut retries over a bounded number of animation frames.
- Shows "No previous/next input to move to." at either end of the transcript.
- Shows "No turn navigator is available for this session." when the layout has
  none — for example a transcript narrower than the rail's container threshold.
- **Not delivered** inside a modal, or inside a terminal, which owns
  <kbd>PgUp</kbd>/<kbd>PgDn</kbd> for its own scrollback.

#### Why the page keys have no binding

DSH's shortcut registry accepts a closed set of physical codes. `normalizeBinding`
rejects anything that is not `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `F1`–`F24`, or one
of `Slash, Comma, Period, Backslash, Backquote, Minus, Equal, BracketLeft,
BracketRight, Semicolon, Quote, Enter, Escape, Space, Tab, Backspace, Delete,
ArrowUp, ArrowDown, ArrowLeft, ArrowRight`. <kbd>PageUp</kbd> and
<kbd>PageDown</kbd> are not in that table, and `registerFixed` normalizes every
declared binding up front, so it throws `Unsupported shortcut code: PageUp`.

The registry is therefore never asked to hold these keys. Instead the plugin
subscribes with `observeFixedInput`, which the keyboard layer feeds every
keydown before DSH's own dispatch — registration has no bearing on whether the
observer fires. The keys work on every platform; they are simply invisible to
the catalog, which is why the settings page draws them from a local table as
read-only rows.

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
