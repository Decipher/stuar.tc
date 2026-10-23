import type { Activity } from '~/data/activity'
import type { DevNullPost } from '~~/server/api/activity-devnull.get'
import { isHeartbeatGHEvent } from '#shared/utils/heartbeat'

export type { DevNullPost }

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
    pull_request?: { number: number; title?: string }
    issue?: { number: number; title?: string; pull_request?: boolean }
  }
}

export interface DrupalComment {
  created: string
  url: string
}

export interface DrupalRelease {
  created: string
  title: string
}

export interface DrupalMR {
  created_at: string
  state: string
  web_url: string
  title: string
}

export interface DrupalListResponse<T> {
  list: T[]
}

// drupal.org's node/comment JSON responses are full entities (dozens of
// unused fields — body, taxonomy, images, etc.). Trimming via `transform`
// keeps only what's rendered so it doesn't bloat the prerendered SSR
// payload. Shared with useContributions, which fetches the same URLs.
export function transformDrupalComments(
  res: DrupalListResponse<DrupalComment>,
): DrupalListResponse<DrupalComment> {
  return { list: res.list.map(c => ({ created: c.created, url: c.url })) }
}

export function transformDrupalReleases(
  res: DrupalListResponse<DrupalRelease>,
): DrupalListResponse<DrupalRelease> {
  return { list: res.list.map(r => ({ created: r.created, title: r.title })) }
}

// Drupal GitLab's merge_requests API returns full MR entities (dozens of
// unused fields — description, pipeline, assignees, etc.); trim to just
// what's rendered.
export function transformDrupalMRs(res: DrupalMR[]): DrupalMR[] {
  return res.map(mr => ({ created_at: mr.created_at, state: mr.state, web_url: mr.web_url, title: mr.title }))
}

/**
 * Formats the time since a moment as a compact age: `3m`, `2h`, `5d`, `1w`.
 * Times in the future (clock skew) read as `0m`.
 *
 * @param input - An ISO date string, or Unix seconds (drupal.org's format).
 * @param now - The current time in ms (defaults to `Date.now()`).
 * @returns The age label.
 */
export function formatAge(input: string | number, now: number = Date.now()): string {
  const ms = typeof input === 'number' ? input * 1000 : new Date(input).getTime()
  const diff = Math.max(0, now - ms)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

// Fixed locale and zone so the server and the hydrating client render the
// same label. Melbourne is the author's zone (Ballarat).
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })

/**
 * Formats a moment as a short absolute date ("Oct 23"), the label a
 * prerendered row carries until the client can compute a relative age.
 *
 * @param iso - An ISO 8601 date string.
 * @returns The date label, in the author's time zone.
 */
export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(new Date(iso))
}

/**
 * Joins a `#123` reference and a title with a middle dot, dropping whichever is missing.
 *
 * @param ref - Reference such as "#209" or "!70", or `''`.
 * @param title - Optional title.
 * @returns e.g. "#209 · chore(release): cut v1.11.0".
 */
export function withTitle(ref: string, title?: string): string {
  const t = title?.trim()
  return [ref, t].filter(Boolean).join(' · ')
}

/**
 * Turns an unknown GitHub event type into words: "DiscussionEvent" → "discussion".
 *
 * @param type - GitHub event type.
 * @returns Lower-case words.
 */
