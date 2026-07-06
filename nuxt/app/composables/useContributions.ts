interface GHEvent {
  created_at: string
}

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
  const { data: ghPage1 } = useFetch<GHEvent[]>(
    'https://api.github.com/users/Decipher/events/public?per_page=100&page=1',
    { server: false, lazy: true },
  )
  const { data: ghPage2 } = useFetch<GHEvent[]>(
    'https://api.github.com/users/Decipher/events/public?per_page=100&page=2',
    { server: false, lazy: true },
  )
  const { data: drupalComments } = useFetch<DrupalListResponse<DrupalComment>>(
    `https://www.drupal.org/api-d7/comment.json?author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
    { server: false, lazy: true },
  )
  const { data: drupalReleases } = useFetch<DrupalListResponse<DrupalRelease>>(
    `https://www.drupal.org/api-d7/node.json?type=project_release&author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
    { server: false, lazy: true },
  )

  const cells = computed<number[]>(() => {
    const hasData = ghPage1.value || ghPage2.value || drupalComments.value || drupalReleases.value
    if (!hasData) return []

    const events: { date: string }[] = []

    for (const event of [...(ghPage1.value ?? []), ...(ghPage2.value ?? [])]) {
      events.push({ date: event.created_at.slice(0, 10) })
    }
    for (const comment of drupalComments.value?.list ?? []) {
      events.push({ date: new Date(Number(comment.created) * 1000).toISOString().slice(0, 10) })
    }
    for (const release of drupalReleases.value?.list ?? []) {
      events.push({ date: new Date(Number(release.created) * 1000).toISOString().slice(0, 10) })
    }

    return buildCells(events, weeks)
  })

  return { cells }
}
