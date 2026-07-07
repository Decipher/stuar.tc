import { describe, it, expect } from 'vitest'
import {
  makeMeasureRect,
  measureElement,
  getGapResult,
  getAlignmentResult,
  formatPx,
  getElementLabel,
} from '~/utils/dev-measure'

// ── helpers ───────────────────────────────────────────────────────────────────

function rect(top: number, left: number, width: number, height: number) {
  return makeMeasureRect({ top, left, width, height })
}

// ── makeMeasureRect ────────────────────────────────────────��──────────────────

describe('makeMeasureRect', () => {
  it('computes right and bottom from top/left + dimensions', () => {
    const r = rect(10, 20, 100, 50)
    expect(r.right).toBe(120)
    expect(r.bottom).toBe(60)
  })

  it('computes horizontal and vertical centres', () => {
    const r = rect(10, 20, 100, 50)
    expect(r.centerX).toBe(70)   // 20 + 100/2
    expect(r.centerY).toBe(35)   // 10 + 50/2
  })

  it('echoes top, left, width, height unchanged', () => {
    const r = rect(5, 15, 80, 40)
    expect(r.top).toBe(5)
    expect(r.left).toBe(15)
    expect(r.width).toBe(80)
    expect(r.height).toBe(40)
  })

  it('handles zero dimensions', () => {
    const r = rect(0, 0, 0, 0)
    expect(r.right).toBe(0)
    expect(r.centerX).toBe(0)
  })
})

// ��─ measureElement ──────────���─────────────────────────────────────────────────

describe('measureElement', () => {
  it('returns a MeasureRect shaped object from a DOM element', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const r = measureElement(el)
    expect(typeof r.top).toBe('number')
    expect(typeof r.centerX).toBe('number')
    expect(r.right).toBe(r.left + r.width)
    expect(r.bottom).toBe(r.top + r.height)
    document.body.removeChild(el)
  })
})

// ── getGapResult ──────────────────────────────────────────────────────────────

describe('getGapResult', () => {
  const a = rect(0, 0, 100, 50) // right: 100, bottom: 50

  describe('horizontal gaps', () => {
    it('detects gap when B is right of A', () => {
      const b = rect(0, 132, 100, 50) // left: 132
      const g = getGapResult(a, b)
      expect(g.h).toBe(32)      // 132 - 100
      expect(g.hDir).toBe('right')
      expect(g.v).toBeNull()
    })

    it('detects gap when B is left of A', () => {
      // a.left=0, b.right must be < 0
      const b = rect(0, -50, 30, 50) // left:-50, right:-20
      const g = getGapResult(a, b)
      expect(g.h).toBe(20)      // a.left(0) - b.right(-20) = 20
      expect(g.hDir).toBe('left')
    })

    it('returns null when elements touch exactly (zero gap)', () => {
      const b = rect(0, 100, 100, 50) // b.left === a.right
      const g = getGapResult(a, b)
      expect(g.h).toBe(0)
      expect(g.hDir).toBe('right')
    })

    it('returns null hDir when elements overlap horizontally', () => {
      const b = rect(0, 50, 100, 50) // starts inside A
      const g = getGapResult(a, b)
      expect(g.h).toBeNull()
      expect(g.hDir).toBeNull()
    })
  })

  describe('vertical gaps', () => {
    it('detects gap when B is below A', () => {
      const b = rect(80, 0, 100, 50) // top: 80, a.bottom: 50
      const g = getGapResult(a, b)
      expect(g.v).toBe(30)
      expect(g.vDir).toBe('below')
      expect(g.h).toBeNull()
    })

    it('detects gap when B is above A', () => {
      const b = rect(-70, 0, 100, 50) // top:-70, bottom:-20
      const g = getGapResult(a, b)
      expect(g.v).toBe(20)      // a.top(0) - b.bottom(-20) = 20
      expect(g.vDir).toBe('above')
    })

    it('returns null when elements touch exactly (zero gap)', () => {
      const b = rect(50, 0, 100, 50) // b.top === a.bottom
      const g = getGapResult(a, b)
      expect(g.v).toBe(0)
      expect(g.vDir).toBe('below')
    })

    it('returns null vDir when elements overlap vertically', () => {
      const b = rect(25, 200, 100, 50)
      const g = getGapResult(a, b)
      expect(g.v).toBeNull()
      expect(g.vDir).toBeNull()
    })
  })

  it('rounds sub-pixel values to nearest integer', () => {
    const b = rect(0, 100.7, 100, 50) // gap: 0.7px → 1
    expect(getGapResult(a, b).h).toBe(1)
    const c = rect(0, 100.4, 100, 50) // gap: 0.4px → 0
    expect(getGapResult(a, c).h).toBe(0)
  })

  it('returns both h and v when elements are diagonal', () => {
    const b = rect(80, 130, 100, 50)
    const g = getGapResult(a, b)
    expect(g.h).toBe(30)
    expect(g.hDir).toBe('right')
    expect(g.v).toBe(30)
    expect(g.vDir).toBe('below')
  })
})

// ── getAlignmentResult ──────────────���─────────────────────────────────────────

