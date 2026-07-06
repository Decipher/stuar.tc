import { describe, it, expect } from 'vitest'
import { applyTitleTemplate } from '~/utils/titleTemplate'

describe('applyTitleTemplate', () => {
  it('returns null for undefined title', () => {
    expect(applyTitleTemplate(undefined)).toBeNull()
  })
  it('returns null for empty title', () => {
    expect(applyTitleTemplate('')).toBeNull()
  })
  it('returns the home title as-is', () => {
    expect(applyTitleTemplate('Stuart Clark · stuar.tc')).toBe('Stuart Clark · stuar.tc')
  })
  it('appends site name for other titles', () => {
    expect(applyTitleTemplate('Open source')).toBe('Open source · stuar.tc')
  })
})
