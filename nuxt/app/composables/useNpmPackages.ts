const NPM_MAINTAINER = 'deciphered'

interface NpmSearchObject {
  package: { name: string }
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
  const { data, refresh } = useAsyncData('npm-packages', async () => {
    const searchRes = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=maintainer:${NPM_MAINTAINER}&size=100`,
    )
    if (!searchRes.ok) return { objects: [] as NpmSearchObject[], downloads: {} as NpmDownloadsResponse }

    const search: { objects: NpmSearchObject[] } = await searchRes.json()
    const names = (search.objects?.map(o => o.package.name) ?? []).filter(n => !n.startsWith('@'))

    if (!names.length) return { objects: search.objects ?? [], downloads: {} as NpmDownloadsResponse }

    const dlRes = await fetch(
      `https://api.npmjs.org/downloads/point/last-month/${names.join(',')}`,
    )
    const downloads: NpmDownloadsResponse = dlRes.ok ? await dlRes.json() : {}

    return { objects: search.objects ?? [], downloads }
  })

  onMounted(refresh)

  const packages = computed<NpmModule[]>(() => {
    const pkgs = data.value?.objects ?? []
    if (!pkgs.length) return []

    const downloads = data.value?.downloads ?? {}
    const ranked = pkgs
      .map(o => ({
        name: o.package.name,
        downloads: downloads[o.package.name]?.downloads ?? 0,
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
