import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { attachPRTitles, fetchGHActivity, PR_TITLE_LOOKUP_CAP, trimGHEvent } from '../../server/api/activity-gh.get'
import type { TrimmedGHEvent } from '../../server/api/activity-gh.get'

function makeEvent() {
  const req = new IncomingMessage(null as never)
  req.url = '/'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('fetchGHActivity', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('fetches 3 pages and flattens results', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 1 }]) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 2 }]) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 3 }]) } as Response)

    const result = await fetchGHActivity()
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('sends Authorization header when token provided', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response)

    await fetchGHActivity('my-token')

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer my-token')
  })

  it('omits Authorization header when no token', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response)

    await fetchGHActivity()

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers).not.toHaveProperty('Authorization')
  })

  it('returns empty array for non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const result = await fetchGHActivity()
    expect(result).toEqual([])
  })

  it('returns empty array on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))

    const result = await fetchGHActivity()
    expect(result).toEqual([])
  })
})

describe('trimGHEvent', () => {
  it('strips unused fields from a full GitHub event', () => {
    const raw = {
      type: 'IssuesEvent',
      repo: { name: 'druxt/druxt', id: 123, url: 'https://api.github.com/repos/druxt/druxt' },
      actor: { id: 1, login: 'Decipher' },
      created_at: '2026-07-03T11:00:00Z',
      payload: {
        action: 'opened',
        issue: { number: 42, title: 'Something', body: 'A very long body...', user: { login: 'someone' } },
      },
    }
    expect(trimGHEvent(raw)).toEqual({
      type: 'IssuesEvent',
      repo: { name: 'druxt/druxt' },
      created_at: '2026-07-03T11:00:00Z',
      payload: {
        size: undefined,
        ref: undefined,
        ref_type: undefined,
        action: 'opened',
        release: undefined,
        pull_request: undefined,
        issue: { number: 42, title: 'Something' },
      },
    })
  })

  it('trims issue titles and flags issues that are pull requests', () => {
    const raw = {
      type: 'IssueCommentEvent',
      repo: { name: 'a/b' },
      created_at: 'x',
      payload: { action: 'created', issue: { number: 7, title: '  Fix the thing \n', pull_request: { url: 'https://api.github.com/x' } } },
    }
    expect(trimGHEvent(raw).payload.issue).toEqual({ number: 7, title: 'Fix the thing', pull_request: true })
  })

  it('keeps release tag_name and pull_request number when present', () => {
    const raw = {
      type: 'ReleaseEvent',
      repo: { name: 'a/b' },
      created_at: 'x',
      payload: {
        release: { tag_name: 'v1.0.0', body: 'long release notes' },
        pull_request: { number: 42, title: 'A very long PR title' },
      },
    }
    const trimmed = trimGHEvent(raw)
    expect(trimmed.payload.release).toEqual({ tag_name: 'v1.0.0' })
    expect(trimmed.payload.pull_request).toEqual({ number: 42, title: 'A very long PR title' })
  })

  it('keeps pull_request as just a number when GitHub sends no title', () => {
    const raw = { type: 'PullRequestEvent', repo: { name: 'a/b' }, created_at: 'x', payload: { action: 'opened', pull_request: { number: 9 } } }
    expect(trimGHEvent(raw).payload.pull_request).toEqual({ number: 9 })
  })

  it('omits release/pull_request/issue when their number/tag is missing', () => {
    const raw = { type: 'PushEvent', repo: { name: 'a/b' }, created_at: 'x', payload: { size: 3 } }
    const trimmed = trimGHEvent(raw)
    expect(trimmed.payload.release).toBeUndefined()
    expect(trimmed.payload.pull_request).toBeUndefined()
    expect(trimmed.payload.issue).toBeUndefined()
    expect(trimmed.payload.size).toBe(3)
  })

  it('handles a missing payload entirely', () => {
    const raw = { type: 'WatchEvent', repo: { name: 'a/b' }, created_at: 'x' }
    expect(trimGHEvent(raw).payload).toEqual({
      size: undefined,
      ref: undefined,
      ref_type: undefined,
      action: undefined,
      release: undefined,
      pull_request: undefined,
      issue: undefined,
    })
  })
})

