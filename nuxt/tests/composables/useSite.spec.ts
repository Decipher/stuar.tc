import { describe, it, expect } from 'vitest'
import { useSite } from '~/composables/useSite'

describe('useSite', () => {
  it('returns site config', () => {
    const s = useSite()
    expect(s.name).toBe('stuar.tc')
    expect(s.tagline).toBe('Doing Druxt.')
    expect(s.location).toBe('Ballarat, Australia')
  })
  it('returns socials with valid hrefs', () => {
    const s = useSite()
    expect(s.socials.length).toBe(3)
    s.socials.forEach(soc => expect(soc.href).toMatch(/^https/))
  })
})
