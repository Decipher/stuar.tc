interface DrupalComment {
  created: string
}

interface DrupalRelease {
  created: string
}

interface DrupalListResponse<T> {
  list: T[]
}

const DRUPAL_UID = 103796

export function countToLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  return 3
}

export function buildCells(events: { date: string }[], weeks: number): number[] {
  const totalDays = weeks * 7
  const counts = new Map<string, number>()
  for (const { date } of events) {
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }

  const cells: number[] = []
  const now = new Date()
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    cells.push(countToLevel(counts.get(key) ?? 0))
  }
  return cells
}

export function useContributions(weeks: number = 18) {
  const { data: ghContributions } = useFetch<{ events: { date: string }[] }>(
    '/api/contributions',
  )
  const { data: drupalComments, refresh: refreshComments } = useFetch<DrupalListResponse<DrupalComment>>(
    `https://www.drupal.org/api-d7/comment.json?author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
  )
  const { data: drupalReleases, refresh: refreshReleases } = useFetch<DrupalListResponse<DrupalRelease>>(
    `https://www.drupal.org/api-d7/node.json?type=project_release&author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
  )
  onMounted(() => { refreshComments(); refreshReleases() })

  const cells = computed<number[]>(() => {
    const hasData = ghContributions.value || drupalComments.value || drupalReleases.value
    if (!hasData) return []

    const events: { date: string }[] = [
      ...(ghContributions.value?.events ?? []),
      ...(drupalComments.value?.list ?? []).map(c => ({
        date: new Date(Number(c.created) * 1000).toISOString().slice(0, 10),
      })),
      ...(drupalReleases.value?.list ?? []).map(r => ({
        date: new Date(Number(r.created) * 1000).toISOString().slice(0, 10),
      })),
    ]

    return buildCells(events, weeks)
  })

  return { cells }
}
