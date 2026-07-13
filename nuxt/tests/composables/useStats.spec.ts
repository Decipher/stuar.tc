import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Module } from '~/data/modules'
import { stats as staticStats } from '~/data/stats'

const modulesData = ref<Module[]>([])
mockNuxtImport('useModules', () => () => ({ modules: modulesData }))

describe('useStats', () => {
  beforeEach(() => { modulesData.value = [] })

  it('returns static stats when no modules loaded', async () => {
    const { useStats } = await import('~/composables/useStats')
    const { stats } = useStats()
    expect(stats.value).toEqual(staticStats)
  })

  it('updates filefield_paths install count with live data', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '55,000', percent: 100 },
    ]
    const { useStats } = await import('~/composables/useStats')
    const { stats } = useStats()
    const ffpStat = stats.value.find(s => s.label === 'sites run File (Field) Paths')
    expect(ffpStat?.value).toBe('55,000')
  })

  it('does not modify unrelated stats when modules are loaded', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '55,000', percent: 100 },
    ]
    const { useStats } = await import('~/composables/useStats')
    const { stats } = useStats()
    const yearsStat = stats.value.find(s => s.label === 'years building for the web')
    expect(yearsStat?.value).toBe('24+')
  })

  it('returns the File (Field) Paths install count from static fallback', async () => {
    const { useStats } = await import('~/composables/useStats')
    const { ffpSites } = useStats()
    expect(ffpSites.value).toBe('29,589')
  })

  it('returns live File (Field) Paths install count when available', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '55,000', percent: 100 },
    ]
    const { useStats } = await import('~/composables/useStats')
    const { ffpSites } = useStats()
    expect(ffpSites.value).toBe('55,000')
  })
})
