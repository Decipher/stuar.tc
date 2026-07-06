import { stats as staticStats } from '~/data/stats'

export function useStats() {
  const { modules } = useModules()

  const stats = computed(() => {
    const ffp = modules.value.find(m => m.machine === 'filefield_paths')
    if (!ffp) return staticStats

    return staticStats.map(s =>
      s.label === 'sites run File (Field) Paths' ? { ...s, value: ffp.installs } : s,
    )
  })

  return { stats }
}
