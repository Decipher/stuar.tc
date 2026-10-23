import { defineEventHandler } from 'h3'
import { GH_PR_EVENT_TYPES } from '#shared/utils/heartbeat'
import { setHeartbeatCacheHeaders } from '../utils/heartbeatCache'
import { timeoutSignal } from '../utils/timeoutSignal'

const GH_USER = 'Decipher'

/** Most PR title lookups one response makes (each is one GitHub API request). */
export const PR_TITLE_LOOKUP_CAP = 15

/**
 * Overall time budget for the PR title lookups. In production this route is
 * a Netlify Function (10s synchronous limit) and the events fetch alone takes
 * a few seconds, so titles that don't arrive in time are dropped.
 */
export const PR_TITLE_BUDGET_MS = 3000

/** Timeout for each page of the events fetch. */
const EVENTS_TIMEOUT_MS = 5000

/**
 * Builds the GitHub REST API request headers.
 *
 * @param token - Optional GitHub token.
 * @returns Headers for `fetch`.
 */
function ghHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

/**
 * Fetches Stuart's public GitHub events (three pages of 100).
 *
 * @param token - Optional GitHub token, for the higher rate limit.
 * @returns The raw events; a page that fails contributes nothing.
 */
export async function fetchGHActivity(token?: string): Promise<unknown[]> {
  const headers = ghHeaders(token)

  const pages = await Promise.all(
    [1, 2, 3].map((page) => {
      const { signal, clear } = timeoutSignal(EVENTS_TIMEOUT_MS)
      return fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=100&page=${page}`, { headers, signal })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
        .finally(clear)
    }),
  )

  return pages.flat()
}

interface RawGHEvent {
  type?: string
  repo?: { name?: string }
  created_at?: string
  payload?: {
    size?: number
    ref?: string
    ref_type?: string
    action?: string
    release?: { tag_name?: string }
    pull_request?: { number?: number; title?: string }
    issue?: { number?: number; title?: string; pull_request?: unknown }
  }
}

/** A GitHub event trimmed to what the Heartbeat renders. */
export interface TrimmedGHEvent {
  type?: string
  repo: { name?: string }
  created_at?: string
  payload: {
    size?: number
    ref?: string
    ref_type?: string
    action?: string
    release?: { tag_name: string }
    pull_request?: { number: number; title?: string }
    issue?: { number: number; title?: string; pull_request?: true }
  }
}

// GitHub's event payloads carry the full API entity (actor, org, nested
// pull_request/issue objects with dozens of fields, commit lists, etc.), of
// which useActivity's mergeActivity only ever reads a handful. Trimming here
// shrinks both the client fetch and the prerendered SSR payload.
/**
 * Trims a GitHub event to the fields the Heartbeat reads.
 *
 * @param e - A raw event from the Events API.
 * @returns The trimmed event. `issue.pull_request` becomes `true` when the
 *   issue is a pull request (so a comment on it reads "commented on PR").
 */
export function trimGHEvent(e: RawGHEvent): TrimmedGHEvent {
  const p = e.payload ?? {}
  return {
    type: e.type,
    repo: { name: e.repo?.name },
    created_at: e.created_at,
    payload: {
      size: p.size,
      ref: p.ref,
      ref_type: p.ref_type,
      action: p.action,
      release: p.release?.tag_name ? { tag_name: p.release.tag_name } : undefined,
      pull_request: p.pull_request?.number
        ? { number: p.pull_request.number, ...(p.pull_request.title ? { title: p.pull_request.title.trim() } : {}) }
        : undefined,
      issue: p.issue?.number
        ? {
            number: p.issue.number,
            ...(p.issue.title ? { title: p.issue.title.trim() } : {}),
            ...(p.issue.pull_request ? { pull_request: true } : {}),
          }
        : undefined,
    },
  }
}

/**
 * Fills in pull request titles, which GitHub's Events API no longer sends
 * (`payload.pull_request` carries only base/head/id/number/url).
 *
 * Looks up each distinct PR among the events the Heartbeat will show,
 * newest first, at most `PR_TITLE_LOOKUP_CAP` of them, in parallel, within
 * an overall `budgetMs` (lookups still pending then are aborted). Only
 * runs with a token: unauthenticated, the 60/hour limit is shared with the
 * events fetch itself. Best effort: a failed lookup leaves that title out.
 * Mutates and returns `events`.
 *
 * @param events - Trimmed events, newest first.
 * @param token - GitHub token; without one nothing is looked up.
 * @param budgetMs - Overall time budget for all lookups.
 * @returns The same events, with `payload.pull_request.title` set where found.
 */
export async function attachPRTitles(
  events: TrimmedGHEvent[],
  token?: string,
  budgetMs: number = PR_TITLE_BUDGET_MS,
): Promise<TrimmedGHEvent[]> {
  if (!token) return events

  const wanted = new Map<string, TrimmedGHEvent[]>()
  for (const event of events) {
    const pr = event.payload.pull_request
    // PR event types are never filtered out of the Heartbeat, so every PR
    // reaching this point is one that will be shown.
    if (!pr || pr.title || !event.repo.name || !GH_PR_EVENT_TYPES.has(String(event.type))) continue
    const key = `${event.repo.name}#${pr.number}`
    const group = wanted.get(key)
    if (group) group.push(event)
    else if (wanted.size < PR_TITLE_LOOKUP_CAP) wanted.set(key, [event])
  }

  const headers = ghHeaders(token)
  const { signal, clear } = timeoutSignal(budgetMs)
  await Promise.all([...wanted.values()].map(async (group) => {
    const { repo, payload } = group[0]!
    try {
      const res = await fetch(`https://api.github.com/repos/${repo.name}/pulls/${payload.pull_request!.number}`, { headers, signal })
      if (!res.ok) return
      const { title } = await res.json() as { title?: unknown }
      if (typeof title !== 'string' || !title.trim()) return
      for (const e of group) e.payload.pull_request!.title = title.trim()
    }
    catch {
      // Best effort: the row shows just the number.
    }
  })).finally(clear)
  return events
}

export default defineEventHandler(async (event) => {
  setHeartbeatCacheHeaders(event)
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  const events = await fetchGHActivity(token)
  return attachPRTitles((events as RawGHEvent[]).map(trimGHEvent), token)
})
