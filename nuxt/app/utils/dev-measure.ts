/**
 * Pure geometry utilities for the DevGrid measurement layer.
 *
 * All functions except `measureElement` are side-effect-free and take
 * plain objects, making them straightforwardly unit-testable.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** Viewport-relative rect with pre-computed derived fields. */
export interface MeasureRect {
  top:     number
  left:    number
  right:   number
  bottom:  number
  width:   number
  height:  number
  centerX: number
  centerY: number
}

/**
 * Gap between two rects. A positive value means there is clear space on that
 * axis. `null` means the elements overlap (no gap) on that axis.
 *
 * `hDir / vDir` indicate which direction B lies relative to A:
 *   - hDir 'right'  → B is to the right of A
 *   - vDir 'below'  → B is below A
 */
export interface GapResult {
  h:    number | null
  v:    number | null
  hDir: 'right' | 'left' | null
  vDir: 'below' | 'above' | null
}

/** Edge/centre alignment flags. True = within `tolerance` pixels. */
export interface AlignmentResult {
  topEdge:    boolean
  bottomEdge: boolean
  leftEdge:   boolean
  rightEdge:  boolean
  /** Horizontal centre lines share the same Y position (both elements centred vertically). */
  hCentre: boolean
  /** Vertical centre lines share the same X position (both elements centred horizontally). */
  vCentre: boolean
}

// ── Pure constructors ─────────────────────────────────────────────────────────

/**
 * Build a `MeasureRect` from a plain `{ top, left, width, height }`.
 * Computes `right`, `bottom`, `centerX`, `centerY`.
 */
export function makeMeasureRect(r: {
  top: number
  left: number
  width: number
  height: number
}): MeasureRect {
  return {
    top:     r.top,
    left:    r.left,
    right:   r.left + r.width,
    bottom:  r.top  + r.height,
    width:   r.width,
    height:  r.height,
    centerX: r.left + r.width  / 2,
    centerY: r.top  + r.height / 2,
  }
}

// ── DOM wrapper ───────────────────────────────────────────────────────────────

/** Extract a `MeasureRect` from a DOM element via `getBoundingClientRect`. */
export function measureElement(el: Element): MeasureRect {
  const r = el.getBoundingClientRect()
  return makeMeasureRect({ top: r.top, left: r.left, width: r.width, height: r.height })
}

// ── Geometry ──────────────────────────────────────────────────────────────────

/**
 * Compute the gap between two rects on each axis.
 *
 * ```
 * A ──────┐        ┌── B
 *         └──32px──┘   → h: 32, hDir: 'right'
 * ```
 */
export function getGapResult(a: MeasureRect, b: MeasureRect): GapResult {
  let h:    number | null       = null
  let hDir: GapResult['hDir']   = null
  let v:    number | null       = null
  let vDir: GapResult['vDir']   = null

  if (b.left >= a.right) {
    h    = Math.round(b.left - a.right)
    hDir = 'right'
  }
  else if (a.left >= b.right) {
    h    = Math.round(a.left - b.right)
    hDir = 'left'
  }

  if (b.top >= a.bottom) {
    v    = Math.round(b.top - a.bottom)
    vDir = 'below'
  }
  else if (a.top >= b.bottom) {
    v    = Math.round(a.top - b.bottom)
    vDir = 'above'
  }

  return { h, v, hDir, vDir }
}

/**
 * Check which edges and centre lines of two rects align within `tolerance`
 * pixels (default 2 px — absorbs sub-pixel rounding and 1-px borders).
 */
export function getAlignmentResult(
  a: MeasureRect,
  b: MeasureRect,
  tolerance = 2,
): AlignmentResult {
  const close = (x: number, y: number) => Math.abs(x - y) <= tolerance
  return {
    topEdge:    close(a.top,     b.top),
    bottomEdge: close(a.bottom,  b.bottom),
    leftEdge:   close(a.left,    b.left),
    rightEdge:  close(a.right,   b.right),
    hCentre:    close(a.centerY, b.centerY),
    vCentre:    close(a.centerX, b.centerX),
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** Format a number as a rounded pixel string, e.g. `32.7 → "33px"`. */
export function formatPx(value: number): string {
  return `${Math.round(value)}px`
}

// ── Element labelling ─────────────────────────────────────────────────────────

/**
 * Build a short human-readable label for a DOM element.
 * Format: `tag[#id][.class1.class2]`
 * Omits `sc-` prefixed dev-UI classes and limits to 2 classes for brevity.
 */
export function getElementLabel(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const id  = el.id ? `#${el.id}` : ''
  const cls = Array.from(el.classList)
    .filter(c => !c.startsWith('sc-'))
    .slice(0, 2)
    .join('.')
  return `${tag}${id}${cls ? `.${cls}` : ''}`
}
