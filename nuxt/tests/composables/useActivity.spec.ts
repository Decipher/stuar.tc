import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import {
  formatAge,
  formatGHAction,
  getGHHref,
  extractDrupalProject,
  extractDrupalMRProject,
  parseDrupalRelease,
  mergeActivity,
  useActivity,
} from '~/composables/useActivity'

// --- formatAge ---

describe('formatAge', () => {
  const base = new Date('2026-07-03T06:00:00Z').getTime()

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns minutes when < 60m (string input)', () => {
    vi.setSystemTime(base + 30 * 60_000)
    expect(formatAge('2026-07-03T06:00:00Z')).toBe('30m')
  })
  it('returns hours when < 24h', () => {
    vi.setSystemTime(base + 5 * 60 * 60_000)
    expect(formatAge('2026-07-03T06:00:00Z')).toBe('5h')
  })
  it('returns days when < 7d', () => {
    vi.setSystemTime(base + 3 * 24 * 60 * 60_000)
    expect(formatAge('2026-07-03T06:00:00Z')).toBe('3d')
  })
  it('returns weeks when >= 7d', () => {
    vi.setSystemTime(base + 14 * 24 * 60 * 60_000)
    expect(formatAge('2026-07-03T06:00:00Z')).toBe('2w')
  })
  it('accepts unix timestamp (number input)', () => {
    vi.setSystemTime(base + 2 * 60 * 60_000)
    expect(formatAge(base / 1000)).toBe('2h')
  })
})

// --- formatGHAction ---

const baseEvent = { repo: { name: 'foo/bar' }, created_at: '' }

describe('formatGHAction', () => {
  it('PushEvent: uses payload.size', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PushEvent', payload: { size: 3 } }))
      .toEqual({ verb: 'pushed', rest: '3 times' })
  })
  it('PushEvent: falls back to commits.length when no size', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PushEvent', payload: { commits: [{}, {}] } }))
      .toEqual({ verb: 'pushed', rest: '2 times' })
  })
  it('PushEvent: uses 1 when neither size nor commits', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PushEvent', payload: {} }))
      .toEqual({ verb: 'pushed', rest: '' })
  })
  it('ReleaseEvent: uses tag_name', () => {
    expect(formatGHAction({ ...baseEvent, type: 'ReleaseEvent', payload: { release: { tag_name: 'v1.0.0' } } }))
      .toEqual({ verb: 'released', rest: 'v1.0.0' })
  })
  it('ReleaseEvent: falls back when no release', () => {
    expect(formatGHAction({ ...baseEvent, type: 'ReleaseEvent', payload: {} }))
      .toEqual({ verb: 'released', rest: 'new version' })
  })
  it('PullRequestEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestEvent', payload: { action: 'opened', pull_request: { number: 42 } } }))
      .toEqual({ verb: 'opened PR', rest: '#42' })
  })
  it('PullRequestEvent: without number', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestEvent', payload: { action: 'opened' } }))
      .toEqual({ verb: 'opened PR', rest: '' })
  })
  it('CreateEvent: with ref', () => {
    expect(formatGHAction({ ...baseEvent, type: 'CreateEvent', payload: { ref_type: 'branch', ref: 'feat/x' } }))
      .toEqual({ verb: 'created branch', rest: 'feat/x' })
  })
  it('CreateEvent: without ref', () => {
    expect(formatGHAction({ ...baseEvent, type: 'CreateEvent', payload: { ref_type: 'repository' } }))
      .toEqual({ verb: 'created repository', rest: '' })
  })
  it('CreateEvent: without ref_type', () => {
    expect(formatGHAction({ ...baseEvent, type: 'CreateEvent', payload: {} }))
      .toEqual({ verb: 'created ', rest: '' })
  })
  it('IssuesEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssuesEvent', payload: { action: 'closed', issue: { number: 7 } } }))
      .toEqual({ verb: 'closed issue', rest: '#7' })
  })
  it('IssuesEvent: without number', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssuesEvent', payload: { action: 'closed' } }))
      .toEqual({ verb: 'closed issue', rest: '' })
  })
  it('IssueCommentEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssueCommentEvent', payload: { issue: { number: 99 } } }))
      .toEqual({ verb: 'commented', rest: 'on #99' })
  })
  it('IssueCommentEvent: without number', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssueCommentEvent', payload: {} }))
      .toEqual({ verb: 'commented', rest: '' })
  })
  it('default: lowercases unknown event type', () => {
    expect(formatGHAction({ ...baseEvent, type: 'WatchEvent', payload: {} }))
      .toEqual({ verb: 'watch', rest: '' })
  })
})

// --- getGHHref ---

