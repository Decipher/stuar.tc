import type { Module } from '~/data/modules'

interface DrupalModule {
  title: string
  field_project_machine_name: string
  project_usage: Record<string, number | string>
  flag_project_star_user?: Array<unknown> | Record<string, unknown>
}

interface DrupalModuleResponse {
  list: DrupalModule[]
}

// drupal.org project nodes are full entities (body, taxonomy, images, etc.
// — dozens of unused fields). Trim to what's actually rendered so it
// doesn't bloat the prerendered SSR payload.
export function transformDrupalModules(res: DrupalModuleResponse): DrupalModuleResponse {
  return {
    list: res.list.map(m => ({
      title: m.title,
      field_project_machine_name: m.field_project_machine_name,
      project_usage: m.project_usage,
      flag_project_star_user: m.flag_project_star_user,
    })),
  }
}

const DRUPAL_UID = 103796

export function sumUsage(usage: Record<string, number | string>): number {
  return Object.values(usage).reduce<number>(
    (acc, v) => acc + (typeof v === 'number' ? v : parseInt(String(v), 10) || 0),
    0,
  )
}

export function countDrupalStars(flag: Array<unknown> | Record<string, unknown> | undefined): number {
  if (!flag) return 0
  return Array.isArray(flag) ? flag.length : Object.keys(flag).length
}

export function rankModules(list: DrupalModule[]): Module[] {
  if (list.length === 0) return []

  const ranked = list
    .map(n => ({
      name: n.title,
      machine: n.field_project_machine_name,
      total: sumUsage(n.project_usage ?? {}),
      stars: countDrupalStars(n.flag_project_star_user),
    }))
    .sort((a, b) => b.total - a.total)

  const max = ranked[0]!.total || 1
  return ranked.map(m => ({
    name: m.name,
    machine: m.machine,
    installs: m.total.toLocaleString(),
    percent: Math.round((m.total / max) * 100),
    sortKey: m.total,
    stars: m.stars > 0 ? String(m.stars) : undefined,
  }))
}

export function useModules() {
  const { data: page1, refresh: refreshPage1 } = useFetch<DrupalModuleResponse>(
    `https://www.drupal.org/api-d7/node.json?type=project_module&author=${DRUPAL_UID}&field_project_type=full&limit=20&page=0`,
    { transform: transformDrupalModules },
  )
  const { data: page2, refresh: refreshPage2 } = useFetch<DrupalModuleResponse>(
    `https://www.drupal.org/api-d7/node.json?type=project_module&author=${DRUPAL_UID}&field_project_type=full&limit=20&page=1`,
    { transform: transformDrupalModules },
  )
  onMounted(() => { refreshPage1(); refreshPage2() })

  const modules = computed<Module[]>(() => {
    const all = [...(page1.value?.list ?? []), ...(page2.value?.list ?? [])]
    return rankModules(all)
  })

  const totalCount = computed(() => {
    return (page1.value?.list.length ?? 0) + (page2.value?.list.length ?? 0)
  })

  const totalDrupalStars = computed(() => {
    const all = [...(page1.value?.list ?? []), ...(page2.value?.list ?? [])]
    return all.reduce((sum, m) => sum + countDrupalStars(m.flag_project_star_user), 0)
  })

  return { modules, totalCount, totalDrupalStars }
}
