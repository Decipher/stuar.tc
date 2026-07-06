import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useCoMaintainedModules } from '~/composables/useCoMaintainedModules'
import { coMaintainedMachineNames } from '~/data/co-maintained'

const fetchDataMap = ref<Record<string, unknown>>({})

mockNuxtImport('useFetch', () => {
  return (url: string) => {
    const match = Object.keys(fetchDataMap.value).find(k => url.includes(k))
    const data = ref(match ? fetchDataMap.value[match] : null)
    return { data }
  }
})

const makeDrupalNode = (machine: string, title: string, installs: number) => ({
  title,
  field_project_machine_name: machine,
  project_usage: { '10.x': installs },
})

describe('coMaintainedMachineNames', () => {
  it('contains the expected co-maintained modules', () => {
    expect(coMaintainedMachineNames).toContain('decoupled_router')
    expect(coMaintainedMachineNames).toContain('hacked')
    expect(coMaintainedMachineNames).toContain('jsonapi_views')
    expect(coMaintainedMachineNames).toContain('entity_legal')
    expect(coMaintainedMachineNames).toContain('jsonapi_node_preview_tab')
  })
})

describe('useCoMaintainedModules', () => {
  beforeEach(() => {
    fetchDataMap.value = {}
  })

  it('returns empty modules when no data has loaded', () => {
    const { modules } = useCoMaintainedModules()
    expect(modules.value).toEqual([])
  })

  it('returns modules when data is available for one machine name', () => {
    fetchDataMap.value = {
      'jsonapi_views': { list: [makeDrupalNode('jsonapi_views', 'JSON:API Views', 2007)] },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value).toHaveLength(1)
    expect(modules.value[0]!.name).toBe('JSON:API Views')
    expect(modules.value[0]!.machine).toBe('jsonapi_views')
    expect(modules.value[0]!.installs).toBe('2,007')
    expect(modules.value[0]!.percent).toBe(100)
    expect(modules.value[0]!.sortKey).toBe(2007)
  })

  it('sorts modules by install count descending', () => {
    fetchDataMap.value = {
      'jsonapi_views': { list: [makeDrupalNode('jsonapi_views', 'JSON:API Views', 2007)] },
      'decoupled_router': { list: [makeDrupalNode('decoupled_router', 'Decoupled Router', 8773)] },
      'hacked': { list: [makeDrupalNode('hacked', 'Hacked!', 5686)] },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value[0]!.machine).toBe('decoupled_router')
    expect(modules.value[1]!.machine).toBe('hacked')
    expect(modules.value[2]!.machine).toBe('jsonapi_views')
  })

  it('sets top module percent to 100, others proportional', () => {
    fetchDataMap.value = {
      'decoupled_router': { list: [makeDrupalNode('decoupled_router', 'Decoupled Router', 8000)] },
      'hacked': { list: [makeDrupalNode('hacked', 'Hacked!', 4000)] },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value[0]!.percent).toBe(100)
    expect(modules.value[1]!.percent).toBe(50)
  })

  it('filters out nodes with machine names not in the curated list', () => {
    fetchDataMap.value = {
      'jsonapi_views': {
        list: [
          makeDrupalNode('jsonapi_views', 'JSON:API Views', 2007),
          makeDrupalNode('some_other_module', 'Some Other Module', 999),
        ],
      },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value).toHaveLength(1)
    expect(modules.value[0]!.machine).toBe('jsonapi_views')
  })

  it('handles empty list response from API', () => {
    fetchDataMap.value = {
      'jsonapi_views': { list: [] },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value).toEqual([])
  })

  it('handles zero-usage modules with percent 0', () => {
    fetchDataMap.value = {
      'jsonapi_node_preview_tab': { list: [makeDrupalNode('jsonapi_node_preview_tab', 'JSON:API Node Preview Tab', 0)] },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value[0]!.percent).toBe(0)
  })

  it('handles missing project_usage gracefully', () => {
    fetchDataMap.value = {
      'jsonapi_views': {
        list: [{ title: 'JSON:API Views', field_project_machine_name: 'jsonapi_views', project_usage: undefined as Record<string, number | string> }],
      },
    }
    const { modules } = useCoMaintainedModules()
    expect(modules.value[0]!.installs).toBe('0')
  })
})