describe('getAlignmentResult', () => {
  const a = rect(10, 20, 100, 50) // right:120, bottom:60, centerX:70, centerY:35

  it('detects all alignments when rects are identical', () => {
    const r = getAlignmentResult(a, rect(10, 20, 100, 50))
    expect(r.topEdge).toBe(true)
    expect(r.bottomEdge).toBe(true)
    expect(r.leftEdge).toBe(true)
    expect(r.rightEdge).toBe(true)
    expect(r.hCentre).toBe(true)
    expect(r.vCentre).toBe(true)
  })

  it('detects top-edge alignment', () => {
    expect(getAlignmentResult(a, rect(10, 200, 80, 40)).topEdge).toBe(true)
    expect(getAlignmentResult(a, rect(13, 200, 80, 40)).topEdge).toBe(false)
  })

  it('detects bottom-edge alignment', () => {
    // a.bottom=60; b with top=20, height=40 → bottom=60
    expect(getAlignmentResult(a, rect(20, 200, 80, 40)).bottomEdge).toBe(true)
    expect(getAlignmentResult(a, rect(20, 200, 80, 37)).bottomEdge).toBe(false)
  })

  it('detects left-edge alignment', () => {
    expect(getAlignmentResult(a, rect(100, 20, 50, 30)).leftEdge).toBe(true)
    expect(getAlignmentResult(a, rect(100, 23, 50, 30)).leftEdge).toBe(false)
  })

  it('detects right-edge alignment', () => {
    // a.right=120; b with left=70, width=50 → right=120
    expect(getAlignmentResult(a, rect(100, 70, 50, 30)).rightEdge).toBe(true)
    expect(getAlignmentResult(a, rect(100, 70, 53, 30)).rightEdge).toBe(false)
  })

  it('detects horizontal-centre alignment (same Y midpoint)', () => {
    // a.centerY=35; b needs centerY=35 → top=20, height=30
    expect(getAlignmentResult(a, rect(20, 200, 80, 30)).hCentre).toBe(true)
    // top=20, height=24 → centerY=32; |35-32|=3 > 2 → not aligned
    expect(getAlignmentResult(a, rect(20, 200, 80, 24)).hCentre).toBe(false)
  })

  it('detects vertical-centre alignment (same X midpoint)', () => {
    // a.centerX=70; b needs centerX=70 → left=10, width=120
    expect(getAlignmentResult(a, rect(100, 10, 120, 30)).vCentre).toBe(true)
    expect(getAlignmentResult(a, rect(100, 10, 125, 30)).vCentre).toBe(false)
  })

  it('uses default tolerance of 2 px', () => {
    // 2px off → still aligned; 3px off → not aligned
    expect(getAlignmentResult(a, rect(12, 200, 80, 40)).topEdge).toBe(true)
    expect(getAlignmentResult(a, rect(13, 200, 80, 40)).topEdge).toBe(false)
  })

  it('accepts a custom tolerance', () => {
    expect(getAlignmentResult(a, rect(15, 200, 80, 40), 5).topEdge).toBe(true)
    expect(getAlignmentResult(a, rect(16, 200, 80, 40), 5).topEdge).toBe(false)
  })
})

// ── formatPx ─────────────────────────────────────────��───────────────────────

describe('formatPx', () => {
  it('formats an integer', () => {
    expect(formatPx(32)).toBe('32px')
  })

  it('rounds a float up', () => {
    expect(formatPx(32.7)).toBe('33px')
  })

  it('rounds a float down', () => {
    expect(formatPx(32.4)).toBe('32px')
  })

  it('formats zero', () => {
    expect(formatPx(0)).toBe('0px')
  })

  it('formats negative values', () => {
    expect(formatPx(-8)).toBe('-8px')
  })
})

// ── getElementLabel ───────────────────────────────────────────────────────────

describe('getElementLabel', () => {
  it('returns just the tag for an element with no id or class', () => {
    const el = document.createElement('section')
    expect(getElementLabel(el)).toBe('section')
  })

  it('includes the element id', () => {
    const el = document.createElement('div')
    el.id = 'hero'
    expect(getElementLabel(el)).toBe('div#hero')
  })

  it('includes up to 2 classes separated by dots', () => {
    const el = document.createElement('div')
    el.className = 'flex items-center justify-between gap-4'
    expect(getElementLabel(el)).toBe('div.flex.items-center')
  })

  it('excludes sc- prefixed dev-UI classes', () => {
    const el = document.createElement('div')
    el.className = 'sc-btn sc-pi-badge real-class'
    expect(getElementLabel(el)).toBe('div.real-class')
  })

  it('returns just the tag when all classes are sc- prefixed', () => {
    const el = document.createElement('div')
    el.className = 'sc-pulse-dot sc-shake'
    expect(getElementLabel(el)).toBe('div')
  })

  it('combines id and classes', () => {
    const el = document.createElement('nav')
    el.id    = 'main-nav'
    el.className = 'flex gap-2'
    expect(getElementLabel(el)).toBe('nav#main-nav.flex.gap-2')
  })
})
