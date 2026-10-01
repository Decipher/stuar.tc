import { describe, it, expect, vi } from 'vitest'
import { buildPageDocuments } from '../../server/utils/llmsFullPages'

// One DrupalCon with a note, since none in the real data carries one yet.
vi.mock('~/data/drupalcons', () => ({
  drupalcons: [{ year: '2024', city: 'Singapore', note: 'Splash Award' }, { year: '2011', city: 'London' }],
}))

const pages = buildPageDocuments()
const page = (path: string) => pages.find(p => p.path === path)!.body.join('\n\n')

describe('buildPageDocuments', () => {
  it('builds About, Open source and Community, in that order', () => {
    expect(pages.map(p => p.path)).toEqual(['/about', '/open-source', '/community'])
    for (const p of pages) {
      expect(p.title).toBeTruthy()
      expect(p.description).toBeTruthy()
    }
  })

  it('carries the about bio, stats, expertise and profiles', () => {
    const about = page('/about')
    expect(about).toContain('I build decoupled Drupal systems.')
    expect(about).toContain('- 24+ years building for the web')
    expect(about).toContain('- **Decoupled Drupal** (Core): JSON:API')
    expect(about).toContain('- [linkedin](https://au.linkedin.com/in/stuartclark4)')
  })

  it('links every authored and co-maintained module to its drupal.org project', () => {
    const openSource = page('/open-source')
    expect(openSource).toContain('- [File (Field) Paths](https://www.drupal.org/project/filefield_paths): 32,140 sites')
    expect(openSource).toContain('- [decoupled_router](https://www.drupal.org/project/decoupled_router)')
    expect(openSource).toContain('### DruxtJS')
  })

  it('lists talks newest first, and DrupalCons with their note when there is one', () => {
    const community = page('/community')
    expect(community.indexOf('Moving to a sustainable web')).toBeLessThan(community.indexOf('Features 101'))
    expect(community).toContain('- 2024: Singapore (Splash Award)')
    expect(community).toContain('**Druxt.js: Nuxt.js in the front, Drupal in the back**, DrupalGov')
    expect(community).toContain('- 2011: London\n')
    expect(community).toContain('**Drupal Melbourne meetup**, 2011 – present: Ongoing mentoring')
  })

  it('never publishes the private evidence notes on talks and organiser roles', () => {
    const all = pages.map(p => p.body.join('\n')).join('\n')
    expect(all).not.toMatch(/bichon|envelope|@gmail|evidence|confidence/i)
  })
})
