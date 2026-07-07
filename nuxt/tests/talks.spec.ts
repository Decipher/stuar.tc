import { describe, it, expect } from 'vitest'
import { talks, type Talk } from '~/data/talks'

const FABRICATED_EVENTS = [
  'DrupalCon Singapore 2024',
  'DrupalCon Lille 2023',
  'DrupalCon Prague 2022',
  'DrupalCon Amsterdam 2019',
]

const REQUIRED_STRING_FIELDS: (keyof Talk)[] = [
  'title',
  'event',
  'year',
  'description',
]

describe('talks data integrity', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(talks)).toBe(true)
    expect(talks.length).toBeGreaterThan(0)
  })

  it('every entry has a valid confidence value', () => {
    for (const talk of talks) {
      expect(['high', 'medium']).toContain(talk.confidence)
    }
  })

  it('every entry has a non-empty evidence array', () => {
    for (const talk of talks) {
      expect(Array.isArray(talk.evidence)).toBe(true)
      expect(talk.evidence.length).toBeGreaterThan(0)
      for (const line of talk.evidence) {
        expect(typeof line).toBe('string')
        expect(line.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('every entry has non-empty required string fields', () => {
    for (const talk of talks) {
      for (const field of REQUIRED_STRING_FIELDS) {
        expect(typeof talk[field]).toBe('string')
        expect((talk[field] as string).trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('every entry has a non-empty tags array', () => {
    for (const talk of talks) {
      expect(Array.isArray(talk.tags)).toBe(true)
      expect(talk.tags.length).toBeGreaterThan(0)
      for (const tag of talk.tags) {
        expect(typeof tag).toBe('string')
        expect(tag.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('contains no fabricated events', () => {
    for (const talk of talks) {
      const eventWithYear = `${talk.event} ${talk.year}`
      for (const fabricated of FABRICATED_EVENTS) {
        expect(eventWithYear).not.toBe(fabricated)
        expect(talk.event).not.toContain(fabricated)
      }
    }
  })
})
