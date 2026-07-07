import { describe, it, expect } from 'vitest'
import { organizerRoles, type OrganizerRole } from '~/data/community'

const REQUIRED_STRING_FIELDS: (keyof OrganizerRole)[] = [
  'event',
  'role',
  'period',
]

describe('community organizer-roles data integrity', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(organizerRoles)).toBe(true)
    expect(organizerRoles.length).toBeGreaterThan(0)
  })

  it('every entry has a non-empty evidence array', () => {
    for (const role of organizerRoles) {
      expect(Array.isArray(role.evidence)).toBe(true)
      expect(role.evidence.length).toBeGreaterThan(0)
      for (const line of role.evidence) {
        expect(typeof line).toBe('string')
        expect(line.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('every entry has non-empty required string fields', () => {
    for (const role of organizerRoles) {
      for (const field of REQUIRED_STRING_FIELDS) {
        expect(typeof role[field]).toBe('string')
        expect((role[field] as string).trim().length).toBeGreaterThan(0)
      }
    }
  })
})
