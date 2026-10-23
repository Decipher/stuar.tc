import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import {
  DEVNULL_REPO,
  drupalMRRef,
  formatAge,
  formatShortDate,
  formatGHAction,
  withTitle,
  getGHHref,
  extractDrupalProject,
  extractDrupalMRProject,
  parseDrupalRelease,
  mergeActivity,
  useActivity,
  transformDrupalComments,
  transformDrupalReleases,
  transformDrupalMRs,
} from '~/composables/useActivity'

// --- transform* (drupal.org/gitlab API response trimming) ---

describe('transformDrupalComments', () => {
  it('trims each comment down to created and url', () => {
    const result = transformDrupalComments({
      list: [{ created: '123', url: 'https://example.com', body: { value: 'full comment text' } } as never],
    })
    expect(result).toEqual({ list: [{ created: '123', url: 'https://example.com' }] })
  })
})

describe('transformDrupalReleases', () => {
  it('trims each release down to created and title', () => {
    const result = transformDrupalReleases({
      list: [{ created: '456', title: 'field_tokens 2.0.0', body: { value: 'full release notes' } } as never],
    })
    expect(result).toEqual({ list: [{ created: '456', title: 'field_tokens 2.0.0' }] })
  })
})

describe('transformDrupalMRs', () => {
  it('trims each MR down to created_at, state, web_url, and title', () => {
    const result = transformDrupalMRs([
      {
        created_at: '2026-07-03T10:00:00Z',
        state: 'opened',
        web_url: 'https://git.drupalcode.org/project/x/-/merge_requests/1',
        title: 'feat: x',
        // Fields the real GitLab MR API includes that must be dropped.
        description: 'Full description...',
        assignees: [{ username: 'deciphered' }],
      } as never,
    ])
    expect(result).toEqual([{
      created_at: '2026-07-03T10:00:00Z',
      state: 'opened',
      web_url: 'https://git.drupalcode.org/project/x/-/merge_requests/1',
      title: 'feat: x',
    }])
  })
})

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
  it('takes an explicit now', () => {
    expect(formatAge('2026-07-03T06:00:00Z', base + 3 * 60_000)).toBe('3m')
  })
  it('reads a future time (clock skew) as 0m', () => {
    expect(formatAge('2026-07-03T06:00:00Z', base - 5 * 60_000)).toBe('0m')
  })
})

describe('formatShortDate', () => {
  it('formats as month and day in the author\'s zone (Melbourne)', () => {
    expect(formatShortDate('2026-10-23T09:00:00Z')).toBe('Oct 23')
    // 18:49 UTC on the 23rd is already the 24th in Melbourne (UTC+11).
    expect(formatShortDate('2026-10-23T18:49:47Z')).toBe('Oct 24')
  })
})

describe('withTitle', () => {
  it('joins ref and title with a middle dot', () => {
    expect(withTitle('#209', ' chore(release): cut v1.11.0 ')).toBe('#209 · chore(release): cut v1.11.0')
  })
  it('drops whichever part is missing', () => {
    expect(withTitle('#209')).toBe('#209')
    expect(withTitle('#209', '  ')).toBe('#209')
    expect(withTitle('', 'Title')).toBe('Title')
  })
})

