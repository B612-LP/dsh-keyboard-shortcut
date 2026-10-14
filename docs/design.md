# Design

This document explains how `dsh-keyboard-shortcut` is built and why each
integration is shaped the way it is. It assumes familiarity with DSH's plugin
model: a Cordis tree of Loader rows, a Host half and a browser half per client
plugin, and slots as the sanctioned way for one plugin to add UI to another's
surface.

## Goals and non-goals

**Goals**

1. Add a Keyboard Shortcuts page to the Settings panel that matches the shipped
   pages in layout and behaviour.
2. Reuse DSH's own machinery wherever it exists, so the plugin cannot drift from
   the features it drives.
3. Keep every integration survivable: if an interface the plugin reads changes
   shape, the feature disappears and the rest of the GUI keeps working.
4. Ship every shortcut as an ordinary, rebindable DSH command.

**Non-goals**

- Reimplementing the shortcut recorder, the permission picker, the model
  selector, or the turn rail.
- Owning any state the Host already owns. The plugin stores two booleans and
  nothing else.
- Supporting environments DSH itself cannot deliver a combination to.

## Package shape

```
dsh-keyboard-shortcut/
├── package.json          dsh.bundle.patch + dsh.client declarations
├── cordis.patch.yml      the one Host Loader row
├── src/host/index.js     empty apply (see below)
├── src/client/           the browser half, one module per integration
├── lib/                  build output, committed
└── test/                 unit, activation, and manifest tests
```

### Why an empty Host half

A browser half is not loaded on its own. `@deepseek-ai/dsh-client-modules`
discovers browser halves by scanning the live Loader entries and reading each
enabled entry's `dsh.client` declaration. A package with no Host row is never
scanned, so its `client.js` is never served and never registered as a factory.

`src/host/index.js` is therefore a deliberate no-op that gives the package that
row. It owns no service, no Remote, and no configuration schema.

### Why the client bundle is wrapped

The browser kernel does not load plugin code as an ES module. Each served bundle
must call `window.__ModuleLoader__.load({id, factory})` while it executes; the
kernel records the registration and runs the factory later, when the module is
first materialized. Everything a bundle does at module scope must therefore be
inside the factory closure — which is what `scripts/build.mjs` produces.

`react` is the only external. Bundling a second copy would break hooks; the
kernel's platform table already provides one.

### Why preferences are not in the Host settings document

DSH's usual home for a feature preference is the Host settings document, reached
through `ctx.configForms.get(entryId)`. That requires the owning package to have
a Host row carrying a configuration schema, because the schema is what the Host
serves and what the settings mirror projects.

Both preferences here are properties of *this browser's* keyboard, and the key
bindings they sit beside are already device-local (`localStorage` on Web,
`userData/keybindings.json` under Electron). Keeping the switches in the same
place means one device's choice cannot rewrite another's, and it keeps the Host
half a true no-op.

The cost is explicit: a profile reset that clears site data resets the switches.

## The five integrations

Each integration reads an interface owned by another package. Those interfaces
are catalogued here with the reason each is used and what happens when it is
absent.

### 1. The settings page — `settings.section`

**Interface used.** `ctx.slots.inject('settings.section', …)` with a registration
carrying `id`, `order`, `label`, and a component. The component receives the
section's owner props, whose only member is `close`.

**Why it is enough.** The section ledger is the sanctioned additive seat, and
`replaceRisk` is `none`: a fresh id is added beside the shipped entries rather
than replacing one. The page renders in the panel's content column, so it
inherits the shell's scrolling, geometry, and background.

**Styling.** The page reuses the shipped General-settings row rhythm — a 52px
minimum row, 12px block padding, a hairline `--dsw-alias-border-l2` divider, and
a right-aligned control — and reads every colour from the theme tokens
(`--dsw-alias-label-primary`, `--dsw-alias-label-tertiary`,
`--dsw-alias-bg-module-platform`, `--dsw-alias-interactive-bg-hover`). It
therefore follows light, dark, and any skin without plugin-specific overrides.

