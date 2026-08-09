import { formatK } from '~/utils/format'

export function useOSSProfiles() {
  const { totalCount, totalDrupalStars, refreshLive: refreshModules } = useModules()
  const { packages, refreshLive: refreshNpm } = useNpmPackages()
  const { data: ghData, refresh: refreshGH } = useFetch<{ repos: number; stars: number }>('/api/github-stats')

  function refreshLive() {
    refreshModules()
    refreshNpm()
    refreshGH()
  }

  const githubStat = computed<string | null>(() => {
    if (!ghData.value) return null
    const { repos, stars } = ghData.value
    return `${repos} repos · ${formatK(stars)} ★`
  })

  const drupalStat = computed<string | null>(() => {
    const count = totalCount.value
    if (!count) return null
    const stars = totalDrupalStars.value
    return stars ? `${count} modules · ${formatK(stars)} ★` : `${count} modules`
  })

  const npmStat = computed<string | null>(() => {
    const count = packages.value.length
    return count ? `${count} packages` : null
  })

  return { githubStat, drupalStat, npmStat, refreshLive }
}
