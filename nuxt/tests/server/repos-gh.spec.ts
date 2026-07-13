import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { parseReposQuery, fetchRepoStars } from '../../server/api/repos-gh.get'

function makeEvent(url = '/') {
  const req = new IncomingMessage(null as never)
  req.url = url
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('parseReposQuery', () => {
  it('returns empty array when repos param is absent', () => {
    expect(parseReposQuery({})).toEqual([])
  })

  it('returns empty array for empty repos string', () => {
    expect(parseReposQuery({ repos: '' })).toEqual([])
  })

  it('parses comma-separated repos', () => {
    expect(parseReposQuery({ repos: 'druxt/druxt,druxt/druxt-router' })).toEqual([
      'druxt/druxt',
      'druxt/druxt-router',
    ])
  })

  it('filters empty entries from comma-separated string', () => {
    expect(parseReposQuery({ repos: 'druxt/druxt,,druxt/druxt-router' })).toEqual([
      'druxt/druxt',
      'druxt/druxt-router',
    ])
  })
})

describe('fetchRepoStars', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns empty object for empty repos list', async () => {
    expect(await fetchRepoStars([])).toEqual({})
  })

  it('returns star counts for repos', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stargazers_count: 312 }),
    } as Response)

    const result = await fetchRepoStars(['druxt/druxt'])
    expect(result).toEqual({ 'druxt/druxt': 312 })
  })

  it('sends Authorization header when token provided', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stargazers_count: 0 }),
    } as Response)

    await fetchRepoStars(['druxt/druxt'], 'my-token')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('druxt/druxt'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer my-token' }) }),
    )
  })

  it('omits Authorization header when no token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stargazers_count: 0 }),
    } as Response)

    await fetchRepoStars(['druxt/druxt'])
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers).not.toHaveProperty('Authorization')
  })

  it('returns 0 for repos that return non-ok responses', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    const result = await fetchRepoStars(['druxt/druxt'])
    expect(result).toEqual({ 'druxt/druxt': 0 })
  })

  it('returns 0 for repos that throw errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    const result = await fetchRepoStars(['druxt/druxt'])
    expect(result).toEqual({ 'druxt/druxt': 0 })
  })
})

describe('handler', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('passes GITHUB_TOKEN to fetchRepoStars', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'gh-token')
    vi.stubEnv('GH_TOKEN', '')

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stargazers_count: 42 }),
    } as Response)

    const { default: handler } = await import('../../server/api/repos-gh.get')
    const event = makeEvent('/?repos=druxt/druxt')
    await handler(event)

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer gh-token')
  })

  it('falls back to GH_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', 'fallback-token')

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stargazers_count: 0 }),
    } as Response)

    const { default: handler } = await import('../../server/api/repos-gh.get')
    const event = makeEvent('/?repos=druxt/druxt')
    await handler(event)

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers?.Authorization).toBe('Bearer fallback-token')
  })
})
