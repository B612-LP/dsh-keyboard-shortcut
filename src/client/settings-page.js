/**
 * @module dsh-keyboard-shortcut/settings-page
 *
 * The Keyboard Shortcuts settings page.
 *
 * ## Two tables, two owners
 *
 * The page lists *this plugin's* commands as editable rows and every other
 * registered command as read-only reference rows. Editing is confined to this
 * plugin's own commands because a binding belongs to whoever registered the
 * command: rewriting another plugin's binding behind its back would leave that
 * plugin's own settings page displaying a value its owner never chose. The
 * reference table exists so the page still answers "what is this key already
 * doing?", which is the question that makes a conflict understandable.
 *
 * Both tables read one source: `ctx.shortcuts.catalog`, the same observable the
 * shipped shortcut editor uses, so the page cannot drift from the real
 * bindings.
 *
 * ## Recording
 *
 * A row enters recording on click, then captures the first combination the user
 * presses. While recording, the recorder asks the shortcut service to suspend
 * its own interception (`ctx.shortcuts.recording(true)`) — without that, on
 * Desktop the native keyboard bridge would swallow the very stroke being
 * recorded.
 *
 * Releasing the first non-modifier key saves, which matches the shipped
 * editor's behaviour: a combination is complete once its last ordinary key is
 * released. Escape cancels.
 *
 * ## Styling
 *
 * The page uses the same muted divided-row rhythm as DSH's General settings
 * (`min-height`, `16px` block padding, a hairline divider, and a right-aligned
 * control), reading colours from the shared theme tokens so it follows light,
 * dark, and every skin.
 */

import { createElement as h, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { findSectionEntry, labelText, sectionIndex } from './slots.js'

/** Plugin id, used as the style tag identity. */
const STYLE_TAG = 'dsh-keyboard-shortcut/settings-page.css'

/** Class names, hashed the way DSH's CSS Modules are. */
const CSS = {
  root: 'dshKbd_root',
  intro: 'dshKbd_intro',
  section: 'dshKbd_section',
  sectionTitle: 'dshKbd_sectionTitle',
  sectionText: 'dshKbd_sectionText',
  row: 'dshKbd_row',
  rowText: 'dshKbd_rowText',
  rowTitle: 'dshKbd_rowTitle',
  rowHint: 'dshKbd_rowHint',
  control: 'dshKbd_control',
  keys: 'dshKbd_keys',
  key: 'dshKbd_key',
  separator: 'dshKbd_separator',
  button: 'dshKbd_button',
  buttonQuiet: 'dshKbd_buttonQuiet',
  recording: 'dshKbd_recording',
  error: 'dshKbd_error',
  empty: 'dshKbd_empty',
  switchRow: 'dshKbd_switchRow',
  switchTrack: 'dshKbd_switchTrack',
  switchKnob: 'dshKbd_switchKnob',
  switchOn: 'dshKbd_switchOn'
}

const STYLESHEET = `
.${CSS.root}{display:flex;flex-direction:column;gap:20px;padding:0 0 4px;min-width:0}
.${CSS.intro}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
.${CSS.section}{display:flex;flex-direction:column;gap:4px;min-width:0}
.${CSS.sectionTitle}{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:0}
.${CSS.sectionText}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0 0 4px}
.${CSS.row}{box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:52px;padding:12px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.${CSS.rowText}{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.${CSS.rowTitle}{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.${CSS.rowHint}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
.${CSS.control}{display:flex;align-items:center;gap:8px;flex:none}
.${CSS.keys}{display:inline-flex;align-items:center;gap:4px;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);padding:3px 8px;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.${CSS.key}{font-family:inherit}
.${CSS.separator}{font:inherit;color:var(--dsw-alias-label-tertiary)}
.${CSS.button}{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:none;cursor:pointer;font:inherit;font-size:13px;line-height:20px;height:30px;padding:0 12px;white-space:nowrap}
.${CSS.button}:hover{background:var(--dsw-alias-interactive-bg-hover)}
.${CSS.buttonQuiet}{background:0 0;color:var(--dsw-alias-label-secondary);padding:0 8px}
.${CSS.buttonQuiet}:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.${CSS.recording}{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.${CSS.error}{border:1px solid var(--dsw-alias-state-error-primary);background:0 0;color:var(--dsw-alias-state-error-primary)}
.${CSS.empty}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;padding:8px 0}
.${CSS.switchRow}{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:4px 0}
.${CSS.switchTrack}{box-sizing:border-box;flex:none;width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l4,var(--dsw-alias-border-l2));border:none;cursor:pointer;padding:0;position:relative;transition:background-color .12s}
.${CSS.switchOn}{background:var(--dsw-alias-brand-primary)}
.${CSS.switchKnob}{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .12s}
.${CSS.switchOn} .${CSS.switchKnob}{transform:translateX(16px)}
`

/**
 * Inject the page stylesheet once per document.
 *
 * @param doc - Owning document.
 * @returns Nothing.
 */
function injectStyles(doc) {
  if (doc.querySelector(`style[data-plugin-css="${STYLE_TAG}"]`) !== null) return
  const tag = doc.createElement('style')
  tag.dataset.plugin = 'dsh-keyboard-shortcut'
  tag.dataset.pluginCss = STYLE_TAG
  tag.textContent = STYLESHEET
  doc.head.appendChild(tag)
}

/** Modifier key codes that never complete a combination on their own. */
const MODIFIER_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight'
])

