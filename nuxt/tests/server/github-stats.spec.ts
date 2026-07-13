import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { fetchGitHubStats } from '../../server/api/github-stats.get'

function makeEvent() {
  const req = new IncomingMessage(null as never)
  req.url = '/'
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

function okJson(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data) } as Response
}

describe('fetchGitHubStats', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns zero counts when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    const result = await fetchGitHubStats()
    expect(result).toEqual({ repos: 0, stars: 0 })
  })

  it('returns zero counts for non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    const result = await fetchGitHubStats()
    expect(result).toEqual({ repos: 0, stars: 0 })
  })

  it('counts repos and sums stars from a single page', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(okJson([
        { stargazers_count: 100 },
        { stargazers_count: 50 },
        {},
      ]))
      .mockResolvedValue(okJson([]))

    const result = await fetchGitHubStats()
    expect(result.repos).toBe(3)
    expect(result.stars).toBe(150)
  })

  it('paginates when a full page is returned', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({ stargazers_count: i }))
    vi.mocked(fetch)
      .mockResolvedValueOnce(okJson(fullPage))
      .mockResolvedValueOnce(okJson([{ stargazers_count: 5 }]))
      .mockResolvedValue(okJson([]))

    const result = await fetchGitHubStats()
    expect(result.repos).toBe(101)
  })

  it('stops after an empty second page', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({ stargazers_count: i }))
    vi.mocked(fetch)
      .mockResolvedValueOnce(okJson(fullPage))
      .mockResolvedValue(okJson([]))

    const result = await fetchGitHubStats()
    expect(result.repos).toBe(100)
  })

  it('fetches from Decipher user, druxt org, and druxt-contrib org', async () => {
    vi.mocked(fetch).mockResolvedValue(okJson([]))
    await fetchGitHubStats()
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => url as string)
    expect(urls.some(u => u.includes('/users/Decipher/'))).toBe(true)
    expect(urls.some(u => u.includes('/orgs/druxt/'))).toBe(true)
    expect(urls.some(u => u.includes('/orgs/druxt-contrib/'))).toBe(true)
  })

  it('sends Authorization header when token provided', async () => {
    vi.mocked(fetch).mockResolvedValue(okJson([]))

    await fetchGitHubStats('my-token')
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer my-token')
  })

  it('omits Authorization header when no token', async () => {
    vi.mocked(fetch).mockResolvedValue(okJson([]))

    await fetchGitHubStats()
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers).not.toHaveProperty('Authorization')
  })
})

describe('handler', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('passes GITHUB_TOKEN to fetchGitHubStats', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'gh-token')
    vi.stubEnv('GH_TOKEN', '')
    vi.mocked(fetch).mockResolvedValue(okJson([]))

    const { default: handler } = await import('../../server/api/github-stats.get')
    await handler(makeEvent())

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer gh-token')
  })

  it('falls back to GH_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', 'fallback-token')
    vi.mocked(fetch).mockResolvedValue(okJson([]))

    const { default: handler } = await import('../../server/api/github-stats.get')
    await handler(makeEvent())

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer fallback-token')
  })
})
