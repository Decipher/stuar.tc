const GH_USER = 'Decipher'

export default defineEventHandler(async () => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
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
})
