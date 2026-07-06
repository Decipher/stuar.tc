import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import {
  formatAge,
  formatGHAction,
  getGHHref,
  extractDrupalProject,
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
      .toBe('pushed 3 commits')
  })
  it('PushEvent: falls back to commits.length when no size', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PushEvent', payload: { commits: [{}, {}] } }))
      .toBe('pushed 2 commits')
  })
  it('PushEvent: uses 1 when neither size nor commits', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PushEvent', payload: {} }))
      .toBe('pushed 1 commit')
  })
  it('ReleaseEvent: uses tag_name', () => {
    expect(formatGHAction({ ...baseEvent, type: 'ReleaseEvent', payload: { release: { tag_name: 'v1.0.0' } } }))
      .toBe('released v1.0.0')
  })
  it('ReleaseEvent: falls back when no release', () => {
    expect(formatGHAction({ ...baseEvent, type: 'ReleaseEvent', payload: {} }))
      .toBe('released new version')
  })
  it('PullRequestEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestEvent', payload: { action: 'opened', pull_request: { number: 42 } } }))
      .toBe('opened PR #42')
  })
  it('CreateEvent: with ref', () => {
    expect(formatGHAction({ ...baseEvent, type: 'CreateEvent', payload: { ref_type: 'branch', ref: 'feat/x' } }))
      .toBe('created branch feat/x')
  })
  it('CreateEvent: without ref', () => {
    expect(formatGHAction({ ...baseEvent, type: 'CreateEvent', payload: { ref_type: 'repository' } }))
      .toBe('created repository')
  })
  it('IssuesEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssuesEvent', payload: { action: 'closed', issue: { number: 7 } } }))
      .toBe('closed issue #7')
  })
  it('IssueCommentEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssueCommentEvent', payload: { issue: { number: 99 } } }))
      .toBe('commented on #99')
  })
  it('default: lowercases unknown event type', () => {
    expect(formatGHAction({ ...baseEvent, type: 'WatchEvent', payload: {} }))
      .toBe('watch')
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
    expect(mergeActivity(null, null, null)).toEqual([])
  })

  it('merges, sorts by recency, and caps at 5 items', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = [
      { type: 'PushEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T11:00:00Z', payload: { size: 2 } },
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

    const result = mergeActivity(ghEvents, drupalComments, drupalReleases)

    expect(result).toHaveLength(5)
    expect(result[0]!.repo).toBe('druxt/druxt')
    expect(result[0]!.action).toBe('pushed 2 commits')
    expect(result[0]!.href).toBe('https://github.com/druxt/druxt')
    expect(result.every(item => 'when' in item && 'repo' in item && 'action' in item)).toBe(true)
  })
})

// --- useActivity ---

const ghData = ref<unknown>(null)
const commentsData = ref<unknown>(null)
const releasesData = ref<unknown>(null)

mockNuxtImport('useFetch', () => {
  return (url: string) => {
    if (url.includes('github.com')) return { data: ghData }
    if (url.includes('comment')) return { data: commentsData }
    return { data: releasesData }
  }
})

describe('useActivity', () => {
  beforeEach(() => {
    ghData.value = null
    commentsData.value = null
    releasesData.value = null
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns empty activity when data is null', () => {
    const { activity } = useActivity()
    expect(activity.value).toEqual([])
  })

  it('returns merged live activity when data is available', () => {
    ghData.value = [
      { type: 'PushEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T11:00:00Z', payload: { size: 3 } },
    ]
    const { activity } = useActivity()
    expect(activity.value).toHaveLength(1)
    expect(activity.value[0]!.repo).toBe('druxt/druxt')
  })
})
