import { defineEventHandler } from 'h3'

const SOURCES = [
  { type: 'users', name: 'Decipher', filter: 'type=owner' },
  { type: 'orgs', name: 'druxt', filter: 'type=public' },
  { type: 'orgs', name: 'druxt-contrib', filter: 'type=public' },
] as const

export async function fetchGitHubStats(token?: string): Promise<{ repos: number; stars: number }> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let repos = 0
  let stars = 0

  for (const { type, name, filter } of SOURCES) {
    let page = 1
    while (true) {
      const res = await fetch(
        `https://api.github.com/${type}/${name}/repos?per_page=100&page=${page}&${filter}`,
        { headers },
      ).catch(() => null)

      if (!res?.ok) break

      const list: Array<{ stargazers_count?: number }> = await res.json()
      if (!list.length) break

      repos += list.length
      stars += list.reduce((s, r) => s + (r.stargazers_count ?? 0), 0)

      if (list.length < 100) break
      page++
    }
  }

  return { repos, stars }
}

export default defineEventHandler(async () => {
  return fetchGitHubStats(process.env.GITHUB_TOKEN || process.env.GH_TOKEN)
})
