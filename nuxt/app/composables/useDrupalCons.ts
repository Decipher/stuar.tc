import type { DrupalCon } from '~/data/drupalcons'

const DRUPAL_UID = 103796

const CITY_NAMES: Record<string, string> = {
  neworleans: 'New Orleans',
  global: 'Global',
  europe: 'Europe',
}

// drupal.org profile data (field_events_attended) has one mistagged entry:
// DrupalCon 2020 was fully virtual as "DrupalCon Europe 2020" (no in-person
// Barcelona event that year — see drupal.org's official event list), but the
// profile tags it `barcelona_2020`. Override until the profile is corrected.
const EVENT_KEY_OVERRIDES: Record<string, string> = {
  barcelona_2020: 'europe_2020',
}

export function parseEventKey(key: string): DrupalCon {
  const normalizedKey = EVENT_KEY_OVERRIDES[key] ?? key
  const lastUnderscore = normalizedKey.lastIndexOf('_')
  const cityKey = normalizedKey.slice(0, lastUnderscore)
  const year = normalizedKey.slice(lastUnderscore + 1)
  const city = CITY_NAMES[cityKey] ?? (cityKey.charAt(0).toUpperCase() + cityKey.slice(1))
  return { year, city }
}

interface DrupalUserProfile {
  field_events_attended?: string[]
}

export function useDrupalCons() {
  // drupal.org's user entity is large (roles, picture, dozens of fields);
  // only field_events_attended is used, so trim before it hits the payload.
  const { data, refresh } = useFetch<DrupalUserProfile>(
    `https://www.drupal.org/api-d7/user/${DRUPAL_UID}.json`,
    { transform: (res: DrupalUserProfile) => ({ field_events_attended: res.field_events_attended }) },
  )
  onMounted(refresh)

  const drupalcons = computed<DrupalCon[]>(() => {
    const events = data.value?.field_events_attended
    if (!events?.length) return []
    return [...events].reverse().map(parseEventKey)
  })

  return { drupalcons }
}
