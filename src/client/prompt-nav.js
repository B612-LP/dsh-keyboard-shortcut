/**
 * @module dsh-keyboard-shortcut/prompt-nav
 *
 * Moves between user inputs (turns) with Page Up and Page Down.
 *
 * ## Reusing DSH's own navigation
 *
 * DSH's Chat view already renders a turn rail: one fixed-pitch mark per turn,
 * anchored at that turn's first human prompt, where activating a mark pages
 * history in and lands on the turn. That logic — paging unloaded turns,
 * measuring the landing, compensating scroll — lives inside the Chat view and
 * is not exposed as a service, so this module drives it the only way an outside
 * plugin can: it presses the rail's own marks.
 *
 * Nothing here re-implements scrolling or history paging. If a future DSH
 * publishes a "go to turn" service, this module should call that instead and
 * the DOM work should be deleted.
 *
 * ## Why the rail is virtualized
 *
 * The rail mounts only the marks near the current reading position plus an
 * overscan margin, so the neighbouring turn is normally mounted and the common
 * case is a single click. When the target is outside the mounted window the
 * module scrolls the rail's own scroller to bring it in, then retries over a
 * bounded number of animation frames.
 *
 * ## Scoping
 *
 * Several conversation surfaces can be mounted at once (the main view and any
 * right-sidebar chat tabs), each with its own rail. The rail belonging to the
 * active conversation is preferred; the first rail found is used as a fallback
 * so the shortcut still works in layouts whose markers this module does not
 * recognise.
 */

/** Class-name fragment for the rail scroller. CSS Modules hash the prefix. */
const SCROLLER_SELECTOR = '[class*="scroller"]'

/** Marks live inside this container. */
const MARKS_SELECTOR = '[class*="marks"]'

/** Transcript row carrying its turn number. */
const TURN_ROW_SELECTOR = '[data-chat-turn]'

/** Conversation region marker. */
const CONVERSATION_REGION = '[data-conversation-region]'

/** Fixed pitch between adjacent marks, in CSS pixels (DSH's TURN_SPACING_PX). */
const MARK_PITCH_PX = 10

/** Rail padding before the first mark, in CSS pixels (DSH's RAIL_INSET_PX). */
const RAIL_INSET_PX = 6

/** How many animation frames to wait for a virtualized mark to mount. */
const MOUNT_FRAME_BUDGET = 30

/**
 * Wait for the next animation frame.
 *
 * @param doc - Owning document.
 * @returns A promise resolving after the frame.
 */
function nextFrame(doc) {
  return new Promise((resolve) => {
    const view = doc.defaultView
    if (view === null || typeof view.requestAnimationFrame !== 'function') {
      setTimeout(resolve, 16)
      return
    }
    view.requestAnimationFrame(() => {
      resolve()
    })
  })
}

/**
 * Find the turn rail for the active conversation.
 *
 * A rail is a `<nav>` that contains turn marks, which DSH writes as buttons
 * carrying `data-index`. Selecting on that attribute rather than on the hashed
 * class names keeps this working across restyles.
 *
 * @param doc - Owning document.
 * @returns The rail element and its marks, or `undefined`.
 */
function findRail(doc) {
  const rails = [...doc.querySelectorAll('nav')].filter(
    (nav) => nav.querySelector('button[data-index]') !== null
  )
  if (rails.length === 0) return undefined

  // Prefer the rail inside the active conversation region.
  const region = doc.querySelector(CONVERSATION_REGION)
  const rail = (region === null ? undefined : rails.find((nav) => region.contains(nav))) ?? rails[0]
  if (rail === undefined) return undefined

  const marks = [...rail.querySelectorAll('button[data-index]')]
    .map((element) => ({ element, index: Number(element.dataset.index) }))
    .filter((mark) => Number.isInteger(mark.index))
    .sort((left, right) => left.index - right.index)
  return marks.length === 0 ? undefined : { rail, marks }
}

/**
 * Read the index of the turn currently being read.
 *
 * @param marks - Mounted marks from {@link findRail}.
 * @returns The index, or `undefined` when no mark is marked current.
 */
function activeIndex(marks) {
  return marks.find((mark) => mark.element.getAttribute('aria-current') === 'true')?.index
}

