import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { fetchGHActivity } from '../../server/api/activity-gh.get'

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
