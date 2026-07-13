import { describe, expect, it } from 'vitest'
import { canonicalUrlForPath, ogEyebrowForPath, ogTitleForPath, SITE_ORIGIN } from '~/utils/socialMeta'

describe('canonicalUrlForPath', () => {
  it('builds an absolute URL from a path', () => {
    expect(canonicalUrlForPath('/about')).toBe(`${SITE_ORIGIN}/about`)
  })

  it('normalises an empty path to the root', () => {
    expect(canonicalUrlForPath('')).toBe(`${SITE_ORIGIN}/`)
  })

  it('keeps the homepage path as-is', () => {
    expect(canonicalUrlForPath('/')).toBe(`${SITE_ORIGIN}/`)
  })
})

describe('ogTitleForPath', () => {
  it('returns the mapped title for an exact route', () => {
    expect(ogTitleForPath('/about')).toBe('About')
    expect(ogTitleForPath('/open-source')).toBe('Open source')
  })

  it('returns the homepage title', () => {
    expect(ogTitleForPath('/')).toBe('Stuart Clark')
  })

  it('falls back to the nearest section title for dynamic routes', () => {
    expect(ogTitleForPath('/writing/some-post')).toBe('Writing')
  })

  it('falls back to the site name for unknown routes', () => {
    expect(ogTitleForPath('/something-unknown')).toBe('Stuart Clark')
  })

  it('falls back to the homepage title for an empty path', () => {
    expect(ogTitleForPath('')).toBe('Stuart Clark')
  })
})

describe('ogEyebrowForPath', () => {
  it('returns "home" for the homepage', () => {
    expect(ogEyebrowForPath('/')).toBe('home')
    expect(ogEyebrowForPath('')).toBe('home')
  })

  it('returns the first path segment for sub-pages', () => {
    expect(ogEyebrowForPath('/about')).toBe('about')
    expect(ogEyebrowForPath('/open-source')).toBe('open-source')
    expect(ogEyebrowForPath('/writing/some-post')).toBe('writing')
  })
})
