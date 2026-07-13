import { defineEventHandler, getQuery } from 'h3'

const GH_API = 'https://api.github.com'

export function parseReposQuery(query: Record<string, string | string[]>): string[] {
  return query.repos ? String(query.repos).split(',').filter(Boolean) : []
}

export async function fetchRepoStars(repos: string[], token?: string): Promise<Record<string, number>> {
  if (!repos.length) return {}

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const results = await Promise.all(
    repos.map(repo =>
      fetch(`${GH_API}/repos/${repo}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ),
  )

  return Object.fromEntries(
    repos.map((repo, i) => [repo, (results[i]?.stargazers_count ?? 0) as number]),
  )
}

export default defineEventHandler(async (event) => {
  const repos = parseReposQuery(getQuery(event))
  return fetchRepoStars(repos, process.env.GITHUB_TOKEN || process.env.GH_TOKEN)
})
