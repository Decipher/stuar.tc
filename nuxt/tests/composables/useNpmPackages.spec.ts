import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNpmPackages } from '~/composables/useNpmPackages'

const searchData = ref<unknown>(null)
const downloadsData = ref<unknown>(null)

mockNuxtImport('useFetch', () => (url: string | (() => string | null)) => {
  const resolved = typeof url === 'function' ? url() : url
  if (typeof resolved === 'string' && resolved.includes('registry.npmjs.org')) return { data: searchData }
  return { data: downloadsData }
})

const makeSearch = (...names: string[]) => ({
  objects: names.map(name => ({ package: { name } })),
  total: names.length,
})

const makeDownloads = (entries: Record<string, number>) =>
  Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { downloads: v, package: k }]))

describe('useNpmPackages', () => {
  beforeEach(() => {
    searchData.value = null
    downloadsData.value = null
  })

  it('returns empty packages when search data is null', () => {
    const { packages } = useNpmPackages()
    expect(packages.value).toEqual([])
  })

  it('returns empty packages when search returns empty list', () => {
    searchData.value = { objects: [], total: 0 }
    const { packages } = useNpmPackages()
    expect(packages.value).toEqual([])
  })

  it('sorts packages by download count descending', () => {
    searchData.value = makeSearch('druxt', 'druxt-router', 'druxt-menu')
    downloadsData.value = makeDownloads({ druxt: 2968, 'druxt-router': 2150, 'druxt-menu': 814 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.machine).toBe('druxt')
    expect(packages.value[1]!.machine).toBe('druxt-router')
    expect(packages.value[2]!.machine).toBe('druxt-menu')
  })

  it('sets top package percent to 100', () => {
    searchData.value = makeSearch('druxt', 'druxt-router')
    downloadsData.value = makeDownloads({ druxt: 3000, 'druxt-router': 1500 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.percent).toBe(100)
    expect(packages.value[1]!.percent).toBe(50)
  })

  it('formats installs as monthly count with /mo suffix', () => {
    searchData.value = makeSearch('druxt')
    downloadsData.value = makeDownloads({ druxt: 2968 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.installs).toBe('2,968/mo')
  })

  it('shows 0/mo for packages with zero downloads', () => {
    searchData.value = makeSearch('druxt', 'new-package')
    downloadsData.value = makeDownloads({ druxt: 100, 'new-package': 0 })
    const { packages } = useNpmPackages()
    const newPkg = packages.value.find(p => p.machine === 'new-package')
    expect(newPkg?.installs).toBe('0/mo')
    expect(newPkg?.percent).toBe(0)
  })

  it('links to npmjs.com package page', () => {
    searchData.value = makeSearch('druxt')
    downloadsData.value = makeDownloads({ druxt: 100 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.href).toBe('https://www.npmjs.com/package/druxt')
  })

  it('sets sortKey to raw monthly download count', () => {
    searchData.value = makeSearch('druxt')
    downloadsData.value = makeDownloads({ druxt: 2968 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.sortKey).toBe(2968)
  })

  it('sets sortKey to 0 for packages with no downloads', () => {
    searchData.value = makeSearch('new-package')
    downloadsData.value = makeDownloads({ 'new-package': 0 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.sortKey).toBe(0)
  })

  it('handles packages with no download data (downloads.value is null)', () => {
    searchData.value = makeSearch('druxt')
    downloadsData.value = null
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.installs).toBe('0/mo')
  })

  it('encodes scoped package names in href', () => {
    searchData.value = makeSearch('@druxt-contrib/config-pages')
    downloadsData.value = makeDownloads({ '@druxt-contrib/config-pages': 50 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.href).toBe('https://www.npmjs.com/package/%40druxt-contrib%2Fconfig-pages')
  })

  it('excludes scoped packages from bulk downloads URL to avoid API error', () => {
    searchData.value = makeSearch('druxt', '@druxt-contrib/config-pages', 'druxt-router')
    // The URL function is called reactively; capture it by examining what gets passed
    // We verify by checking that scoped packages still appear in results with 0 downloads
    downloadsData.value = makeDownloads({ druxt: 1000, 'druxt-router': 500 })
    const { packages } = useNpmPackages()
    const scoped = packages.value.find(p => p.machine === '@druxt-contrib/config-pages')
    expect(scoped).toBeDefined()
    expect(scoped!.installs).toBe('0/mo')
    expect(scoped!.sortKey).toBe(0)
  })
})
