import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNpmPackages } from '~/composables/useNpmPackages'

const packageData = ref<unknown>(null)

mockNuxtImport('useAsyncData', () => (_key: string, _fn: () => Promise<unknown>) => ({
  data: packageData,
  refresh: vi.fn(),
}))

const makeObjects = (...names: string[]) =>
  names.map(name => ({ package: { name } }))

const makeDownloads = (entries: Record<string, number>) =>
  Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { downloads: v, package: k }]))

const makeData = (names: string[], downloads: Record<string, number>) => ({
  objects: makeObjects(...names),
  downloads: makeDownloads(downloads),
})

describe('useNpmPackages', () => {
  beforeEach(() => {
    packageData.value = null
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

  it('sorts packages by download count descending', () => {
    packageData.value = makeData(
      ['druxt', 'druxt-router', 'druxt-menu'],
      { druxt: 2968, 'druxt-router': 2150, 'druxt-menu': 814 },
    )
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.machine).toBe('druxt')
    expect(packages.value[1]!.machine).toBe('druxt-router')
    expect(packages.value[2]!.machine).toBe('druxt-menu')
  })

  it('sets top package percent to 100', () => {
    packageData.value = makeData(
      ['druxt', 'druxt-router'],
      { druxt: 3000, 'druxt-router': 1500 },
    )
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.percent).toBe(100)
    expect(packages.value[1]!.percent).toBe(50)
  })

  it('formats installs as monthly count with /mo suffix', () => {
    packageData.value = makeData(['druxt'], { druxt: 2968 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.installs).toBe('2,968/mo')
  })

  it('shows 0/mo for packages with zero downloads', () => {
    packageData.value = makeData(['druxt', 'new-package'], { druxt: 100, 'new-package': 0 })
    const { packages } = useNpmPackages()
    const newPkg = packages.value.find(p => p.machine === 'new-package')
    expect(newPkg?.installs).toBe('0/mo')
    expect(newPkg?.percent).toBe(0)
  })

  it('links to npmjs.com package page', () => {
    packageData.value = makeData(['druxt'], { druxt: 100 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.href).toBe('https://www.npmjs.com/package/druxt')
  })

  it('sets sortKey to raw monthly download count', () => {
    packageData.value = makeData(['druxt'], { druxt: 2968 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.sortKey).toBe(2968)
  })

  it('sets sortKey to 0 for packages with no downloads', () => {
    packageData.value = makeData(['new-package'], { 'new-package': 0 })
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.sortKey).toBe(0)
  })

  it('handles packages missing from downloads map', () => {
    packageData.value = { objects: makeObjects('druxt'), downloads: {} }
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.installs).toBe('0/mo')
  })

  it('encodes scoped package names in href', () => {
    packageData.value = {
      objects: makeObjects('@druxt-contrib/config-pages'),
      downloads: makeDownloads({ '@druxt-contrib/config-pages': 50 }),
    }
    const { packages } = useNpmPackages()
    expect(packages.value[0]!.href).toBe('https://www.npmjs.com/package/%40druxt-contrib%2Fconfig-pages')
  })

  it('scoped packages with no download entry show 0/mo', () => {
    packageData.value = {
      objects: makeObjects('druxt', '@druxt-contrib/config-pages', 'druxt-router'),
      downloads: makeDownloads({ druxt: 1000, 'druxt-router': 500 }),
    }
    const { packages } = useNpmPackages()
    const scoped = packages.value.find(p => p.machine === '@druxt-contrib/config-pages')
    expect(scoped).toBeDefined()
    expect(scoped!.installs).toBe('0/mo')
    expect(scoped!.sortKey).toBe(0)
  })
})
