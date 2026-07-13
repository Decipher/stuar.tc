import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { fetchContributions } from '../../server/api/contributions.get'

function makeEvent() {
  const req = new IncomingMessage(null as never)
  req.url = '/'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('fetchContributions', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns empty events when no token provided', async () => {
    const result = await fetchContributions()
    expect(result).toEqual({ events: [] })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends bearer auth header', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response)

    await fetchContributions('my-token')

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('bearer my-token')
  })

  it('expands contribution days into events', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [
                  { contributionDays: [{ date: '2025-01-01', contributionCount: 2 }] },
                  { contributionDays: [{ date: '2025-01-02', contributionCount: 1 }] },
                ],
              },
            },
          },
        },
      }),
    } as Response)

    const result = await fetchContributions('token')
    expect(result.events).toEqual([
      { date: '2025-01-01' },
      { date: '2025-01-01' },
      { date: '2025-01-02' },
    ])
  })

  it('returns empty events when weeks data is missing', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response)

    const result = await fetchContributions('token')
    expect(result).toEqual({ events: [] })
  })

  it('returns empty events on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))

    const result = await fetchContributions('token')
    expect(result).toEqual({ events: [] })
  })
})

describe('handler', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('passes GITHUB_TOKEN to fetchContributions', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'gh-token')
    vi.stubEnv('GH_TOKEN', '')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response)

    const { default: handler } = await import('../../server/api/contributions.get')
    await handler(makeEvent())

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('bearer gh-token')
  })

  it('falls back to GH_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', 'fallback-token')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response)

    const { default: handler } = await import('../../server/api/contributions.get')
    await handler(makeEvent())

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('bearer fallback-token')
  })
})