/**
 * Scroll a rail so the wanted mark falls inside the mounted window.
 *
 * Mark positions are a fixed pitch, so the offset is computed rather than
 * measured — the target generally is not in the DOM yet, so there is nothing to
 * measure.
 *
 * @param rail - The rail element.
 * @param index - Wanted mark index.
 * @returns Nothing.
 */
function scrollRailTo(rail, index) {
  const scroller = rail.querySelector(SCROLLER_SELECTOR) ?? rail
  const centred = RAIL_INSET_PX + index * MARK_PITCH_PX - scroller.clientHeight / 2
  const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  scroller.scrollTop = Math.min(Math.max(centred, 0), max)
}

/**
 * Scroll the transcript to the neighbouring turn row.
 *
 * Fallback for layouts with no usable rail: the transcript rows carry their
 * turn number, so the previous or next row is a direct lookup.
 *
 * @param doc - Owning document.
 * @param delta - `-1` for the previous turn, `+1` for the next.
 * @param currentTurn - The turn to move away from, when known.
 * @returns Whether a row was found and scrolled to.
 */
function scrollTranscript(doc, delta, currentTurn) {
  const rows = [...doc.querySelectorAll(TURN_ROW_SELECTOR)]
    .map((element) => ({ element, turn: Number(element.dataset.chatTurn) }))
    .filter((row) => Number.isInteger(row.turn))
    .sort((left, right) => left.turn - right.turn)
  if (rows.length === 0) return false

  const target =
    currentTurn === undefined
      ? delta < 0
        ? rows[rows.length - 1]
        : rows[0]
      : delta < 0
        ? [...rows].reverse().find((row) => row.turn < currentTurn)
        : rows.find((row) => row.turn > currentTurn)
  if (target === undefined) return false

  target.element.scrollIntoView({ block: 'start', behavior: 'smooth' })
  return true
}

/**
 * Move to the previous or next user input.
 *
 * @param doc - Owning document.
 * @param delta - `-1` for the previous input, `+1` for the next.
 * @returns `'moved'` when navigation was issued, `'edge'` when there is no
 * input in that direction, or `'unavailable'` when this layout has no turn
 * navigator at all.
 */
export async function navigateInput(doc, delta) {
  const rail = findRail(doc)
  if (rail === undefined) {
    return scrollTranscript(doc, delta) ? 'moved' : 'unavailable'
  }

  const current = activeIndex(rail.marks)
  const first = rail.marks[0]?.index
  const last = rail.marks[rail.marks.length - 1]?.index
  if (current === undefined) {
    // No reading position is published; treat the mounted window as the source
    // of truth and move one step inside it.
    if (first === undefined || last === undefined) return 'unavailable'
    return clickMark(rail, delta < 0 ? first : last, doc) ? 'moved' : 'unavailable'
  }

  const target = current + delta
  if (target < 0) return 'edge'

  // The transcript fallback turns "no such row" into an explicit edge, which is
  // how the caller distinguishes "nothing in that direction" from a layout it
  // cannot drive.
  if (await clickMarkAsync(rail, target, doc)) return 'moved'

  const moved = scrollTranscript(doc, delta, current)
  return moved ? 'moved' : target === 0 ? 'edge' : 'unavailable'
}

/**
 * Click a mounted mark.
 *
 * @param rail - Rail and marks.
 * @param index - Wanted index.
 * @param doc - Owning document.
 * @returns Whether the mark was mounted and clicked.
 */
function clickMark(rail, index, doc) {
  const mark = rail.marks.find((candidate) => candidate.index === index)
  if (mark === undefined) return false
  mark.element.click()
  return true
}

/**
 * Click a mark, mounting it first when the rail has virtualized it away.
 *
 * @param rail - Rail and marks.
 * @param index - Wanted index.
 * @param doc - Owning document.
 * @returns Whether the mark was eventually clicked.
 */
async function clickMarkAsync(rail, index, doc) {
  if (clickMark(rail, index, doc)) return true

  scrollRailTo(rail.rail, index)
  for (let frame = 0; frame < MOUNT_FRAME_BUDGET; frame += 1) {
    await nextFrame(doc)
    const refreshed = findRail(doc)
    if (refreshed !== undefined && clickMark(refreshed, index, doc)) return true
  }
  return false
}

export { MARK_PITCH_PX, RAIL_INSET_PX, TURN_ROW_SELECTOR }
