/**
 * Activation tests for the client half.
 *
 * These catch the class of defect that a pure-function unit test cannot: an
 * `apply` that throws while wiring up, because it dereferenced a service the
 * plugin never declared. A client plugin that throws during activation leaves a
 * failed fiber, and every one of its registrations silently disappears — the
 * page simply never appears.
 *
 * The fake context below is deliberately hostile: services outside the declared
 * `inject` list are **absent**, exactly as they are on a real first mount,
 * before dependent fibers have activated. Anything the plugin needs immediately
 * must therefore be either injected or reached defensively.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Patterned codes the real registry accepts. */
const ACCEPTED_CODES = /^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-9]|2[0-4]))$/u

/** Named codes the real registry accepts. Page Up/Down are absent by design. */
const NAMED_CODES = new Set([
  'Slash', 'Comma', 'Period', 'Backslash', 'Backquote', 'Minus', 'Equal',
  'BracketLeft', 'BracketRight', 'Semicolon', 'Quote', 'Enter', 'Escape',
  'Space', 'Tab', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown',
  'ArrowLeft', 'ArrowRight'
])

/**
 * Load the built client bundle and materialize its factory.
 *
 * @param require - The factory's `require`.
 * @returns The bundle's exports.
 */
function loadClient(require) {
  const source = readFileSync(join(root, 'lib/client.js'), 'utf8')
  let registration
  const previous = globalThis.window
  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        registration = value
      }
    }
  }
  try {
    // eslint-disable-next-line no-eval -- the bundle is a script, not a module.
    ;(0, eval)(source)
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
  assert.notEqual(registration, undefined, 'the bundle must register with __ModuleLoader__')
  return registration.factory(require)
}

/**
 * Build a minimal Cordis-like context.
 *
 * @param provided - Service names that resolve. Anything else resolves to
 * `undefined`, which is what an uninjected service returns in a real tree.
 * @param options - Recording options.
 * @returns The context plus the recorded registrations.
 */
function fakeContext(provided, options = {}) {
  const effects = []
  const slots = []
  const commands = []
  const messages = []
  const observers = []
  const context = {
    effect(body, label) {
      effects.push(label)
      const disposer = body()
      return () => {
        if (typeof disposer === 'function') disposer()
      }
    },
    get(name) {
      return provided[name]
    },
    logger: { warn: (value) => messages.push(String(value)), error: (value) => messages.push(String(value)) },
    locale: provided.locale,
    slots: provided.slots,
    shortcuts: provided.shortcuts
  }
  context.slots = provided.slots ?? {
    inject(key, register) {
      const disposer = register()
      slots.push({ key, disposer })
      return () => disposer?.()
    },
    register(options) {
      slots.push({ key: options.name, options })
      return () => {}
    },
    entries: () => []
  }
  context.shortcuts = provided.shortcuts ?? {
    register(command) {
      commands.push(command)
      return () => {}
    },
    registerFixed(command) {
      // The real registry normalizes every declared binding and throws for a
      // code outside its whitelist. Reproducing that here means a registration
      // the real service would reject cannot pass this test.
      for (const binding of command.bindings) {
        if (!ACCEPTED_CODES.test(binding.code) && !NAMED_CODES.has(binding.code)) {
          throw new Error(`Unsupported shortcut code: ${binding.code}`)
        }
      }
      commands.push(command)
      return () => {}
    },
    observeFixedInput(listener) {
      observers.push(listener)
      return () => {}
    },
    catalog: { getSnapshot: () => [], subscribe: () => () => {} },
    config: { getSnapshot: () => ({ status: 'ready', revision: 'rev-1', document: { profiles: {} } }) },
    edit: async () => ({ status: 'saved', snapshot: {} }),
    recording: async () => {},
    describeBinding: () => ({ keys: [], conflicts: [] })
  }
  return { context, effects, slots, commands, messages, observers }
}

/**
 * Build the locale face a plugin expects.
 *
 * @returns A minimal locale service.
 */
function localeService() {
  return {
    register: () => () => {},
    bind: () => (key, params) => (params === undefined ? key : `${key}:${JSON.stringify(params)}`)
  }
}

