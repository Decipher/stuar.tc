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

/** Shape returned by {@link fetchNpmPackages}. */
export interface NpmPackagesData {
  objects: NpmSearchObject[]
  downloads: NpmDownloadsResponse
}

/**
 * Fetches maintained packages from npm and their monthly download counts.
 *
 * Queries the npm search API for packages by maintainer, then fetches
 * download statistics from the npm downloads API. Returns empty data
 * on any API failure.
 *
 * @returns An object with package search results and download counts.
 */
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

/**
 * Composable providing ranked npm package data for the maintainer's modules.
 *
 * Triggers a refresh on mount; exposes a computed `packages` array sorted
 * by monthly downloads with formatted install counts and percentages.
 *
 * @returns An object with a `packages` computed ref.
 */
export function useNpmPackages() {
  const { data, refresh } = useAsyncData('npm-packages', fetchNpmPackages)

  onMounted(refresh)

  const packages = computed<NpmModule[]>(() => {
    const pkgs = data.value?.objects ?? []
    if (!pkgs.length) return []

    const downloads = data.value!.downloads ?? {}
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