/**
 * Render keycap labels for a binding.
 *
 * The keys are rendered exactly as the shortcut service presents them. That
 * array is already the finished label list: on Windows `presentBinding`
 * interleaves literal ASCII plus tokens (`['Ctrl', '+', 'Q']`) because that is
 * the platform convention, and on macOS and Linux it deliberately omits them,
 * leaving the CSS gap to space the labels. Prefixing a separator here — as this
 * page used to — doubled the sign on Windows and produced "Ctrl + + + Q", and
 * inventing one on macOS would misrepresent a chord as a combination.
 *
 * A plus token is styled as a separator rather than a keycap so it keeps the
 * muted colour of punctuation instead of reading as a key the user must press.
 *
 * @param keys - Key labels from the shortcut service.
 * @param t - Locale reader.
 * @returns A row of keycaps, or the "no shortcut" placeholder.
 */
function keycaps(keys, t) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return h('span', { className: CSS.keys }, t('row.unbound'))
  }
  return h(
    'span',
    { className: CSS.keys },
    keys.map((key, index) =>
      h('span', { className: key === '+' ? CSS.separator : CSS.key, key: `${key}:${index}` }, key)
    )
  )
}

/**
 * A labelled on/off switch.
 *
 * @param props - Label, description, current value, and change handler.
 * @returns The switch row.
 */
function PreferenceRow(props) {
  const { label, description, value, onChange } = props
  return h(
    'div',
    { className: CSS.switchRow },
    h(
      'div',
      { className: CSS.rowText },
      h('div', { className: CSS.rowTitle }, label),
      h('p', { className: CSS.rowHint }, description)
    ),
    h('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': value,
      'aria-label': label,
      className: value === true ? `${CSS.switchTrack} ${CSS.switchOn}` : CSS.switchTrack,
      onClick: () => {
        onChange(value !== true)
      }
    }, h('span', { className: CSS.switchKnob }))
  )
}

/**
 * Build the keydown handler used while a row is recording.
 *
 * @param props - Recorder state and callbacks.
 * @returns The handler.
 */
function makeRecorder(props) {
  const { onCommit, onCancel } = props
  return (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }
    if (MODIFIER_CODES.has(event.code)) return

    event.preventDefault()
    event.stopPropagation()

    const modifiers = []
    if (event.ctrlKey || event.metaKey) modifiers.push('primary')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')

    // A combination needs at least one modifier; a bare key would collide with
    // ordinary typing in the composer.
    if (modifiers.length === 0) {
      onCommit(undefined, 'A shortcut needs at least one modifier key.')
      return
    }
    onCommit({ code: event.code, modifiers })
  }
}