describe('getGHHref', () => {
  it('PushEvent: returns repo URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'PushEvent', payload: {} }))
      .toBe('https://github.com/foo/bar')
  })
  it('ReleaseEvent: returns releases URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'ReleaseEvent', payload: {} }))
      .toBe('https://github.com/foo/bar/releases')
  })
  it('PullRequestEvent: returns PR URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'PullRequestEvent', payload: { pull_request: { number: 42 } } }))
      .toBe('https://github.com/foo/bar/pull/42')
  })
  it('PullRequestEvent: falls back when no number', () => {
    expect(getGHHref({ ...baseEvent, type: 'PullRequestEvent', payload: {} }))
      .toBe('https://github.com/foo/bar')
  })
  it('IssuesEvent: returns issue URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'IssuesEvent', payload: { issue: { number: 7 } } }))
      .toBe('https://github.com/foo/bar/issues/7')
  })
  it('IssuesEvent: falls back when no number', () => {
    expect(getGHHref({ ...baseEvent, type: 'IssuesEvent', payload: {} }))
      .toBe('https://github.com/foo/bar')
  })
  it('IssueCommentEvent: returns issue URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'IssueCommentEvent', payload: { issue: { number: 99 } } }))
      .toBe('https://github.com/foo/bar/issues/99')
  })
  it('IssueCommentEvent: falls back when no number', () => {
    expect(getGHHref({ ...baseEvent, type: 'IssueCommentEvent', payload: {} }))
      .toBe('https://github.com/foo/bar')
  })
  it('CreateEvent: returns repo URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'CreateEvent', payload: {} }))
      .toBe('https://github.com/foo/bar')
  })
})

// --- extractDrupalProject ---

describe('extractDrupalProject', () => {
  it('extracts project name from issue URL', () => {
    expect(extractDrupalProject('https://www.drupal.org/project/filefield_paths/issues/123#comment-456'))
      .toBe('drupal/filefield_paths')
  })
  it('returns drupal.org for unrecognised URL', () => {
    expect(extractDrupalProject('https://www.drupal.org/node/12345'))
      .toBe('drupal.org')
  })
})

// --- extractDrupalMRProject ---

describe('extractDrupalMRProject', () => {
  it('extracts project name from Drupal GitLab MR URL', () => {
    expect(extractDrupalMRProject('https://git.drupalcode.org/project/filefield_paths/-/merge_requests/70'))
      .toBe('drupal/filefield_paths')
  })
  it('returns drupal.org for unrecognised URL', () => {
    expect(extractDrupalMRProject('https://example.com/some/path'))
      .toBe('drupal.org')
  })
})

// --- parseDrupalRelease ---

describe('parseDrupalRelease', () => {
  it('splits module name and version', () => {
    expect(parseDrupalRelease('custom_formatters 4.1.0-beta3'))
      .toEqual({ module: 'custom_formatters', version: '4.1.0-beta3' })
  })
  it('handles title with no space', () => {
    expect(parseDrupalRelease('noversion'))
      .toEqual({ module: 'noversion', version: '' })
  })
})

// --- mergeActivity ---

