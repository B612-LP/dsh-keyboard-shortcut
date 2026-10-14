/**
 * @module dsh-keyboard-shortcut/notices
 *
 * Transient feedback for keyboard actions.
 *
 * ## Why this plugin carries its own notice surface
 *
 * Shortcut actions are fired from a key handler, so the user gets no other
 * acknowledgement: there is no button that visibly reacts and no dialog that
 * opens. Two cases need one — a permission cycle landing on a dangerous mode
 * should say which mode it landed on, and a reasoning step that hits an end stop
 * should say so rather than appearing broken.
 *
 * DSH's session-scoped notice channel is reached through the Conversation
 * plugin's session facade, which is not reachable from a key handler that runs
 * outside a session scope. This module therefore owns a minimal notice store and
 * renders it through the documented `shell.overlay` slot, which is the
 * supported seat for frame-wide floating content.
 *
 * ## Behaviour
 *
 * One notice is visible at a time. A newer notice replaces the current one
 * immediately, which keeps a held key from queueing a backlog. The newest
 * notice's text is repeated verbatim only when it changes, so holding a key at
 * an end stop does not restart the dismissal timer.
 */

import { createElement as h, useEffect, useSyncExternalStore } from 'react'

/** Style tag identity. */
const STYLE_TAG = 'dsh-keyboard-shortcut/notices.css'

/** Class names. */
const CSS = {
  root: 'dshKbdToastRoot',
  toast: 'dshKbdToast'
}

const STYLESHEET = `
.${CSS.root}{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--dsh-composer-height,152px) + 24px);z-index:1200;pointer-events:none;display:flex;justify-content:center}
.${CSS.toast}{box-sizing:border-box;max-width:min(420px,calc(100vw - 48px));border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-prominent);padding:8px 14px;font-size:13px;line-height:20px;animation:dshKbdToastIn .12s ease-out}
@keyframes dshKbdToastIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.${CSS.toast}{animation:none}}
`

/**
 * Inject the notice stylesheet once per document.
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

/** How long a notice stays on screen, in milliseconds. */
const VISIBLE_MS = 2200

/**
 * Create the notice store.
 *
 * @returns A store with `get`, `subscribe`, `show`, and `dispose`.
 */
export function createNotices() {
  let current
  let timer
  const listeners = new Set()

  const publish = (next) => {
    current = next
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-keyboard-shortcut] notice listener failed', error)
      }
    }
  }

  const clear = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (current !== undefined) publish(undefined)
  }

  return {
    get: () => current,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    /**
     * Show one notice.
     *
     * @param text - Message text. An empty string is ignored.
     * @returns Nothing.
     */
    show: (text) => {
      if (typeof text !== 'string' || text === '') return
      // Repeating identical text keeps the existing timer running rather than
      // restarting it, so a held key does not pin the notice on screen.
      if (current?.text === text) return
      if (timer !== undefined) clearTimeout(timer)
      publish({ text, seq: (current?.seq ?? 0) + 1 })
      timer = setTimeout(() => {
        timer = undefined
        if (current?.text === text) publish(undefined)
      }, VISIBLE_MS)
    },
    dispose: () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      listeners.clear()
    }
  }
}

/**
 * Build the notice overlay component.
 *
 * @param notices - The store from {@link createNotices}.
 * @returns A React component for the `shell.overlay` slot.
 */
export function createNoticeOverlay(notices) {
  return function KeyboardShortcutNotices() {
    const notice = useSyncExternalStore(notices.subscribe, notices.get)

    useEffect(() => {
      if (typeof document !== 'undefined') injectStyles(document)
    }, [])

    if (notice === undefined) return null
    return h(
      'div',
      { className: CSS.root, role: 'status', 'aria-live': 'polite' },
      h('div', { className: CSS.toast, key: notice.seq }, notice.text)
    )
  }
}

export { CSS as NOTICE_CSS, STYLESHEET as NOTICE_STYLESHEET }