describe('drupalMRRef', () => {
  it('reads the MR number from the URL', () => {
    expect(drupalMRRef('https://git.drupalcode.org/project/x/-/merge_requests/70')).toBe('!70')
    expect(drupalMRRef('https://git.drupalcode.org/project/x')).toBe('')
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
  it('PullRequestEvent: with a looked-up title', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestEvent', payload: { action: 'merged', pull_request: { number: 209, title: 'chore(release): cut v1.11.0' } } }))
      .toEqual({ verb: 'merged PR', rest: '#209 · chore(release): cut v1.11.0' })
  })
  it('PullRequestEvent: without action', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestEvent', payload: { pull_request: { number: 1 } } }))
      .toEqual({ verb: 'updated PR', rest: '#1' })
  })
  it('PullRequestReviewEvent: reads "reviewed PR", never the raw event name', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestReviewEvent', payload: { action: 'created', pull_request: { number: 209, title: 'Title' } } }))
      .toEqual({ verb: 'reviewed PR', rest: '#209 · Title' })
  })
  it('PullRequestReviewCommentEvent: reads "commented on PR"', () => {
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestReviewCommentEvent', payload: { action: 'created', pull_request: { number: 12 } } }))
      .toEqual({ verb: 'commented on PR', rest: '#12' })
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
      .toEqual({ verb: 'created', rest: '' })
  })
  it('IssuesEvent', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssuesEvent', payload: { action: 'closed', issue: { number: 7 } } }))
      .toEqual({ verb: 'closed issue', rest: '#7' })
  })
  it('IssuesEvent: without number', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssuesEvent', payload: { action: 'closed' } }))
      .toEqual({ verb: 'closed issue', rest: '' })
  })
  it('IssuesEvent: with title, and without action', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssuesEvent', payload: { issue: { number: 7, title: 'Broken' } } }))
      .toEqual({ verb: 'updated issue', rest: '#7 · Broken' })
  })
  it('IssueCommentEvent: on an issue', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssueCommentEvent', payload: { issue: { number: 99, title: 'Broken' } } }))
      .toEqual({ verb: 'commented on issue', rest: '#99 · Broken' })
  })
  it('IssueCommentEvent: on a pull request', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssueCommentEvent', payload: { issue: { number: 99, title: 'Fix', pull_request: true } } }))
      .toEqual({ verb: 'commented on PR', rest: '#99 · Fix' })
  })
  it('IssueCommentEvent: without number', () => {
    expect(formatGHAction({ ...baseEvent, type: 'IssueCommentEvent', payload: {} }))
      .toEqual({ verb: 'commented on issue', rest: '' })
  })
  it.each([
    ['WatchEvent', 'starred'],
    ['ForkEvent', 'forked'],
    ['PublicEvent', 'open-sourced'],
    ['CommitCommentEvent', 'commented on commit'],
    ['GollumEvent', 'edited wiki'],
    ['MemberEvent', 'added collaborator'],
  ])('%s reads "%s"', (type, verb) => {
    expect(formatGHAction({ ...baseEvent, type, payload: {} })).toEqual({ verb, rest: '' })
  })
  it('default: turns an unknown type into words, never the raw name', () => {
    expect(formatGHAction({ ...baseEvent, type: 'DiscussionEvent', payload: { action: 'created' } }))
      .toEqual({ verb: 'created discussion', rest: '' })
    expect(formatGHAction({ ...baseEvent, type: 'PullRequestReviewThreadEvent', payload: {} }))
      .toEqual({ verb: 'updated pull request review thread', rest: '' })
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
  it.each(['PullRequestReviewEvent', 'PullRequestReviewCommentEvent'])('%s: returns PR URL', (type) => {
    expect(getGHHref({ ...baseEvent, type, payload: { pull_request: { number: 5 } } }))
      .toBe('https://github.com/foo/bar/pull/5')
  })
  it('IssueCommentEvent on a pull request: returns PR URL', () => {
    expect(getGHHref({ ...baseEvent, type: 'IssueCommentEvent', payload: { issue: { number: 99, pull_request: true } } }))
      .toBe('https://github.com/foo/bar/pull/99')
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
      { type: 'PullRequestEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T11:00:00Z', payload: { action: 'opened', pull_request: { number: 1 } } },
      { type: 'IssuesEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-01T10:00:00Z', payload: { action: 'opened', issue: { number: 2 } } },
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
    expect(result[0]!.verb).toBe('opened PR')
    expect(result[0]!.href).toBe('https://github.com/druxt/druxt/pull/1')
    expect(result.every(item => 'when' in item && 'repo' in item && 'verb' in item)).toBe(true)
  })

  it('excludes low-signal event types (delete, push, create)', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = [
      { type: 'DeleteEvent', repo: { name: 'a/a' }, created_at: '2026-07-03T11:00:00Z', payload: {} },
      { type: 'PushEvent', repo: { name: 'a/a' }, created_at: '2026-07-03T10:00:00Z', payload: {} },
      { type: 'CreateEvent', repo: { name: 'a/a' }, created_at: '2026-07-03T09:00:00Z', payload: { ref_type: 'branch', ref: 'feat/x' } },
      { type: 'IssuesEvent', repo: { name: 'a/a' }, created_at: '2026-07-03T08:00:00Z', payload: { action: 'opened', issue: { number: 1 } } },
    ]

    const result = mergeActivity(ghEvents, null, null, null)

    expect(result).toHaveLength(1)
    expect(result[0]!.verb).toBe('opened issue')
  })

  it('excludes labeled issue events', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = [
      { type: 'IssuesEvent', repo: { name: 'a/a' }, created_at: '2026-07-03T11:00:00Z', payload: { action: 'labeled', issue: { number: 1 } } },
      { type: 'IssuesEvent', repo: { name: 'a/a' }, created_at: '2026-07-03T10:00:00Z', payload: { action: 'closed', issue: { number: 2 } } },
    ]

    const result = mergeActivity(ghEvents, null, null, null)

    expect(result).toHaveLength(1)
    expect(result[0]!.verb).toBe('closed issue')
  })

  it('caps at 30 items total', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))

    const ghEvents = Array.from({ length: 40 }, (_, i) => ({
      type: 'IssuesEvent',
      repo: { name: `owner/repo-${i}` },
      created_at: new Date(Date.now() - i * 60_000).toISOString(),
      payload: { action: 'opened', issue: { number: i } },
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

  it('shows the drupal.org MR number and title', () => {
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'))
    const result = mergeActivity(null, null, null, [{
      created_at: '2026-07-03T10:00:00Z',
      state: 'opened',
      web_url: 'https://git.drupalcode.org/project/filefield_paths/-/merge_requests/70',
      title: 'Issue #3500000: Fix tokens',
    }])
    expect(result[0]!.rest).toBe('!70 · Issue #3500000: Fix tokens')
  })

  it('gives every row an ISO at and a short absolute when', () => {
    const result = mergeActivity(
      [{ type: 'ReleaseEvent', repo: { name: 'a/b' }, created_at: '2026-10-22T03:00:00Z', payload: { release: { tag_name: 'v1' } } }],
      { list: [{ created: String(Date.parse('2026-10-20T03:00:00Z') / 1000), url: 'https://www.drupal.org/project/x/issues/1' }] },
      null,
      null,
    )
    expect(result.map(r => [r.at, r.when])).toEqual([
      ['2026-10-22T03:00:00.000Z', 'Oct 22'],
      ['2026-10-20T03:00:00.000Z', 'Oct 20'],
    ])
  })

  it('drops rows whose date cannot be parsed', () => {
    const result = mergeActivity(
      [{ type: 'ReleaseEvent', repo: { name: 'a/b' }, created_at: 'garbage', payload: {} }],
      null,
      null,
      null,
      [{ id: 'x', published: 'nope', url: 'https://dev-null.sh/x', text: 'hi' }],
    )
    expect(result).toEqual([])
  })

  it('merges /dev/null posts by date with the other sources', () => {
    const result = mergeActivity(
      [{ type: 'PullRequestReviewEvent', repo: { name: 'Decipher/stuar.tc' }, created_at: '2026-10-23T18:00:00Z', payload: { action: 'created', pull_request: { number: 209, title: 'chore(release): cut v1.11.0' } } }],
      null,
      null,
      null,
      [
        { id: 'a', published: '2026-10-23T18:49:47.000Z', url: 'https://dev-null.sh/@Decipher/commits/a', text: 'Druxt 0.25.0 is out.' },
        { id: 'b', published: '2026-10-20T00:00:00.000Z', url: 'https://dev-null.sh/@Decipher/commits/b', text: 'Hello world.' },
      ],
    )
    expect(result).toEqual([
      {
        at: '2026-10-23T18:49:47.000Z',
        when: 'Oct 24',
        repo: DEVNULL_REPO,
        verb: 'posted',
        rest: 'Druxt 0.25.0 is out.',
        source: '/DEV/NULL',
        href: 'https://dev-null.sh/@Decipher/commits/a',
      },
      {
        at: '2026-10-23T18:00:00.000Z',
        when: 'Oct 24',
        repo: 'Decipher/stuar.tc',
        verb: 'reviewed PR',
        rest: '#209 · chore(release): cut v1.11.0',
        source: 'GH',
        href: 'https://github.com/Decipher/stuar.tc/pull/209',
      },
      expect.objectContaining({ repo: DEVNULL_REPO, rest: 'Hello world.', when: 'Oct 20' }),
    ])
  })
})

// --- useActivity ---

const ghEventsData = ref<unknown>(null)
const commentsData = ref<unknown>(null)
const releasesData = ref<unknown>(null)
const drupalMRsData = ref<unknown>(null)
const devnullData = ref<unknown>(null)

const ghStatus = ref<'idle' | 'pending' | 'success' | 'error'>('success')

const refreshGH = vi.fn()
const refreshComments = vi.fn()
const refreshReleases = vi.fn()
const refreshMRs = vi.fn()
const refreshDevNull = vi.fn()

mockNuxtImport('useFetch', () => {
  return (url: string) => {
    if (url.includes('/api/activity-gh')) return { data: ghEventsData, status: ghStatus, refresh: refreshGH }
    if (url === '/api/activity-devnull') return { data: devnullData, refresh: refreshDevNull }
    if (new URL(url).hostname === 'git.drupalcode.org') return { data: drupalMRsData, refresh: refreshMRs }
    if (url.includes('comment')) return { data: commentsData, refresh: refreshComments }
    return { data: releasesData, refresh: refreshReleases }
  }
})

describe('useActivity', () => {
  beforeEach(() => {
    ghEventsData.value = null
    commentsData.value = null
    releasesData.value = null
    drupalMRsData.value = null
    devnullData.value = null
    refreshDevNull.mockClear()
    refreshGH.mockClear()
    refreshComments.mockClear()
    refreshReleases.mockClear()
    refreshMRs.mockClear()
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
      { type: 'IssuesEvent', repo: { name: 'druxt/druxt' }, created_at: '2026-07-03T11:00:00Z', payload: { action: 'opened', issue: { number: 1 } } },
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

  it('refreshLive triggers all live data refreshes', () => {
    const { refreshLive } = useActivity()
    refreshLive()
    expect(refreshGH).toHaveBeenCalledTimes(1)
    expect(refreshComments).toHaveBeenCalledTimes(1)
    expect(refreshReleases).toHaveBeenCalledTimes(1)
    expect(refreshMRs).toHaveBeenCalledTimes(1)
    expect(refreshDevNull).toHaveBeenCalledTimes(1)
  })

  it('includes /dev/null posts in activity', () => {
    devnullData.value = [{ id: 'a', published: '2026-07-03T11:00:00.000Z', url: 'https://dev-null.sh/@Decipher/commits/a', text: 'Hello world.' }]
    const { activity } = useActivity()
    expect(activity.value).toHaveLength(1)
    expect(activity.value[0]).toMatchObject({ source: '/DEV/NULL', verb: 'posted', rest: 'Hello world.' })
  })
})
