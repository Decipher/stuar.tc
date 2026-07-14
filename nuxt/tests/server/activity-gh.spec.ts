import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { fetchGHActivity, trimGHEvent } from '../../server/api/activity-gh.get'

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
        issue: { number: 42 },
      },
    })
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
