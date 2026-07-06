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

export function formatGHAction(event: GHEvent): string {
  const p = event.payload
  switch (event.type) {
    case 'PushEvent': {
      const n = p.size ?? p.commits?.length ?? 1
      return `pushed ${n} commit${n !== 1 ? 's' : ''}`
    }
    case 'ReleaseEvent':
      return `released ${p.release?.tag_name ?? 'new version'}`
    case 'PullRequestEvent':
      return `${p.action} PR #${p.pull_request?.number}`
    case 'CreateEvent':
      return `created ${p.ref_type}${p.ref ? ` ${p.ref}` : ''}`
    case 'IssuesEvent':
      return `${p.action} issue #${p.issue?.number}`
    case 'IssueCommentEvent':
      return `commented on #${p.issue?.number}`
    default:
      return event.type.replace('Event', '').toLowerCase()
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
): Activity[] {
  const items: ActivityWithTs[] = []

  for (const event of ghEvents ?? []) {
    items.push({
      ts: new Date(event.created_at).getTime(),
      when: formatAge(event.created_at),
      repo: event.repo.name,
      action: formatGHAction(event),
      href: getGHHref(event),
    })
  }

  for (const comment of drupalComments?.list ?? []) {
    items.push({
      ts: Number(comment.created) * 1000,
      when: formatAge(Number(comment.created)),
      repo: extractDrupalProject(comment.url),
      action: 'commented on issue',
      href: comment.url,
    })
  }

  for (const release of drupalReleases?.list ?? []) {
    const { module, version } = parseDrupalRelease(release.title)
    items.push({
      ts: Number(release.created) * 1000,
      when: formatAge(Number(release.created)),
      repo: `drupal/${module}`,
      action: `released ${version}`,
      href: `https://www.drupal.org/project/${module}`,
    })
  }

  return items
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5)
    .map(({ when, repo, action, href }) => ({ when, repo, action, href }))
}

const DRUPAL_UID = 103796

export function useActivity() {
  const { data: ghEvents } = useFetch<GHEvent[]>(
    'https://api.github.com/users/Decipher/events/public',
    { server: false, lazy: true },
  )
  const { data: drupalComments } = useFetch<DrupalListResponse<DrupalComment>>(
    `https://www.drupal.org/api-d7/comment.json?author=${DRUPAL_UID}&sort=created&direction=DESC&limit=10`,
    { server: false, lazy: true },
  )
  const { data: drupalReleases } = useFetch<DrupalListResponse<DrupalRelease>>(
    `https://www.drupal.org/api-d7/node.json?type=project_release&author=${DRUPAL_UID}&sort=created&direction=DESC&limit=10`,
    { server: false, lazy: true },
  )

  const activity = computed<Activity[]>(() =>
    mergeActivity(ghEvents.value ?? null, drupalComments.value ?? null, drupalReleases.value ?? null),
  )

  return { activity }
}