**Absent interface.** `ctx.slots` is injected, so the page cannot be missing
while the plugin is mounted.

### 2. The navigation glyph — a DOM patch

**The gap.** DSH chooses Settings navigation icons with a hardcoded switch on the
section id:

```js
function navIcon(id) {
  if (id === 'account') return <IconUserOutlineMedium … />
  if (id === 'models') return <IconDataOutlineMedium … />
  if (id === 'agent-presets') return <IconAgentPresetOutlineMedium … />
  if (id === 'plugins') return <IconPersonalizationOutlineMedium … />
  if (id === 'archived-sessions') return <IconArchiveOutlineMedium … />
  return <IconSettingsOutlineMedium … />   // the gear
}
```

The `settings.section` registration contract carries only `id`, `order`, and
`label`; the ledger projection the shell builds has no icon field; and
`navIcon` is module-private. A third-party page cannot ask for its own glyph
through any supported interface, and this plugin's row would otherwise show a
second gear directly beneath DSH's own General row.

**The workaround.** `src/client/nav-icon.js` finds the row, marks its `<button>`
with a `data-*` attribute, and paints the glyph from a CSS `::before` mask while
hiding the gear the shell drew.

**Why the node is marked rather than replaced.** That `<svg>` is a node React
owns. `replaceWith()` would leave React holding a detached child, and the row's
unmount would then call `removeChild` on a node that is no longer its child —
which throws inside React's commit phase and takes the whole Settings panel
down. The patch never touches structure: it adds an attribute React does not
diff and paints from a pseudo-element.

**How the row is found.** Primarily by its index in the slot ledger, because the
shell renders `ctx.slots.entries('settings.section')` sorted by priority then
`order` and this module reads the same ledger the same way — so no display text
or locale is involved. The label is used to *confirm* the indexed row, and as a
fallback if the shell ever adds a navigation child this module does not know
about. Both keys are re-read on every scan, so a language change is picked up.

**The glyph.** `src/client/icons.js` draws a keyboard in the product icon
language: a 16×16 `viewBox`, `fill="none"`, `currentColor` strokes, round joins,
and the 1.3 "Medium" stroke width. It is authored as SVG source rather than a
React element because the patch runs outside React and must not hold a reference
to a React node.

**Data-URI conversion.** Two details are load-bearing. A `data:` URI is parsed as
a standalone image document, so the source needs an explicit `xmlns` (React's
DOM output omits it), and `currentColor` — which has no meaning in an isolated
document — is pinned to opaque black so the mask is solid while the visible
colour still comes from `background-color: currentColor`.

**Failure behaviour.** No `document`, `body`, or `MutationObserver` → not
installed, one warning. Glyph renders empty → not installed, one warning. Row
not found or label disagrees → nothing marked, no throw. Panel opened and closed
repeatedly → the observer re-marks, idempotently.

A future DSH that accepts an icon in the registration makes this module and its
call site removable.

### 3. Ctrl+/ — the shortcut preference layer

**The gap.** The built-in shortcut reference registers `shortcuts.open` with
<kbd>Ctrl</kbd>+<kbd>/</kbd> as its default on every device profile. Two commands
cannot both default to one combination — the registry rejects the second
registration — and a command's `resolve` is owned by whoever registered it, so
the built-in cannot be redirected in place.

**The supported route.** The preference layer, which is what the shipped
shortcut editor itself writes. `src/client/open-settings.js`:

1. clears `shortcuts.open` with an explicit `null` override, then
2. gives this plugin's command the same combination with an explicit override.

Both are ordinary user-level overrides: they appear in the shortcut reference as
customised rows, and "Restore default" on either row undoes them. The order
matters — claiming the combination first would be rejected as a conflict — and
each step re-reads the revision the previous one produced, retrying on `stale`
so a concurrent writer is not fought.

**When nothing is written.** If the user has already customised
`shortcuts.open` themselves, the reconciliation reports `skipped` and leaves it
alone. If the plugin's own switch is off, it restores both defaults instead.

