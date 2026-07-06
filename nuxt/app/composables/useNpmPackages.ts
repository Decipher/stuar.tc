const NPM_MAINTAINER = 'deciphered'

interface NpmSearchObject {
  package: { name: string }
}

interface NpmSearchResponse {
  objects: NpmSearchObject[]
  total: number
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
}

export function useNpmPackages() {
  const { data: search } = useFetch<NpmSearchResponse>(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${NPM_MAINTAINER}&size=100`,
    { server: false, lazy: true },
  )

  const { data: downloads } = useFetch<NpmDownloadsResponse>(
    () => {
      const names = (search.value?.objects?.map(o => o.package.name) ?? [])
        .filter(n => !n.startsWith('@'))
      return names.length
        ? `https://api.npmjs.org/downloads/point/last-month/${names.join(',')}`
        : 'https://api.npmjs.org/downloads/point/last-month/druxt'
    },
    { server: false, lazy: true },
  )

  const packages = computed<NpmModule[]>(() => {
    const pkgs = search.value?.objects ?? []
    if (!pkgs.length) return []

    const ranked = pkgs
      .map(o => ({
        name: o.package.name,
        downloads: downloads.value?.[o.package.name]?.downloads ?? 0,
      }))
      .sort((a, b) => b.downloads - a.downloads)

    const max = ranked[0]?.downloads || 1
    return ranked.map(p => ({
      name: p.name,
      machine: p.name,
      installs: `${p.downloads.toLocaleString()}/mo`,
      percent: Math.round((p.downloads / max) * 100),
      href: `https://www.npmjs.com/package/${encodeURIComponent(p.name)}`,
      sortKey: p.downloads,
    }))
  })

  return { packages }
}