describe('client half activation', () => {
  it('exports apply and an inject list', () => {
    const exports = loadClient((spec) => {
      if (spec === 'react') return {}
      throw new Error(`unexpected external: ${spec}`)
    })
    assert.equal(typeof exports.apply, 'function')
    assert.equal(Array.isArray(exports.inject), true)
    assert.deepEqual(exports.inject, ['slots', 'locale', 'shortcuts'])
  })

  it('activates with only its declared services present', () => {
    // The hostile case: `remote`, `sessions`, `uiSession`, `modelDirectories`
    // and `webServer` are all absent, as they are before their fibers activate.
    const provided = { locale: localeService() }
    const { context, effects, messages } = fakeContext(provided)

    const exports = loadClient((spec) => {
      if (spec === 'react') return {}
      throw new Error(`unexpected external: ${spec}`)
    })
    exports.apply(context)

    assert.ok(effects.length > 0, 'activation must register effects')
    assert.deepEqual(
      messages.filter((text) => /Cannot read|null|undefined is not/u.test(text)),
      [],
      'activation must not dereference an uninjected service'
    )
  })

  it('registers the settings section, the notice overlay, and the commands', () => {
    const provided = { locale: localeService() }
    const { context, slots, commands } = fakeContext(provided)

    const exports = loadClient((spec) => {
      if (spec === 'react') return {}
      throw new Error(`unexpected external: ${spec}`)
    })
    exports.apply(context)

    const slotKeys = slots.map((entry) => entry.key)
    assert.ok(slotKeys.includes('settings.section'), 'the settings section must be registered')
    assert.ok(slotKeys.includes('shell.overlay'), 'the notice overlay must be registered')

    const ids = commands.map((command) => command.id)
    for (const id of [
      'keyboard-shortcut.open',
      'keyboard-shortcut.cycle-permission',
      'keyboard-shortcut.effort-up',
      'keyboard-shortcut.effort-down'
    ]) {
      assert.ok(ids.includes(id), `${id} must be registered`)
    }
    // Page Up/Down must NOT be registered: their codes are outside the
    // registry's whitelist, so `registerFixed` would throw for them. The
    // `registerFixed` stub above reproduces that rejection, so this assertion
    // fails if the impossible registration ever comes back.
    assert.equal(
      ids.some((id) => id.startsWith('fixed.')),
      false,
      'no fixed action may be registered for codes the registry rejects'
    )
  })

  it('subscribes to raw fixed input so the page keys still work', () => {
    const provided = { locale: localeService() }
    const { context, observers } = fakeContext(provided)

    const exports = loadClient((spec) => {
      if (spec === 'react') return {}
      throw new Error(`unexpected external: ${spec}`)
    })
    exports.apply(context)

    // The observer is the *only* mechanism behind prompt navigation, so losing
    // it would silently disable Page Up/Down with no registration to blame.
    assert.equal(observers.length, 1, 'exactly one fixed-input observer must be installed')

    // A bare Page Down is navigation; the same key with a modifier is not.
    const seen = []
    const input = (gesture) => ({
      type: 'keydown',
      gesture: { composing: false, defaultPrevented: false, alt: false, control: false, meta: false, shift: false, ...gesture },
      context: { modal: null, region: 'page' },
      consume: () => seen.push('consumed')
    })
    observers[0](input({ code: 'KeyA' }))
    assert.deepEqual(seen, [], 'an unrelated key must be ignored')
    observers[0](input({ code: 'PageDown', control: true }))
    assert.deepEqual(seen, [], 'a modified page key belongs to someone else')
  })

  it('survives a shortcut registration that conflicts with another plugin', () => {
    const provided = { locale: localeService() }
    const { context, commands, messages } = fakeContext(provided)
    const original = context.shortcuts.register
    context.shortcuts.register = (command) => {
      // Simulate a deployment where another plugin already claimed the default.
      if (command.id === 'keyboard-shortcut.cycle-permission') {
        throw new Error('Reserved shortcut default: keyboard-shortcut.cycle-permission')
      }
      return original(command)
    }

    const exports = loadClient((spec) => {
      if (spec === 'react') return {}
      throw new Error(`unexpected external: ${spec}`)
    })
    exports.apply(context)

    assert.ok(
      commands.some((command) => command.id === 'keyboard-shortcut.open'),
      'a conflicting sibling must not prevent the other commands'
    )
    assert.ok(
      messages.some((text) => text.includes('cycle-permission')),
      'the conflict must be reported once, as a warning'
    )
  })
})