/**
 * One editable row for a command this plugin owns.
 *
 * @param props - Row data and the shortcut service faces.
 * @returns The row.
 */
function EditableRow(props) {
  const { row, t, recordingId, setRecordingId, save, describeBinding } = props
  const [failure, setFailure] = useState(undefined)
  const active = recordingId === row.id

  const commit = useCallback(
    async (binding, message) => {
      setRecordingId(undefined)
      if (message !== undefined) {
        setFailure(message)
        return
      }
      const outcome = await save(row.id, binding)
      setFailure(outcome === 'saved' ? undefined : t('status.failed'))
    },
    [row.id, save, setRecordingId, t]
  )

  const cancel = useCallback(() => {
    setRecordingId(undefined)
    setFailure(undefined)
  }, [setRecordingId])

  useEffect(() => {
    if (!active) return undefined
    const handler = makeRecorder({ onCommit: commit, onCancel: cancel })
    window.addEventListener('keydown', handler, true)
    return () => {
      window.removeEventListener('keydown', handler, true)
    }
  }, [active, commit, cancel])

  const conflict = useMemo(() => {
    if (row.binding === null || row.binding === undefined) return undefined
    return describeBinding?.(row.binding)?.conflicts ?? []
  }, [row.binding, describeBinding])

  const issue = row.issue ?? undefined
  const hint = failure ?? (issue === 'reserved' ? t('row.reserved') : issue === 'unsupported-browser' ? t('row.unsupported') : undefined)

  return h(
    'div',
    { className: CSS.row },
    h(
      'div',
      { className: CSS.rowText },
      h('div', { className: CSS.rowTitle }, labelText(row.label) || row.id),
      hint === undefined ? null : h('p', { className: CSS.rowHint }, hint),
      conflict !== undefined && conflict.length > 0
        ? h('p', { className: CSS.rowHint }, t('row.conflict', { ids: conflict.join(', ') }))
        : null
    ),
    h(
      'div',
      { className: CSS.control },
      active
        ? h('span', { className: `${CSS.keys} ${CSS.recording}` }, t('row.recording'))
        : keycaps(row.keys, t),
      active
        ? h('button', { type: 'button', className: `${CSS.button} ${CSS.buttonQuiet}`, onClick: cancel }, t('row.cancel'))
        : h('button', {
            type: 'button',
            className: `${CSS.button} ${failure === undefined ? CSS.buttonQuiet : CSS.error}`,
            'aria-label': t('row.edit', { label: labelText(row.label) || row.id }),
            onClick: () => {
              setFailure(undefined)
              setRecordingId(row.id)
            }
          }, t('row.change')),
      row.modified === true && !active
        ? h('button', {
            type: 'button',
            className: `${CSS.button} ${CSS.buttonQuiet}`,
            onClick: () => {
              void save(row.id, 'reset')
            }
          }, t('row.restore'))
        : null
    )
  )
}

/**
 * One read-only reference row.
 *
 * @param props - Row data and the locale reader.
 * @returns The row.
 */
function ReferenceRow(props) {
  const { row, t } = props
  return h(
    'div',
    { className: CSS.row },
    h(
      'div',
      { className: CSS.rowText },
      h('div', { className: CSS.rowTitle }, labelText(row.label) || row.id),
      row.hint === undefined ? null : h('p', { className: CSS.rowHint }, row.hint)
    ),
    h('div', { className: CSS.control }, keycaps(row.keys, t))
  )
}

/**
 * Build the page component.
 *
 * @param service - The plugin's shared service faces.
 * @returns A React component suitable for a `settings.section` registration.
 */
