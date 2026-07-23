import { describe, expect, it } from 'vitest'
import { canonicalUrlForPath, ogDescriptionForPath, ogEyebrowForPath, ogTitleForPath, SITE_ORIGIN } from '~/utils/socialMeta'

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

describe('ogDescriptionForPath', () => {
  it('returns the site-wide bio for the homepage', () => {
    expect(ogDescriptionForPath('/')).toBe('Senior Drupal & JavaScript engineer. Creator of DruxtJS. Doing Druxt.')
  })

  it('returns the section-specific description for an exact route', () => {
    expect(ogDescriptionForPath('/writing')).toBe('Notes on Druxt, decoupled Drupal, and whatever else comes up building this stuff for a living.')
  })

  it('falls back to the nearest section description for dynamic routes', () => {
    expect(ogDescriptionForPath('/writing/some-post')).toBe('Notes on Druxt, decoupled Drupal, and whatever else comes up building this stuff for a living.')
  })

  it('falls back to the site-wide bio for unknown routes', () => {
    expect(ogDescriptionForPath('/something-unknown')).toBe('Senior Drupal & JavaScript engineer. Creator of DruxtJS. Doing Druxt.')
  })

  it('falls back to the site-wide bio for an empty path', () => {
    expect(ogDescriptionForPath('')).toBe('Senior Drupal & JavaScript engineer. Creator of DruxtJS. Doing Druxt.')
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