describe('handler', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('passes GITHUB_TOKEN to fetchGHActivity', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'gh-token')
    vi.stubEnv('GH_TOKEN', '')
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response)

    const { default: handler } = await import('../../server/api/activity-gh.get')
    await handler(makeEvent())

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer gh-token')
  })

  it('returns trimmed events, not the raw GitHub payload', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', '')
    const fullEvent = {
      type: 'IssuesEvent',
      repo: { name: 'druxt/druxt', id: 123 },
      actor: { id: 1, login: 'Decipher' },
      created_at: '2026-07-03T11:00:00Z',
      payload: { action: 'opened', issue: { number: 42, body: 'long body' } },
    }
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve([fullEvent]) } as Response)

    const { default: handler } = await import('../../server/api/activity-gh.get')
    const result = await handler(makeEvent()) as ReturnType<typeof trimGHEvent>[]

    expect(result[0]).not.toHaveProperty('actor')
    expect(result[0]?.repo).toEqual({ name: 'druxt/druxt' })
    expect(result[0]?.payload.issue).toEqual({ number: 42 })
    // No token: no PR title lookups, just the events fetch (3 pages).
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('falls back to GH_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', 'fallback-token')
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response)

    const { default: handler } = await import('../../server/api/activity-gh.get')
    await handler(makeEvent())

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer fallback-token')
  })
})

describe('attachPRTitles', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  function pr(repo: string, number: number, type = 'PullRequestEvent'): TrimmedGHEvent {
    return { type, repo: { name: repo }, created_at: '2026-10-23T00:00:00Z', payload: { action: 'opened', pull_request: { number } } }
  }

  function titleResponse(title: unknown) {
    return { ok: true, json: () => Promise.resolve({ title }) } as Response
  }

  it('makes no requests without a token', async () => {
    const events = [pr('a/b', 1)]
    expect(await attachPRTitles(events)).toBe(events)
    expect(fetch).not.toHaveBeenCalled()
    expect(events[0]!.payload.pull_request).toEqual({ number: 1 })
  })

  it('looks up each distinct PR once and attaches the trimmed title to every event for it', async () => {
    vi.mocked(fetch).mockImplementation(async url =>
      titleResponse(String(url).endsWith('/repos/Decipher/stuar.tc/pulls/209') ? ' chore(release): cut v1.11.0 ' : 'Other'))
    const events = [
      pr('Decipher/stuar.tc', 209),
      pr('Decipher/stuar.tc', 209, 'PullRequestReviewEvent'),
      pr('Decipher/stuar.tc', 209, 'PullRequestReviewCommentEvent'),
      pr('druxt/druxt', 209),
    ]
    await attachPRTitles(events, 'tok')

    expect(fetch).toHaveBeenCalledTimes(2)
    const headers = vi.mocked(fetch).mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok')
    expect(events.slice(0, 3).map(e => e.payload.pull_request!.title)).toEqual(Array(3).fill('chore(release): cut v1.11.0'))
    expect(events[3]!.payload.pull_request!.title).toBe('Other')
  })

  it(`caps lookups at ${PR_TITLE_LOOKUP_CAP}, newest first`, async () => {
    vi.mocked(fetch).mockResolvedValue(titleResponse('T'))
    const events = Array.from({ length: 20 }, (_, i) => pr('a/b', i + 1))
    await attachPRTitles(events, 'tok')

    expect(fetch).toHaveBeenCalledTimes(PR_TITLE_LOOKUP_CAP)
    expect(events[PR_TITLE_LOOKUP_CAP - 1]!.payload.pull_request!.title).toBe('T')
    expect(events[PR_TITLE_LOOKUP_CAP]!.payload.pull_request!.title).toBeUndefined()
  })

  it('skips events that are not PR events, have no PR, no repo, or already have a title', async () => {
    vi.mocked(fetch).mockResolvedValue(titleResponse('T'))
    const events: TrimmedGHEvent[] = [
      { type: 'IssuesEvent', repo: { name: 'a/b' }, payload: { action: 'opened', issue: { number: 1 } } },
      { type: 'ReleaseEvent', repo: { name: 'a/b' }, payload: { pull_request: { number: 2 } } },
      { repo: { name: 'a/b' }, payload: { pull_request: { number: 3 } } },
      { type: 'PullRequestEvent', repo: {}, payload: { pull_request: { number: 4 } } },
      { type: 'PullRequestEvent', repo: { name: 'a/b' }, payload: { pull_request: { number: 5, title: 'Already' } } },
    ]
    await attachPRTitles(events, 'tok')
    expect(fetch).not.toHaveBeenCalled()
    expect(events[4]!.payload.pull_request!.title).toBe('Already')
  })

  it('leaves the title empty when a lookup fails, errors or returns no usable title', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(titleResponse(42))
      .mockResolvedValueOnce(titleResponse('   '))
      .mockResolvedValueOnce(titleResponse('Works'))
    const events = [1, 2, 3, 4, 5].map(n => pr('a/b', n))
    await attachPRTitles(events, 'tok')
    expect(events.map(e => e.payload.pull_request!.title)).toEqual([undefined, undefined, undefined, undefined, 'Works'])
  })
})