describe('mergeActivity', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns empty array when all sources are null', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    expect(mergeActivity(null, null, null, null)).toEqual([])
  })

  it('merges and sorts all items by recency', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = [
      { type: 'PushEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T11:00:00Z', payload: {} },
      { type: 'CreateEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-01T10:00:00Z', payload: { ref_type: 'branch', ref: 'feat/x' } },
    ]
    const drupalComments = {
      list: [
        { created: String(Math.floor(new Date('2026-07-03T10:00:00Z').getTime() / 1000)), url: 'https://www.drupal.org/project/filefield_paths/issues/999#comment-1' },
        { created: String(Math.floor(new Date('2026-06-30T08:00:00Z').getTime() / 1000)), url: 'https://www.drupal.org/project/custom_formatters/issues/100#comment-2' },
      ],
    }
    const drupalReleases = {
      list: [
        { created: String(Math.floor(new Date('2026-07-02T09:00:00Z').getTime() / 1000)), title: 'field_tokens 2.0.0-rc4' },
        { created: String(Math.floor(new Date('2026-06-28T07:00:00Z').getTime() / 1000)), title: 'custom_formatters 4.1.0-beta3' },
      ],
    }

    const result = mergeActivity(ghEvents, drupalComments, drupalReleases, null)

    expect(result).toHaveLength(6)
    expect(result[0]!.repo).toBe('druxt/druxt')
    expect(result[0]!.verb).toBe('pushed')
    expect(result[0]!.href).toBe('https://github.com/druxt/druxt')
    expect(result.every(item => 'when' in item && 'repo' in item && 'verb' in item)).toBe(true)
  })

  it('groups push events from the same repo on the same day', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = [
      { type: 'PushEvent', repo: { name: 'Decipher/filefield_paths' }, created_at: '2026-07-03T11:00:00Z', payload: {} },
      { type: 'PushEvent', repo: { name: 'Decipher/filefield_paths' }, created_at: '2026-07-03T10:00:00Z', payload: {} },
      { type: 'PushEvent', repo: { name: 'Decipher/filefield_paths' }, created_at: '2026-07-03T09:00:00Z', payload: {} },
      { type: 'PushEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T08:00:00Z', payload: {} },
    ]

    const result = mergeActivity(ghEvents, null, null, null)

    expect(result).toHaveLength(2)
    const fp = result.find(r => r.repo === 'Decipher/filefield_paths')
    expect(fp!.verb).toBe('pushed')
    expect(fp!.rest).toBe('3 times')
    const druxt = result.find(r => r.repo === 'druxt/druxt')
    expect(druxt!.verb).toBe('pushed')
  })

  it('keeps push events from the same repo on different days separate', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = [
      { type: 'PushEvent', repo: { name: 'Decipher/filefield_paths' }, created_at: '2026-07-03T11:00:00Z', payload: {} },
      { type: 'PushEvent', repo: { name: 'Decipher/filefield_paths' }, created_at: '2026-07-02T10:00:00Z', payload: {} },
    ]

    const result = mergeActivity(ghEvents, null, null, null)
    expect(result).toHaveLength(2)
  })

  it('caps at 30 items total', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = Array.from({ length: 40 }, (_, i) => ({
      type: 'CreateEvent',
      repo: { name: `owner/repo-${i}` },
      created_at: new Date(Date.now() - i * 60_000).toISOString(),
      payload: { ref_type: 'branch', ref: `feat/${i}` },
    }))

    const result = mergeActivity(ghEvents, null, null, null)
    expect(result).toHaveLength(30)
  })

  it('includes Drupal GitLab MRs in feed', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const drupalMRs = [
      {
        created_at: '2026-07-03T10:00:00Z',
        state: 'opened',
        web_url: 'https://git.drupalcode.org/project/filefield_paths/-/merge_requests/70',
        title: 'feat: add new feature',
      },
      {
        created_at: '2026-07-01T09:00:00Z',
        state: 'merged',
        web_url: 'https://git.drupalcode.org/project/decoupled_router/-/merge_requests/5',
        title: 'fix: resolve bug',
      },
    ]

    const result = mergeActivity(null, null, null, drupalMRs)

    expect(result).toHaveLength(2)
    expect(result[0]!.verb).toBe('opened MR')
    expect(result[0]!.repo).toBe('drupal/filefield_paths')
    expect(result[0]!.href).toBe('https://git.drupalcode.org/project/filefield_paths/-/merge_requests/70')
    expect(result[1]!.verb).toBe('merged MR')
  })

  it('uses closed MR action for closed state', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const drupalMRs = [{
      created_at: '2026-07-03T10:00:00Z',
      state: 'closed',
      web_url: 'https://git.drupalcode.org/project/filefield_paths/-/merge_requests/1',
      title: 'test MR',
    }]

    const result = mergeActivity(null, null, null, drupalMRs)
    expect(result[0]!.verb).toBe('closed MR')
  })
})

// --- useActivity ---

const ghEventsData = ref<unknown>(null)
const commentsData = ref<unknown>(null)
const releasesData = ref<unknown>(null)
const drupalMRsData = ref<unknown>(null)

mockNuxtImport('useFetch', () => {
  return (url: string) => {
    if (url.includes('/api/activity-gh')) return { data: ghEventsData, refresh: vi.fn() }
    if (url.includes('drupalcode.org')) return { data: drupalMRsData, refresh: vi.fn() }
    if (url.includes('comment')) return { data: commentsData, refresh: vi.fn() }
    return { data: releasesData, refresh: vi.fn() }
  }
})

describe('useActivity', () => {
  beforeEach(() => {
    ghEventsData.value = null
    commentsData.value = null
    releasesData.value = null
    drupalMRsData.value = null
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns empty activity when data is null', () => {
    const { activity } = useActivity()
    expect(activity.value).toEqual([])
  })

  it('returns merged live activity when gh data is available', () => {
    ghEventsData.value = [
      { type: 'PushEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T11:00:00Z', payload: {} },
    ]
    const { activity } = useActivity()
    expect(activity.value).toHaveLength(1)
    expect(activity.value[0]!.repo).toBe('druxt/druxt')
  })

  it('includes Drupal GitLab MRs in activity', () => {
    drupalMRsData.value = [{
      created_at: '2026-07-03T10:00:00Z',
      state: 'opened',
      web_url: 'https://git.drupalcode.org/project/filefield_paths/-/merge_requests/70',
      title: 'feat: add feature',
    }]
    const { activity } = useActivity()
    expect(activity.value).toHaveLength(1)
    expect(activity.value[0]!.verb).toBe('opened MR')
  })
})
