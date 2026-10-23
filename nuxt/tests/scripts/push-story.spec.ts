import { describe, it, expect } from 'vitest'

import { allCategories, buildNodeResource, pickedPaths } from '../../scripts/push-story.mjs'

const article = {
  title: 'Druxt 0.25.0',
  path: '/writing/druxt-0250-caching-and-performance-buffs-20261023',
  date: '2026-10-23T18:00:00+11:00',
  description: 'Caching.',
  categories: ['Drupal', 'Druxt'],
  hiddenCategories: ['Planet Drupal'],
  related: [
    { path: '/writing/druxt-auth-050-two-ways-to-sign-in-20260926', source: 'picked' },
    { path: '/writing/jsonapi-views-120-20260812', source: 'view' },
    { path: '/writing/field-tokens-200-20260722', source: 'latest' },
  ],
}

describe('push-story.mjs — Read next picks', () => {
  it('writes back only the manual picks, in order', () => {
    expect(pickedPaths(article)).toEqual(['/writing/druxt-auth-050-two-ways-to-sign-in-20260926'])
  })

  it('writes back nothing for an article with no related entries', () => {
    expect(pickedPaths({})).toEqual([])
  })

  it('sets field_topics to the resolved topic terms, and clears it when there are none', () => {
    expect(buildNodeResource(article, [], 'type', [], [], ['t1', 't2']).relationships.field_topics).toEqual({
      data: [{ type: 'taxonomy_term--article_topic', id: 't1' }, { type: 'taxonomy_term--article_topic', id: 't2' }],
    })
    expect(buildNodeResource(article, [], 'type', []).relationships.field_topics).toEqual({ data: [] })
  })

  it('sets field_related to the resolved picks, and clears it when there are none', () => {
    expect(buildNodeResource(article, [], 'type', [], ['a', 'b']).relationships.field_related).toEqual({
      data: [{ type: 'node--article', id: 'a' }, { type: 'node--article', id: 'b' }],
    })
    expect(buildNodeResource(article, [], 'type', []).relationships.field_related).toEqual({ data: [] })
  })
})

describe('push-story.mjs — categories', () => {
  it('writes back the non-public categories with the public ones', () => {
    expect(allCategories(article)).toEqual(['Drupal', 'Druxt', 'Planet Drupal'])
  })

  it('copes with articles that have neither list', () => {
    expect(allCategories({})).toEqual([])
  })
})