**Why the write is retried at startup.** The built-in command is registered by
another plugin and the catalog only populates once the shortcut service has read
its configuration, so neither may exist when this plugin mounts. The
reconciliation polls until both are present, with a bounded attempt count, and
logs once if it gives up.

**Opening the page.** Two interfaces exist and neither suffices: the
`settings.launcher` slot receives `openSettings()`, which opens the panel but
leaves the section to the shell's memory, and `settings.onboarding` receives
`openSection(id)` but only for a first-run step.

What *is* reachable is the shell's own store handle, which the shell passes as
the `store` option of its `sidebar.settings` registration and which the ledger
publishes through `ctx.slots.entries('sidebar.settings')`. The shell pins that
handle's `create()` to the one live instance, so calling it yields the same store
the panel renders, and its `openSection(id)` action is exactly the operation
needed.

That is an internal shape rather than a contract, so it is treated as a fast
path: when the handle is missing or shaped differently, the module falls back to
clicking the panel's own navigation row. A future DSH that publishes
`openSection` on the launcher props should use that instead.

### 4. Permission cycling — the process catalog plus a slash command

**Why the mode list is read, never hardcoded.** Permission modes are *preset
keys* from the Host plugin's `presets` configuration table, not a closed enum.
The shipped bundles happen to define `read-only`, `workspace-write`, and
`danger-full-access`, which makes the set look fixed, but the table is deployment
data: a profile may rename, add, or remove entries, and
`dsh-permission-presets` publishes a reserved `auto` entry while an Auto-review
integration is mounted. The plugin therefore reads the live catalog and steps
through whatever it advertises — which is what makes it follow a plugin that
changes the list.

| Fact | Source |
|---|---|
| Available modes | `ctx.get('remote.permissionPresets').catalog()` |
| Whether that list changed | `ctx.get('remote').$on('permission-presets/catalog-changed')` |
| Current mode of one session | the session's `permissions` projection |
| Applying a mode | `session.command('/permission <preset>')` |

**Why a command rather than a setter.** There is no client-side setter: `set()`
exists only on the Host service. The shipped picker applies a mode by running the
Host's slash command, and this plugin does the same, which keeps validation and
the durable `permission/preset` event in one place.

**Subscription before first read.** The invalidation event is payload-free — it
says "re-read", not what changed — so a notification landing during the initial
fetch would otherwise be lost and the reader would serve a stale list forever.

**Cycle semantics.** The cycle wraps. A session sitting on an unlisted value
(`custom`, or a preset the Host has since removed) advances to the first option
rather than stalling. The target is validated against the catalog before
submission, because the command result reports whether the command *matched*, not
whether the preset was valid.

**Absent interface.** A deployment without the Remote namespace yields a reader
that reports "unavailable" instead of throwing. This is load-bearing: an earlier
revision dereferenced the namespace during activation, which threw, left a failed
fiber, and silently removed *every* registration in the plugin.
`test/activation.test.mjs` now guards against that class of defect by mounting
the plugin with only its declared services present.

### 5. Reasoning effort — the shared per-session directory

**Where levels come from.** A model advertises its reasoning levels as an
*array* (`model.reasoning.efforts`), and that array order *is* the escalation
order — for the pi-ai adapter it is a subsequence of
`[off, minimal, low, medium, high, xhigh, max]`, filtered by which levels the
deployment declared. Nothing downstream sorts or ranks it, and DSH publishes no
notion of a numeric level or a step helper, so the array is the only ordering
that exists and stepping is this plugin's job.

**Why the shared directory rather than the Remote.** The composer's model seat
and this plugin both need the same answer, and `ctx.get('modelDirectories')` is
the per-session object the seat itself renders from. Reading and writing through it
means the shortcut and the on-screen picker cannot disagree — a direct
`ctx.get('remote.session').selectModel` call would bypass the seat's spinner and its
optimistic state.

