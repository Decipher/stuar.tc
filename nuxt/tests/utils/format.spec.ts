import { describe, it, expect } from 'vitest'
import { formatK } from '~/utils/format'

describe('formatK', () => {
  it('returns string for numbers under 1000', () => {
    expect(formatK(0)).toBe('0')
    expect(formatK(480)).toBe('480')
    expect(formatK(999)).toBe('999')
  })

  it('abbreviates thousands with one decimal place', () => {
    expect(formatK(1500)).toBe('1.5k')
    expect(formatK(3800)).toBe('3.8k')
    expect(formatK(12400)).toBe('12.4k')
  })

  it('omits decimal when value is a round thousand', () => {
    expect(formatK(1000)).toBe('1k')
    expect(formatK(5000)).toBe('5k')
    expect(formatK(10000)).toBe('10k')
  })
})
