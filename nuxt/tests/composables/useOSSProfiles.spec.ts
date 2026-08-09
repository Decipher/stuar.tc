import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useOSSProfiles } from '~/composables/useOSSProfiles'

const totalCountData = ref(0)
const totalDrupalStarsData = ref(0)
const npmPackagesData = ref<Array<unknown>>([])
const ghData = ref<{ repos: number; stars: number } | null>(null)

const refreshModulesSpy = vi.fn()
const refreshNpmSpy = vi.fn()
const refreshGHSpy = vi.fn()

mockNuxtImport('useModules', () => () => ({
  modules: ref([]),
  totalCount: totalCountData,
  totalDrupalStars: totalDrupalStarsData,
  refreshLive: refreshModulesSpy,
}))

mockNuxtImport('useNpmPackages', () => () => ({ packages: npmPackagesData, refreshLive: refreshNpmSpy }))

mockNuxtImport('useFetch', () => () => ({ data: ghData, refresh: refreshGHSpy }))

describe('useOSSProfiles', () => {
  beforeEach(() => {
    totalCountData.value = 0
    totalDrupalStarsData.value = 0
    npmPackagesData.value = []
    ghData.value = null
    refreshModulesSpy.mockClear()
    refreshNpmSpy.mockClear()
    refreshGHSpy.mockClear()
  })

  describe('githubStat', () => {
    it('returns null when GitHub data is not loaded', () => {
      const { githubStat } = useOSSProfiles()
      expect(githubStat.value).toBeNull()
    })

    it('formats repos and stars when loaded', () => {
      ghData.value = { repos: 40, stars: 480 }
      const { githubStat } = useOSSProfiles()
      expect(githubStat.value).toBe('40 repos · 480 ★')
    })

    it('abbreviates star counts over 1000', () => {
      ghData.value = { repos: 40, stars: 3800 }
      const { githubStat } = useOSSProfiles()
      expect(githubStat.value).toBe('40 repos · 3.8k ★')
    })
  })

  describe('drupalStat', () => {
    it('returns null when module count is zero', () => {
      const { drupalStat } = useOSSProfiles()
      expect(drupalStat.value).toBeNull()
    })

    it('formats module count without stars when stars are zero', () => {
      totalCountData.value = 170
      totalDrupalStarsData.value = 0
      const { drupalStat } = useOSSProfiles()
      expect(drupalStat.value).toBe('170 modules')
    })

    it('formats module count with stars when available', () => {
      totalCountData.value = 170
      totalDrupalStarsData.value = 3800
      const { drupalStat } = useOSSProfiles()
      expect(drupalStat.value).toBe('170 modules · 3.8k ★')
    })
  })

  describe('npmStat', () => {
    it('returns null when packages list is empty', () => {
      const { npmStat } = useOSSProfiles()
      expect(npmStat.value).toBeNull()
    })

    it('formats package count', () => {
      npmPackagesData.value = Array.from({ length: 25 }, (_, i) => ({ name: `pkg-${i}` }))
      const { npmStat } = useOSSProfiles()
      expect(npmStat.value).toBe('25 packages')
    })
  })

  describe('refreshLive', () => {
    it('triggers all sub-composable refreshes', () => {
      const { refreshLive } = useOSSProfiles()
      refreshLive()
      expect(refreshModulesSpy).toHaveBeenCalledTimes(1)
      expect(refreshNpmSpy).toHaveBeenCalledTimes(1)
      expect(refreshGHSpy).toHaveBeenCalledTimes(1)
    })
  })
})