**Clamping, not wrapping.** Steps clamp at both ends. Wrapping would be actively
misleading at the top: the next level past the maximum is usually `off`, so a
wrap would silently turn reasoning *off* when the user asked for more. An unknown
or absent current level is treated as sitting before the first one, so the first
press both establishes a concrete level and moves in the pressed direction.

**Absent interface.** `modelDirectories` is read through `ctx.get`, and the
command reports "unavailable" when it is absent or when the session is an
addressed subagent (whose selection belongs to its parent).

### 6. Prompt navigation — the turn rail

**What exists.** DSH's Chat view renders a turn rail: one fixed-pitch mark per
turn, anchored at that turn's first human prompt, where activating a mark pages
history in and lands on the turn. That logic — paging unloaded turns, measuring
the landing, compensating scroll — lives inside the Chat view and is exposed
through no service.

**What the plugin does.** It presses the rail's own marks. Nothing is
re-implemented: the shortcut activates the same buttons a pointer would.

**Why the rail is virtualized.** The rail mounts only the marks near the current
reading position plus an overscan margin, so the neighbouring turn is normally
mounted and the common case is a single click. When the target is outside the
mounted window the module scrolls the rail's own scroller to bring it in — mark
positions are a fixed pitch, so the offset is computed rather than measured, as
the target is not in the DOM to measure — then retries over a bounded number of
animation frames.

**Scoping.** Several conversation surfaces can be mounted at once (the main view
and any right-sidebar chat tabs), each with its own rail. The rail inside the
active conversation region is preferred; the first rail found is the fallback so
the shortcut still works in layouts whose markers the module does not recognise.

**Fallback.** A layout with no usable rail scrolls the transcript to the
neighbouring turn row, which carries its turn number. That path also supplies the
"no input in that direction" answer the rail cannot give, because the rail only
knows the marks it has mounted.

**Terminals and modals.** Both are excluded: a modal owns the keyboard, and a
terminal owns <kbd>PgUp</kbd>/<kbd>PgDn</kbd> for its own scrollback.

**Read raw, not registered.** Page Up and Page Down carry no modifier, which the
shortcut service rejects for an *editable* command outside Desktop Windows and
macOS (`modifier-required`), so a configurable command cannot carry them. A fixed
action cannot either: `registerFixed` normalizes every declared binding through
`normalizeBinding`, whose accepted set is `KeyA`–`KeyZ`, `Digit0`–`Digit9`,
`F1`–`F24` plus a fixed table of named keys that omits the page keys. It throws
`Unsupported shortcut code: PageUp` before the binding is ever stored.

The plugin therefore never asks the registry to hold these keys. It subscribes
with `observeFixedInput`, which the keyboard layer feeds **every** window keydown
before DSH's own dispatch — registration plays no part in whether the observer
fires, so an unmodifiable key still reaches the plugin. The cost is honest and
visible: no catalog row, no rebinding, no entry in DSH's shortcut reference, and
the settings page has to draw the two rows from a local table.

A future DSH that widens the code whitelist should switch to `registerFixed` and
delete the local table; one that publishes a "go to turn" service should call
that service and delete the DOM work here.

A future DSH that publishes a "go to turn" service should call that instead and
the DOM work here should be deleted.

### 7. The composer remap — a modifier rewrite

**The gap.** The composer owns a Lexical keymap whose Enter command branches on
the event's modifier flags:

| Stroke | Stock meaning |
|---|---|
| `Enter` | Send — Queue while busy, Steer when steering |
| `Ctrl`/`Cmd`+`Enter` | The *complementary* Queue/Steer action |
| `Shift`+`Enter` | Line break |

That command is registered on the Lexical editor instance, which no outside
plugin can reach, and the shortcut service reserves every Enter chord except
<kbd>Alt</kbd>+<kbd>Enter</kbd>.

**The approach.** The handler reads the event's own flags, so the plugin rewrites
those flags in place, in the capture phase, and lets the event continue
untouched. The three roles rotate:

| Stroke | With the option on | Flags written |
|---|---|---|
| `Enter` | Line break | `shiftKey = true` |
| `Ctrl`/`Cmd`+`Enter` | Send | all three cleared |
| `Shift`+`Enter` | Complementary Queue/Steer | `ctrlKey = true` |

