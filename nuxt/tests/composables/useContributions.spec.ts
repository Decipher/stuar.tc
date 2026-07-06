import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { countToLevel, buildCells, useContributions } from '~/composables/useContributions'

// --- countToLevel ---

describe('countToLevel', () => {
  it('returns 0 for zero', () => expect(countToLevel(0)).toBe(0))
  it('returns 1 for 1 contribution', () => expect(countToLevel(1)).toBe(1))
  it('returns 1 for 2 contributions', () => expect(countToLevel(2)).toBe(1))
  it('returns 2 for 3 contributions', () => expect(countToLevel(3)).toBe(2))
  it('returns 2 for 5 contributions', () => expect(countToLevel(5)).toBe(2))
  it('returns 3 for 6 contributions', () => expect(countToLevel(6)).toBe(3))
  it('returns 3 for many contributions', () => expect(countToLevel(20)).toBe(3))
})

// --- buildCells ---

describe('buildCells', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns correct number of cells', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    expect(buildCells([], 4)).toHaveLength(28)
  })

  it('all zeros when no events', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    const cells = buildCells([], 1)
    expect(cells.every(c => c === 0)).toBe(true)
  })

  it('maps 3 events on today to level 2', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    const events = [
      { date: '2026-07-03' },
      { date: '2026-07-03' },
      { date: '2026-07-03' },
    ]
    const cells = buildCells(events, 1)
    expect(cells).toHaveLength(7)
    expect(cells[6]).toBe(2)
    expect(cells[5]).toBe(0)
  })

  it('maps 6+ events to level 3', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    const events = Array.from({ length: 6 }, () => ({ date: '2026-07-03' }))
    const cells = buildCells(events, 1)
    expect(cells[6]).toBe(3)
  })

  it('places oldest day at index 0', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    const events = [{ date: '2026-06-27' }]
    const cells = buildCells(events, 1)
    expect(cells[0]).toBe(1)
    expect(cells[6]).toBe(0)
  })
})

// --- useContributions ---

const ghPage1 = ref<unknown>(null)
const ghPage2 = ref<unknown>(null)
const drupalComments = ref<unknown>(null)
const drupalReleases = ref<unknown>(null)

mockNuxtImport('useFetch', () => {
  return (url: string) => {
    if (url.includes('github.com') && url.includes('page=2')) return { data: ghPage2 }
    if (url.includes('github.com')) return { data: ghPage1 }
    if (url.includes('comment')) return { data: drupalComments }
    return { data: drupalReleases }
  }
})

describe('useContributions', () => {
  beforeEach(() => {
    ghPage1.value = null
    ghPage2.value = null
    drupalComments.value = null
    drupalReleases.value = null
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns empty cells when all data is null', () => {
    const { cells } = useContributions(18)
    expect(cells.value).toEqual([])
  })

  it('uses default 18 weeks when called with no argument', () => {
    ghPage1.value = [{ created_at: '2026-07-03T10:00:00Z' }]
    const { cells } = useContributions()
    expect(cells.value).toHaveLength(18 * 7)
  })

  it('returns cells when gh data is available', () => {
    ghPage1.value = [
      { created_at: '2026-07-03T10:00:00Z' },
      { created_at: '2026-07-03T11:00:00Z' },
    ]
    const { cells } = useContributions(1)
    expect(cells.value).toHaveLength(7)
    expect(cells.value[6]).toBe(1)
  })

  it('merges gh page2 events', () => {
    ghPage1.value = [{ created_at: '2026-07-03T10:00:00Z' }]
    ghPage2.value = [{ created_at: '2026-07-03T11:00:00Z' }]
    const { cells } = useContributions(1)
    expect(cells.value[6]).toBe(1)
  })

  it('includes drupal comments in cells', () => {
    const ts = Math.floor(new Date('2026-07-03T09:00:00Z').getTime() / 1000)
    drupalComments.value = { list: [{ created: String(ts) }] }
    const { cells } = useContributions(1)
    expect(cells.value[6]).toBe(1)
  })

  it('includes drupal releases in cells', () => {
    const ts = Math.floor(new Date('2026-07-03T08:00:00Z').getTime() / 1000)
    drupalReleases.value = { list: [{ created: String(ts) }] }
    const { cells } = useContributions(1)
    expect(cells.value[6]).toBe(1)
  })
})
