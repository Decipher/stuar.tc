const NPM_MAINTAINER = 'deciphered'

interface NpmSearchObject {
  package: { name: string; links?: { repository?: string } }
}

interface NpmDownloadEntry {
  downloads: number
  package: string
}

type NpmDownloadsResponse = Record<string, NpmDownloadEntry>

export interface NpmModule {
  name: string
  machine: string
  installs: string
  percent: number
  href: string
  sortKey: number
  stars?: string
}

/** Shape returned by {@link fetchNpmPackages}. */
export interface NpmPackagesData {
  objects: NpmSearchObject[]
  downloads?: NpmDownloadsResponse
}

export async function fetchNpmPackages(): Promise<NpmPackagesData> {
  const searchRes = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${NPM_MAINTAINER}&size=100`,
  )
  if (!searchRes.ok) return { objects: [], downloads: {} }

  const search: { objects?: NpmSearchObject[] } = await searchRes.json()
  const objects = search.objects ?? []
  const names = objects
    .map(o => o.package.name)
    .filter(n => !n.startsWith('@'))

  if (!names.length) return { objects, downloads: {} }

  const dlRes = await fetch(
    `https://api.npmjs.org/downloads/point/last-month/${names.join(',')}`,
  )
  const downloads: NpmDownloadsResponse = dlRes.ok ? await dlRes.json() : {}

  return { objects, downloads }
}

export function extractGithubRepo(url?: string): string | null {
  if (!url) return null
  const pathMatch = url.match(/github\.com\/(.+)/)
  if (!pathMatch) return null
  const parts = pathMatch[1]!.split('/')
  if (parts.length < 2 || !parts[0] || !parts[1]) return null
  return `${parts[0]}/${parts[1].replace(/\.git$/, '')}`
}

export function useNpmPackages() {
  const { data, refresh } = useAsyncData('npm-packages', fetchNpmPackages)

  onMounted(refresh)

  const reposQuery = computed(() => {
    const repos = (data.value?.objects ?? [])
      .map(o => extractGithubRepo(o.package.links?.repository))
      .filter(Boolean) as string[]
    return { repos: repos.join(',') }
  })

  const { data: starsData } = useFetch<Record<string, number>>('/api/repos-gh', { query: reposQuery })

  const packages = computed<NpmModule[]>(() => {
    const pkgs = data.value?.objects ?? []
    if (!pkgs.length) return []

    const downloads = data.value!.downloads ?? {}
    const stars = starsData.value ?? {}

    const ranked = pkgs
      .map(o => {
        const repo = extractGithubRepo(o.package.links?.repository)
        const count = repo ? (stars[repo] ?? 0) : 0
        return {
          name: o.package.name,
          downloads: downloads[o.package.name]?.downloads ?? 0,
          stars: count > 0 ? String(count) : undefined,
        }
      })
      .sort((a, b) => b.downloads - a.downloads)

    const max = ranked[0]?.downloads || 1
    return ranked.map(p => ({
      name: p.name,
      machine: p.name,
      installs: `${p.downloads.toLocaleString()}/mo`,
      percent: Math.round((p.downloads / max) * 100),
      href: `https://www.npmjs.com/package/${encodeURIComponent(p.name)}`,
      sortKey: p.downloads,
      stars: p.stars,
    }))
  })

  return { packages }
}
