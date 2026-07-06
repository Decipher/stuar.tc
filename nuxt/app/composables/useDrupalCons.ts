import type { DrupalCon } from '~/data/drupalcons'

const DRUPAL_UID = 103796

const CITY_NAMES: Record<string, string> = {
  neworleans: 'New Orleans',
  global: 'Global',
  europe: 'Europe',
}

export function parseEventKey(key: string): DrupalCon {
  const lastUnderscore = key.lastIndexOf('_')
  const cityKey = key.slice(0, lastUnderscore)
  const year = key.slice(lastUnderscore + 1)
  const city = CITY_NAMES[cityKey] ?? (cityKey.charAt(0).toUpperCase() + cityKey.slice(1))
  return { year, city }
}

interface DrupalUserProfile {
  field_events_attended?: string[]
}

export function useDrupalCons() {
  const { data } = useFetch<DrupalUserProfile>(
    `https://www.drupal.org/api-d7/user/${DRUPAL_UID}.json`,
    { server: false, lazy: true },
  )

  const drupalcons = computed<DrupalCon[]>(() => {
    const events = data.value?.field_events_attended
    if (!events?.length) return []
    return [...events].reverse().map(parseEventKey)
  })

  return { drupalcons }
}
