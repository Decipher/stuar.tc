import type { Activity } from '~/data/activity'

interface GHEvent {
  type: string
  repo: { name: string }
  created_at: string
  payload: {
    size?: number
    commits?: unknown[]
    ref?: string
    ref_type?: string
    action?: string
    release?: { tag_name: string }
    pull_request?: { number: number }
    issue?: { number: number }
  }
}

interface DrupalComment {
  created: string
  url: string
}

interface DrupalRelease {
  created: string
  title: string
}

interface DrupalMR {
  created_at: string
  state: string
  web_url: string
  title: string
}

interface DrupalListResponse<T> {
  list: T[]
}

export function formatAge(input: string | number): string {
  const ms = typeof input === 'number' ? input * 1000 : new Date(input).getTime()
  const diff = Date.now() - ms
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

export function formatGHAction(event: GHEvent): { verb: string; rest: string } {
  const p = event.payload
  switch (event.type) {
    case 'PushEvent': {
      const n = p.size ?? p.commits?.length ?? 1
      return { verb: 'pushed', rest: n === 1 ? '' : `${n} times` }
    }
    case 'ReleaseEvent':
      return { verb: 'released', rest: p.release?.tag_name ?? 'new version' }
    case 'PullRequestEvent':
      return { verb: `${p.action} PR`, rest: p.pull_request?.number ? `#${p.pull_request.number}` : '' }
    case 'CreateEvent':
      return { verb: `created ${p.ref_type ?? ''}`, rest: p.ref ?? '' }
    case 'IssuesEvent':
      return { verb: `${p.action} issue`, rest: p.issue?.number ? `#${p.issue.number}` : '' }
    case 'IssueCommentEvent':
      return { verb: 'commented', rest: p.issue?.number ? `on #${p.issue.number}` : '' }
    default:
      return { verb: event.type.replace('Event', '').toLowerCase(), rest: '' }
  }
}

export function getGHHref(event: GHEvent): string {
  const base = `https://github.com/${event.repo.name}`
  const p = event.payload
  switch (event.type) {
    case 'PullRequestEvent':
      return p.pull_request?.number ? `${base}/pull/${p.pull_request.number}` : base
    case 'IssuesEvent':
      return p.issue?.number ? `${base}/issues/${p.issue.number}` : base
    case 'IssueCommentEvent':
      return p.issue?.number ? `${base}/issues/${p.issue.number}` : base
    case 'ReleaseEvent':
      return `${base}/releases`
    default:
      return base
  }
}

export function extractDrupalProject(url: string): string {
  const match = url.match(/\/project\/([^/]+)\//)
  return match ? `drupal/${match[1]}` : 'drupal.org'
}

export function extractDrupalMRProject(webUrl: string): string {
  const match = webUrl.match(/git\.drupalcode\.org\/project\/([^/]+)/)
  return match ? `drupal/${match[1]}` : 'drupal.org'
}

export function parseDrupalRelease(title: string): { module: string; version: string } {
  const i = title.lastIndexOf(' ')
  if (i === -1) return { module: title, version: '' }
  return { module: title.slice(0, i), version: title.slice(i + 1) }
}

interface ActivityWithTs extends Activity {
  ts: number
}

export function mergeActivity(
  ghEvents: GHEvent[] | null,
  drupalComments: DrupalListResponse<DrupalComment> | null,
  drupalReleases: DrupalListResponse<DrupalRelease> | null,
  drupalMRs: DrupalMR[] | null,
): Activity[] {
  const items: ActivityWithTs[] = []

  // Group PushEvents by repo + calendar date so burst commits don't flood the feed
  const pushGroups = new Map<string, { ts: number; repo: string; count: number; href: string }>()

  for (const event of ghEvents ?? []) {
    const ts = new Date(event.created_at).getTime()
    if (event.type === 'PushEvent') {
      const key = `${event.repo.name}|${event.created_at.slice(0, 10)}`
      const group = pushGroups.get(key)
      if (group) {
        group.count++
        group.ts = Math.max(group.ts, ts)
      }
      else {
        pushGroups.set(key, { ts, repo: event.repo.name, count: 1, href: getGHHref(event) })
      }
    }
    else {
      const { verb, rest } = formatGHAction(event)
      items.push({
        ts,
        when: formatAge(event.created_at),
        repo: event.repo.name,
        verb,
        rest,
        source: 'GH',
        href: getGHHref(event),
      })
    }
  }

  for (const group of pushGroups.values()) {
    items.push({
      ts: group.ts,
      when: formatAge(group.ts / 1000),
      repo: group.repo,
      verb: 'pushed',
      rest: group.count === 1 ? '' : `${group.count} times`,
      source: 'GH',
      href: group.href,
    })
  }

  for (const comment of drupalComments?.list ?? []) {
    items.push({
      ts: Number(comment.created) * 1000,
      when: formatAge(Number(comment.created)),
      repo: extractDrupalProject(comment.url),
      verb: 'commented',
      rest: 'on issue',
      source: 'D.O',
      href: comment.url,
    })
  }

  for (const release of drupalReleases?.list ?? []) {
    const { module, version } = parseDrupalRelease(release.title)
    items.push({
      ts: Number(release.created) * 1000,
      when: formatAge(Number(release.created)),
      repo: `drupal/${module}`,
      verb: 'released',
      rest: version,
      source: 'D.O',
      href: `https://www.drupal.org/project/${module}`,
    })
  }

  for (const mr of drupalMRs ?? []) {
    const ts = new Date(mr.created_at).getTime()
    const verb = mr.state === 'merged' ? 'merged MR' : mr.state === 'closed' ? 'closed MR' : 'opened MR'
    items.push({
      ts,
      when: formatAge(mr.created_at),
      repo: extractDrupalMRProject(mr.web_url),
      verb,
      rest: '',
      source: 'D.O',
      href: mr.web_url,
    })
  }

  return items
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30)
    .map(({ when, repo, verb, rest, source, href }) => ({ when, repo, verb, rest, source, href }))
}

const DRUPAL_UID = 103796

export function useActivity() {
  const { data: ghEvents } = useFetch<GHEvent[]>(
    '/api/activity-gh',
  )
  const { data: drupalComments, refresh: refreshComments } = useFetch<DrupalListResponse<DrupalComment>>(
    `https://www.drupal.org/api-d7/comment.json?author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
  )
  const { data: drupalReleases, refresh: refreshReleases } = useFetch<DrupalListResponse<DrupalRelease>>(
    `https://www.drupal.org/api-d7/node.json?type=project_release&author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
  )
  const { data: drupalMRs, refresh: refreshMRs } = useFetch<DrupalMR[]>(
    'https://git.drupalcode.org/api/v4/merge_requests?author_username=deciphered&state=all&per_page=100&scope=all',
  )
  onMounted(() => { refreshComments(); refreshReleases(); refreshMRs() })

  const activity = computed<Activity[]>(() =>
    mergeActivity(
      ghEvents.value ?? null,
      drupalComments.value ?? null,
      drupalReleases.value ?? null,
      drupalMRs.value ?? null,
    ),
  )

  return { activity }
}
