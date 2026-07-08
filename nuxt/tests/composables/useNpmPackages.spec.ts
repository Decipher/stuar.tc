import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNpmPackages, fetchNpmPackages, extractGithubRepo } from '~/composables/useNpmPackages'

const packageData = ref<unknown>(null)
const starsData = ref<Record<string, number> | null>(null)

mockNuxtImport('useAsyncData', () => (_key: string, _fn: () => Promise<unknown>) => ({
  data: packageData,
  refresh: vi.fn(),
}))

mockNuxtImport('useFetch', () => (_url: string, opts?: Record<string, unknown>) => {
  const q = opts?.query
  if (q !== null && typeof q === 'object' && 'value' in (q as object)) {
    void (q as { value: unknown }).value
  }
  return { data: starsData }
})

const makeObjects = (...names: string[]) =>
  names.map(name => ({ package: { name } }))

const makeObjectsWithRepo = (items: Array<{ name: string; repository?: string }>) =>
  items.map(({ name, repository }) => ({
    package: {
      name,
      ...(repository ? { links: { repository } } : {}),
    },
  }))

const makeDownloads = (entries: Record<string, number>) =>
  Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { downloads: v, package: k }]))

const makeData = (names: string[], downloads: Record<string, number>) => ({
  objects: makeObjects(...names),
  downloads: makeDownloads(downloads),
})

describe('extractGithubRepo', () => {
  it('returns null for undefined input', () => {
    expect(extractGithubRepo(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractGithubRepo('')).toBeNull()
  })

  it('returns null for non-github URL', () => {
    expect(extractGithubRepo('https://gitlab.com/foo/bar')).toBeNull()
  })

  it('returns null for github URL with only one path segment', () => {
    expect(extractGithubRepo('https://github.com/druxt')).toBeNull()
  })

  it('parses owner/repo from github URL', () => {
    expect(extractGithubRepo('https://github.com/druxt/druxt')).toBe('druxt/druxt')
  })

  it('strips .git suffix from repo name', () => {
    expect(extractGithubRepo('https://github.com/druxt/druxt.git')).toBe('druxt/druxt')
  })

  it('ignores extra path segments after owner/repo', () => {
    expect(extractGithubRepo('https://github.com/druxt/druxt/tree/main')).toBe('druxt/druxt')
  })
})

describe('useNpmPackages', () => {
  beforeEach(() => {
    packageData.value = null
    starsData.value = null
  })

  it('returns empty packages when data is null', () => {
    const { packages } = useNpmPackages()
    expect(packages.value).toEqual([])
  })

  it('returns empty packages when objects list is empty', () => {
    packageData.value = { objects: [], downloads: {} }
    const { packages } = useNpmPackages()
    expect(packages.value).toEqual([])
  })

  it('returns packages with correct structure', () => {
    const { packages } = useNpmPackages()
    packageData.value = makeData(
      ['druxt', 'druxt-router'],
      { druxt: 1000, 'druxt-router': 500 },
    )
    expect(packages.value).toHaveLength(2)
    expect(packages.value[0]).toMatchObject({
      name: 'druxt',
      machine: 'druxt',
      installs: '1,000/mo',
      percent: 100,
      href: 'https://www.npmjs.com/package/druxt',
      sortKey: 1000,
    })
  })

  it('sorts packages by downloads descending', () => {
    const { packages } = useNpmPackages()
    packageData.value = makeData(
      ['druxt-router', 'druxt'],
      { druxt: 1000, 'druxt-router': 500 },
    )
    expect(packages.value[0]?.name).toBe('druxt')
    expect(packages.value[1]?.name).toBe('druxt-router')
  })

  it('calculates percent relative to top package', () => {
    const { packages } = useNpmPackages()
    packageData.value = makeData(
      ['druxt', 'druxt-router'],
      { druxt: 1000, 'druxt-router': 500 },
    )
    expect(packages.value[0]?.percent).toBe(100)
    expect(packages.value[1]?.percent).toBe(50)
  })

  it('handles zero downloads without crashing', () => {
    const { packages } = useNpmPackages()
    packageData.value = makeData(['druxt'], { druxt: 0 })
    expect(packages.value[0]?.percent).toBe(0)
  })

  it('includes stars for packages whose GitHub repo has stars', () => {
    packageData.value = {
      objects: makeObjectsWithRepo([
        { name: 'druxt', repository: 'https://github.com/druxt/druxt' },
        { name: 'druxt-router' },
        { name: 'druxt-site', repository: 'https://github.com/druxt/druxt-site' },
      ]),
      downloads: makeDownloads({ druxt: 1000, 'druxt-router': 500, 'druxt-site': 200 }),
    }
    starsData.value = { 'druxt/druxt': 312 }

    const { packages } = useNpmPackages()
    expect(packages.value.find(p => p.name === 'druxt')?.stars).toBe('312')
    expect(packages.value.find(p => p.name === 'druxt-router')?.stars).toBeUndefined()
    expect(packages.value.find(p => p.name === 'druxt-site')?.stars).toBeUndefined()
  })
})

describe('useNpmPackages (edge cases)', () => {
  beforeEach(() => {
    packageData.value = null
    starsData.value = null
  })

  it('uses 0 for packages not in downloads response', () => {
    const { packages } = useNpmPackages()
    packageData.value = {
      objects: makeObjects('druxt', 'orphan'),
      downloads: makeDownloads({ druxt: 1000 }),
    }
    expect(packages.value.find(p => p.name === 'orphan')?.sortKey).toBe(0)
  })

  it('handles missing downloads field on data', () => {
    const { packages } = useNpmPackages()
    packageData.value = { objects: makeObjects('druxt') }
    expect(packages.value[0]?.installs).toBe('0/mo')
  })
})

describe('fetchNpmPackages', () => {
  it('returns empty data when search request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await fetchNpmPackages()
    expect(result).toEqual({ objects: [], downloads: {} })
    vi.unstubAllGlobals()
  })

  it('returns empty objects when search response has no objects field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    }))
    const result = await fetchNpmPackages()
    expect(result.objects).toEqual([])
    vi.unstubAllGlobals()
  })

  it('returns empty downloads when no non-scoped packages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ objects: [{ package: { name: '@scoped/pkg' } }] }),
    }))
    const result = await fetchNpmPackages()
    expect(result.downloads).toEqual({})
    vi.unstubAllGlobals()
  })

  it('fetches downloads for non-scoped packages', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ objects: [{ package: { name: 'druxt' } }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ druxt: { downloads: 1000, package: 'druxt' } }),
      }),
    )
    const result = await fetchNpmPackages()
    expect(result.downloads).toEqual({ druxt: { downloads: 1000, package: 'druxt' } })
    vi.unstubAllGlobals()
  })

  it('returns empty downloads when downloads request fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ objects: [{ package: { name: 'druxt' } }] }),
      })
      .mockResolvedValueOnce({ ok: false }),
    )
    const result = await fetchNpmPackages()
    expect(result.downloads).toEqual({})
    vi.unstubAllGlobals()
  })
})
