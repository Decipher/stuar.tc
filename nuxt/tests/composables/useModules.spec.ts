import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { sumUsage, rankModules, useModules } from '~/composables/useModules'

// --- sumUsage ---

describe('sumUsage', () => {
  it('sums numeric values', () => {
    expect(sumUsage({ '7.x-1.x': 100, '8.x-1.x': 200 })).toBe(300)
  })
  it('parses string values', () => {
    expect(sumUsage({ '6.x-1.x': '50', '7.x-1.x': 100 })).toBe(150)
  })
  it('ignores unparseable strings', () => {
    expect(sumUsage({ '6.x': 'none' })).toBe(0)
  })
  it('returns 0 for empty object', () => {
    expect(sumUsage({})).toBe(0)
  })
})

// --- rankModules ---

const makeModule = (title: string, machine: string, usage: Record<string, number>) => ({
  title,
  field_project_machine_name: machine,
  project_usage: usage,
})

describe('rankModules', () => {
  it('returns empty array for empty input', () => {
    expect(rankModules([])).toEqual([])
  })

  it('sorts by total usage descending', () => {
    const list = [
      makeModule('Beta', 'beta', { '8.x': 100 }),
      makeModule('Alpha', 'alpha', { '8.x': 500 }),
    ]
    const result = rankModules(list)
    expect(result[0]!.name).toBe('Alpha')
    expect(result[0]!.percent).toBe(100)
    expect(result[1]!.percent).toBe(20)
  })

  it('includes sortKey equal to raw total installs', () => {
    const list = [makeModule('Alpha', 'alpha', { '8.x': 500, '7.x': 200 })]
    const result = rankModules(list)
    expect(result[0]!.sortKey).toBe(700)
  })

  it('returns all results sorted by usage (no hard cap)', () => {
    const list = Array.from({ length: 10 }, (_, i) =>
      makeModule(`Mod ${i}`, `mod_${i}`, { '8.x': 100 - i }),
    )
    const result = rankModules(list)
    expect(result).toHaveLength(10)
    expect(result[0]!.name).toBe('Mod 0')
    expect(result[9]!.name).toBe('Mod 9')
  })

  it('formats installs as locale string', () => {
    const list = [makeModule('Big Module', 'big_module', { '8.x': 30463 })]
    const result = rankModules(list)
    expect(result[0]!.installs).toBe('30,463')
  })
  it('handles missing project_usage gracefully', () => {
    const list = [{ title: 'No Usage', field_project_machine_name: 'no_usage', project_usage: undefined as Record<string, number | string> }]
    const result = rankModules(list)
    expect(result[0]!.installs).toBe('0')
  })
  it('handles all-zero usage (percent fallback to 1)', () => {
    const list = [makeModule('Zero Module', 'zero_mod', {})]
    const result = rankModules(list)
    expect(result[0]!.percent).toBe(0)
  })
})

// --- useModules ---

const page1Data = ref<unknown>(null)
const page2Data = ref<unknown>(null)

mockNuxtImport('useFetch', () => {
  return (url: string) => {
    if (url.includes('page=1')) return { data: page2Data }
    return { data: page1Data }
  }
})

describe('useModules', () => {
  beforeEach(() => {
    page1Data.value = null
    page2Data.value = null
  })

  it('returns empty modules when data is null', () => {
    const { modules } = useModules()
    expect(modules.value).toEqual([])
  })

  it('returns ranked modules when data is available', () => {
    page1Data.value = {
      list: [
        makeModule('File (Field) Paths', 'filefield_paths', { '8.x-1.x': 30463 }),
        makeModule('Custom Formatters', 'custom_formatters', { '7.x-2.x': 3116 }),
      ],
    }
    const { modules } = useModules()
    expect(modules.value).toHaveLength(2)
    expect(modules.value[0]!.name).toBe('File (Field) Paths')
    expect(modules.value[0]!.percent).toBe(100)
  })

  it('merges page1 and page2 results', () => {
    page1Data.value = {
      list: [makeModule('Module A', 'mod_a', { '8.x': 1000 })],
    }
    page2Data.value = {
      list: [makeModule('Module B', 'mod_b', { '8.x': 500 })],
    }
    const { modules } = useModules()
    expect(modules.value).toHaveLength(2)
    expect(modules.value[0]!.machine).toBe('mod_a')
  })

  it('totalCount reflects the number of fetched modules', () => {
    page1Data.value = {
      list: [makeModule('Module A', 'mod_a', { '8.x': 1000 }), makeModule('Module B', 'mod_b', { '8.x': 500 })],
    }
    page2Data.value = {
      list: [makeModule('Module C', 'mod_c', { '8.x': 200 })],
    }
    const { totalCount } = useModules()
    expect(totalCount.value).toBe(3)
  })

  it('totalCount is 0 when no data loaded', () => {
    const { totalCount } = useModules()
    expect(totalCount.value).toBe(0)
  })
})