**Why rewriting rather than intercepting.** The line-break case settles it. The
command returns "not handled" for a shifted Enter, which hands the stroke back to
the browser for its own insertion. Because the original event is still the real,
trusted one, that default action happens normally. A module that swallowed the
key and synthesised a replacement could not reproduce it — untrusted events have
no default action — so the line break would have to be faked through a
`beforeinput` event or `execCommand`, both of which fight the editor instead of
using it.

Rewriting is also confined: one event object, three properties, no
`preventDefault`, no `stopPropagation`, and the browser's own record of which
keys are down is untouched, so nothing downstream misreads the gesture.

**When it stands down.** The option being off, a non-Enter key, IME composition,
a target outside the composer, an inert subtree, an open slash/mention menu
(where Enter must settle the highlighted candidate, so DSH's own arbitration must
see the untouched stroke), or an <kbd>Alt</kbd> or <kbd>Ctrl</kbd>+<kbd>Meta</kbd>
combination (which the stock command already maps to "consume and do nothing").

**Failure mode, stated plainly.** If a future DSH moves the Enter decision out of
a DOM event — to an accelerator registered with the desktop keyboard bridge, say
— the rewritten flags would no longer be the input the composer reads and the
option would stop having an effect. The module detects nothing and breaks nothing
in that case; it simply stops mattering.

## Failure policy

Every integration degrades toward "the feature disappears", never toward "the GUI
breaks".

- **Activation** dereferences only injected services at mount time. Everything
  else goes through `ctx.get` at the moment it is needed, and each command
  reports "unavailable" when its dependency is absent. This is what lets the
  plugin load in a deployment with no model selector, no permission presets, or
  no turn navigator.
- **Command registration** is individually guarded. A conflicting default is a
  deployment fact, not a bug in this package, so that one command is skipped and
  logged while every other contribution stays available.
- **Actions** never throw into the keyboard dispatcher. A failure shows a notice
  or stays silent.
- **Other plugins' registrations** are read defensively. A plugin that reads
  another's registration must degrade to "feature unavailable", never to a broken
  page.

## Testing

| Suite | What it covers |
|---|---|
| `test/prefs.test.mjs` | The preference store under absent, throwing, and unreadable storage |
| `test/composer-keys.test.mjs` | The gesture table and the property rewrite, including a non-extensible event |
| `test/nav-icon.test.mjs` | The mask data URI and the slot readers, including the shell's sort order |
| `test/locales.test.mjs` | Key-set parity and placeholder parity between languages |
| `test/manifest.test.mjs` | Every packaging fact the client-module kernel validates |
| `test/activation.test.mjs` | That `apply` survives a context carrying only its declared services |

`test/activation.test.mjs` exists because the most expensive defect found during
development was an activation-time throw that removed every registration at once
while the Host reported the row `active`. It mounts the plugin against a fake
context that deliberately withholds everything not in the `inject` list, which is
what a real first mount looks like.

`test/manifest.test.mjs` reproduces the kernel's own manifest checks — platform,
`exports["./client"]` shape, file existence, and the ModuleLoader envelope — so a
packaging mistake is caught before it is blamed on the live graph.

## Versioning

The package follows [Semantic Versioning](https://semver.org/).

- **Major** — a change that requires a different DSH release, or that removes or
  renames a preference key or command id.
- **Minor** — a new shortcut, a new preference, or a new settings section.
- **Patch** — behaviour fixes that do not change any identifier a user or another
  plugin can depend on.

Identifiers users can depend on, and which therefore require a major or minor
bump to change: command ids (`keyboard-shortcut.*`), the section id
(`keyboard-shortcut`), the storage key (`dsh.keyboard-shortcut.v1`), and the
locale namespace (`keyboard-shortcut`).

`dsh.compatibility.dshReleases` records per-release compatibility as evidence
rather than as a range, and is updated when the plugin is verified against a DSH
release.
