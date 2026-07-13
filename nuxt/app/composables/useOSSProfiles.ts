import { formatK } from '~/utils/format'

export function useOSSProfiles() {
  const { totalCount, totalDrupalStars } = useModules()
  const { packages } = useNpmPackages()
  const { data: ghData } = useFetch<{ repos: number; stars: number }>('/api/github-stats')

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

  return { githubStat, drupalStat, npmStat }
}
