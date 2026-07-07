import type { Module } from '~/data/modules'

interface DrupalModule {
  title: string
  field_project_machine_name: string
  project_usage: Record<string, number | string>
}

interface DrupalModuleResponse {
  list: DrupalModule[]
}

const DRUPAL_UID = 103796

export function sumUsage(usage: Record<string, number | string>): number {
  return Object.values(usage).reduce<number>(
    (acc, v) => acc + (typeof v === 'number' ? v : parseInt(String(v), 10) || 0),
    0,
  )
}

export function rankModules(list: DrupalModule[]): Module[] {
  if (list.length === 0) return []

  const ranked = list
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
}

export function useModules() {
  const { data: page1, refresh: refreshPage1 } = useFetch<DrupalModuleResponse>(
    `https://www.drupal.org/api-d7/node.json?type=project_module&author=${DRUPAL_UID}&field_project_type=full&limit=20&page=0`,
  )
  const { data: page2, refresh: refreshPage2 } = useFetch<DrupalModuleResponse>(
    `https://www.drupal.org/api-d7/node.json?type=project_module&author=${DRUPAL_UID}&field_project_type=full&limit=20&page=1`,
  )
  onMounted(() => { refreshPage1(); refreshPage2() })

  const modules = computed<Module[]>(() => {
    const all = [...(page1.value?.list ?? []), ...(page2.value?.list ?? [])]
    return rankModules(all)
  })

  const totalCount = computed(() => {
    return (page1.value?.list.length ?? 0) + (page2.value?.list.length ?? 0)
  })

  return { modules, totalCount }
}
