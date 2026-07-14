import { defineEventHandler } from 'h3'

const GH_USER = 'Decipher'

export async function fetchGHActivity(token?: string): Promise<unknown[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const pages = await Promise.all(
    [1, 2, 3].map(page =>
      fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=100&page=${page}`, { headers })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
    ),
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
    pull_request?: { number?: number }
    issue?: { number?: number }
  }
}

// GitHub's event payloads carry the full API entity (actor, org, nested
// pull_request/issue objects with dozens of fields, commit lists, etc.), of
// which useActivity's mergeActivity only ever reads a handful. Trimming here
// shrinks both the client fetch and the prerendered SSR payload.
export function trimGHEvent(e: RawGHEvent) {
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
      pull_request: p.pull_request?.number ? { number: p.pull_request.number } : undefined,
      issue: p.issue?.number ? { number: p.issue.number } : undefined,
    },
  }
}

export default defineEventHandler(async () => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  const events = await fetchGHActivity(token)
  return (events as RawGHEvent[]).map(trimGHEvent)
})