export function createSettingsPage(service) {
  /**
   * The Keyboard Shortcuts page.
   *
   * @param props - Slot props. `t` is the section's bound locale reader.
   * @returns The page element tree.
   */
  return function KeyboardShortcutPage(props) {
    const { t } = props
    const [recordingId, setRecordingId] = useState(undefined)
    const [status, setStatus] = useState(undefined)

    const catalog = useSyncExternalStore(service.subscribeCatalog, service.getCatalog, service.getCatalog)
    const prefs = useSyncExternalStore(service.subscribePrefs, service.getPrefs, service.getPrefs)

    useEffect(() => {
      if (typeof document !== 'undefined') injectStyles(document)
    }, [])

    // Hold the recorder suspension for exactly as long as a row is recording, so
    // the native keyboard bridge does not swallow the stroke being recorded.
    useEffect(() => {
      void service.setRecording(recordingId !== undefined)
      return () => {
        if (recordingId !== undefined) void service.setRecording(false)
      }
    }, [recordingId])

    const rows = useMemo(() => (Array.isArray(catalog) ? catalog : []), [catalog])
    const fixed = useMemo(
      () => (typeof service.fixedKeys === 'function' ? service.fixedKeys() : []),
      [service, t]
    )
    const mine = useMemo(
      () => rows.filter((row) => service.ownedCommandIds.has(row.id)).sort((l, r) => l.id.localeCompare(r.id)),
      [rows]
    )
    const others = useMemo(
      () => rows.filter((row) => !service.ownedCommandIds.has(row.id)).sort((l, r) => l.id.localeCompare(r.id)),
      [rows]
    )

    const save = useCallback(
      async (id, binding) => {
        setStatus('saving')
        const outcome = await service.saveBinding(id, binding)
        setStatus(outcome === 'saved' ? 'saved' : 'failed')
        return outcome
      },
      []
    )

    return h(
      'div',
      { className: CSS.root },
      h('p', { className: CSS.intro }, t('page.description')),

      h(
        'section',
        { className: CSS.section },
        h('h3', { className: CSS.sectionTitle }, t('section.plugin.title')),
        h('p', { className: CSS.sectionText }, t('section.plugin.description')),
        mine.length === 0
          ? h('p', { className: CSS.empty }, t('row.unbound'))
          : mine.map((row) =>
              h(EditableRow, {
                key: row.id,
                row,
                t,
                recordingId,
                setRecordingId,
                save,
                describeBinding: service.describeBinding
              })
            )
      ),

      h(
        'section',
        { className: CSS.section },
        h('h3', { className: CSS.sectionTitle }, t('section.fixed.title')),
        h('p', { className: CSS.sectionText }, t('section.fixed.description')),
        fixed.length === 0
          ? h('p', { className: CSS.empty }, t('row.unbound'))
          : fixed.map((row) => h(ReferenceRow, { key: row.id, row, t }))
      ),

      h(
        'section',
        { className: CSS.section },
        h('h3', { className: CSS.sectionTitle }, t('section.input.title')),
        h('p', { className: CSS.sectionText }, t('section.input.description')),
        h(PreferenceRow, {
          label: t('input.optimize.label'),
          description: t('input.optimize.description'),
          value: prefs.optimizeComposerKeys === true,
          onChange: (next) => {
            service.setPref('optimizeComposerKeys', next)
          }
        })
      ),

      h(
        'section',
        { className: CSS.section },
        h('h3', { className: CSS.sectionTitle }, t('section.core.title')),
        h('p', { className: CSS.sectionText }, t('section.core.description')),
        others.length === 0
          ? h('p', { className: CSS.empty }, t('row.unbound'))
          : others.map((row) => h(ReferenceRow, { key: row.id, row, t }))
      ),

      status === undefined
        ? null
        : h(
            'p',
            { className: CSS.sectionText },
            status === 'saving' ? t('status.saving') : status === 'saved' ? t('status.saved') : t('status.failed')
          )
    )
  }
}

export { CSS, STYLESHEET, injectStyles, keycaps }