function humanizeEventType(type: string): string {
  return type.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

/**
 * Describes a GitHub event as a verb and the detail that follows it.
 * Every type gets a readable verb; no raw event name reaches the UI.
 *
 * @param event - A trimmed GitHub event.
 * @returns `{ verb, rest }`, e.g. `{ verb: 'reviewed PR', rest: '#209 · Title' }`.
 */
export function formatGHAction(event: GHEvent): { verb: string; rest: string } {
  const p = event.payload
  const pr = p.pull_request?.number ? withTitle(`#${p.pull_request.number}`, p.pull_request.title) : ''
  const issue = p.issue?.number ? withTitle(`#${p.issue.number}`, p.issue.title) : ''
  switch (event.type) {
    case 'PushEvent': {
      const n = p.size ?? p.commits?.length ?? 1
      return { verb: 'pushed', rest: n === 1 ? '' : `${n} times` }
    }
    case 'ReleaseEvent':
      return { verb: 'released', rest: p.release?.tag_name ?? 'new version' }
    case 'PullRequestEvent':
      return { verb: `${p.action ?? 'updated'} PR`, rest: pr }
    case 'PullRequestReviewEvent':
      return { verb: 'reviewed PR', rest: pr }
    case 'PullRequestReviewCommentEvent':
      return { verb: 'commented on PR', rest: pr }
    case 'CreateEvent':
      return { verb: `created ${p.ref_type ?? ''}`.trim(), rest: p.ref ?? '' }
    case 'IssuesEvent':
      return { verb: `${p.action ?? 'updated'} issue`, rest: issue }
    case 'IssueCommentEvent':
      return { verb: p.issue?.pull_request ? 'commented on PR' : 'commented on issue', rest: issue }
    case 'WatchEvent':
      return { verb: 'starred', rest: '' }
    case 'ForkEvent':
      return { verb: 'forked', rest: '' }
    case 'PublicEvent':
      return { verb: 'open-sourced', rest: '' }
    case 'CommitCommentEvent':
      return { verb: 'commented on commit', rest: '' }
    case 'GollumEvent':
      return { verb: 'edited wiki', rest: '' }
    case 'MemberEvent':
      return { verb: 'added collaborator', rest: '' }
    default:
      return { verb: `${p.action ?? 'updated'} ${humanizeEventType(event.type)}`, rest: '' }
  }
}

/**
 * Links a GitHub event to the page it is about.
 *
 * @param event - A trimmed GitHub event.
 * @returns The PR, issue or releases URL, else the repository.
 */
export function getGHHref(event: GHEvent): string {
  const base = `https://github.com/${event.repo.name}`
  const p = event.payload
  switch (event.type) {
    case 'PullRequestEvent':
    case 'PullRequestReviewEvent':
    case 'PullRequestReviewCommentEvent':
      return p.pull_request?.number ? `${base}/pull/${p.pull_request.number}` : base
    case 'IssuesEvent':
      return p.issue?.number ? `${base}/issues/${p.issue.number}` : base
    case 'IssueCommentEvent':
      if (!p.issue?.number) return base
      return p.issue.pull_request ? `${base}/pull/${p.issue.number}` : `${base}/issues/${p.issue.number}`
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

/**
 * Reads the merge request number from a GitLab MR URL.
 *
 * @param webUrl - e.g. https://git.drupalcode.org/project/x/-/merge_requests/70
 * @returns "!70", or `''` if the URL has no number.
 */
export function drupalMRRef(webUrl: string): string {
  const match = webUrl.match(/\/merge_requests\/(\d+)/)
  return match ? `!${match[1]}` : ''
}

export function parseDrupalRelease(title: string): { module: string; version: string } {
  const i = title.lastIndexOf(' ')
  if (i === -1) return { module: title, version: '' }
  return { module: title.slice(0, i), version: title.slice(i + 1) }
}

interface ActivityWithTs extends Activity {
  ts: number
}

/** Repository column for /dev/null rows. */
export const DEVNULL_REPO = 'dev-null.sh/@Decipher'

/**
 * Merges every Heartbeat source into rows, newest first, at most 30.
 *
 * @param ghEvents - Trimmed GitHub events from `/api/activity-gh`.
 * @param drupalComments - drupal.org comments.
 * @param drupalReleases - drupal.org releases.
 * @param drupalMRs - git.drupalcode.org merge requests.
 * @param devnullPosts - /dev/null posts from `/api/activity-devnull`.
 * @returns Rows carrying an ISO `at` and a short absolute `when`.
 */
export function mergeActivity(
  ghEvents: GHEvent[] | null,
  drupalComments: DrupalListResponse<DrupalComment> | null,
  drupalReleases: DrupalListResponse<DrupalRelease> | null,
  drupalMRs: DrupalMR[] | null,
  devnullPosts: DevNullPost[] | null = null,
): Activity[] {
  const items: ActivityWithTs[] = []

  function push(ts: number, row: Omit<Activity, 'when' | 'at'>) {
    if (Number.isNaN(ts)) return
    const at = new Date(ts).toISOString()
    items.push({ ts, at, when: formatShortDate(at), ...row })
  }

  for (const event of ghEvents ?? []) {
    if (!isHeartbeatGHEvent(event)) continue
    push(new Date(event.created_at).getTime(), {
      repo: event.repo.name,
      ...formatGHAction(event),
      source: 'GH',
      href: getGHHref(event),
    })
  }

  for (const comment of drupalComments?.list ?? []) {
    push(Number(comment.created) * 1000, {
      repo: extractDrupalProject(comment.url),
      verb: 'commented',
      rest: 'on issue',
      source: 'D.O',
      href: comment.url,
    })
  }

  for (const release of drupalReleases?.list ?? []) {
    const { module, version } = parseDrupalRelease(release.title)
    push(Number(release.created) * 1000, {
      repo: `drupal/${module}`,
      verb: 'released',
      rest: version,
      source: 'D.O',
      href: `https://www.drupal.org/project/${module}`,
    })
  }

  for (const mr of drupalMRs ?? []) {
    const verb = mr.state === 'merged' ? 'merged MR' : mr.state === 'closed' ? 'closed MR' : 'opened MR'
    push(new Date(mr.created_at).getTime(), {
      repo: extractDrupalMRProject(mr.web_url),
      verb,
      rest: withTitle(drupalMRRef(mr.web_url), mr.title),
      source: 'D.O',
      href: mr.web_url,
    })
  }

  for (const post of devnullPosts ?? []) {
    push(new Date(post.published).getTime(), {
      repo: DEVNULL_REPO,
      verb: 'posted',
      rest: post.text,
      source: '/DEV/NULL',
      href: post.url,
    })
  }

  return items
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30)
    .map(({ ts: _ts, ...row }) => row)
}

const DRUPAL_UID = 103796

/**
 * Live Heartbeat data: GitHub, drupal.org, git.drupalcode.org and /dev/null,
 * merged into rows. Fetched at prerender; `refreshLive` fetches every
 * source on the client.
 *
 * @returns `{ activity, refreshLive }`.
 */
export function useActivity() {
  const { data: ghEvents, refresh: refreshGH } = useFetch<GHEvent[]>(
    '/api/activity-gh',
  )
  // Server-side because the feed sends no CORS header. Prerendered like the
  // GitHub source, and refreshed with it on the client.
  const { data: devnullPosts, refresh: refreshDevNull } = useFetch<DevNullPost[]>(
    '/api/activity-devnull',
  )
  const { data: drupalComments, refresh: refreshComments } = useFetch<DrupalListResponse<DrupalComment>>(
    `https://www.drupal.org/api-d7/comment.json?author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
    { transform: transformDrupalComments },
  )
  const { data: drupalReleases, refresh: refreshReleases } = useFetch<DrupalListResponse<DrupalRelease>>(
    `https://www.drupal.org/api-d7/node.json?type=project_release&author=${DRUPAL_UID}&sort=created&direction=DESC&limit=50`,
    { transform: transformDrupalReleases },
  )
  const { data: drupalMRs, refresh: refreshMRs } = useFetch<DrupalMR[]>(
    'https://git.drupalcode.org/api/v4/merge_requests?author_username=deciphered&state=all&per_page=100&scope=all',
    { transform: transformDrupalMRs },
  )

  function refreshLive() {
    refreshGH()
    refreshComments()
    refreshReleases()
    refreshMRs()
    refreshDevNull()
  }

  const activity = computed<Activity[]>(() =>
    mergeActivity(
      ghEvents.value ?? null,
      drupalComments.value ?? null,
      drupalReleases.value ?? null,
      drupalMRs.value ?? null,
      devnullPosts.value ?? null,
    ),
  )

  return { activity, refreshLive }
}
