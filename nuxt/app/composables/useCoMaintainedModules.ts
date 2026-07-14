import type { Module } from '~/data/modules'
import { coMaintainedMachineNames } from '~/data/co-maintained'
import { sumUsage } from '~/composables/useModules'

interface DrupalModule {
  title: string
  field_project_machine_name: string
  project_usage: Record<string, number | string>
}

interface DrupalModuleResponse {
  list: DrupalModule[]
}

// drupal.org project nodes are full entities (body, taxonomy, images, etc.
// — dozens of unused fields). Trim to what's actually rendered so it
// doesn't bloat the prerendered SSR payload.
function transformDrupalModules(res: DrupalModuleResponse): DrupalModuleResponse {
  return {
    list: res.list.map(m => ({
      title: m.title,
      field_project_machine_name: m.field_project_machine_name,
      project_usage: m.project_usage,
    })),
  }
}

export function useCoMaintainedModules() {
  const fetches = coMaintainedMachineNames.map(machine =>
    useFetch<DrupalModuleResponse>(
      `https://www.drupal.org/api-d7/node.json?type=project_module&field_project_machine_name=${machine}`,
      { transform: transformDrupalModules },
    ),
  )
  onMounted(() => fetches.forEach(f => f.refresh()))

  const modules = computed<Module[]>(() => {
    const nodes = fetches
      .flatMap(f => f.data.value?.list ?? [])
      .filter(n => coMaintainedMachineNames.includes(n.field_project_machine_name as typeof coMaintainedMachineNames[number]))

    if (nodes.length === 0) return []

    const ranked = nodes
      .map(n => ({ name: n.title, machine: n.field_project_machine_name, total: sumUsage(n.project_usage ?? {}) }))
      .sort((a, b) => b.total - a.total)

    const max = ranked[0]!.total || 1
    return ranked.map(m => ({
      name: m.name,
      machine: m.machine,
      installs: m.total.toLocaleString(),
      percent: Math.round((m.total / max) * 100),
      sortKey: m.total,
    }))
  })

  return { modules }
}
