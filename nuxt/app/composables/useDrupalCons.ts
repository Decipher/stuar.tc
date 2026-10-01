import type { DrupalCon } from '~/data/drupalcons'

const DRUPAL_UID = 103796

const CITY_NAMES: Record<string, string> = {
  neworleans: 'New Orleans',
  global: 'Global',
  europe: 'Europe',
}

// drupal.org profile data (field_events_attended) needs two corrections until
// the profile itself is fixed:
// - `sydney_2012` is mistagged: DrupalCon Sydney ran in February 2013. Stuart
//   was on its local organising team (app/data/community.ts).
// - `barcelona_2020` was never attended. Barcelona 2020 was cancelled and run
//   online as DrupalCon Europe 2020, which Stuart did not attend; his two
//   online DrupalCons were Global 2020 and Europe 2021.
const EVENT_KEY_OVERRIDES: Record<string, string> = {
  sydney_2012: 'sydney_2013',
}

/** Profile entries for events Stuart did not attend. */
const EXCLUDED_EVENT_KEYS = new Set(['barcelona_2020'])

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

// drupal.org's user entity is large (roles, picture, dozens of fields);
// only field_events_attended is used, so trim before it hits the payload.
export function transformDrupalUserProfile(res: DrupalUserProfile): DrupalUserProfile {
  return { field_events_attended: res.field_events_attended }
}

export function useDrupalCons() {
  const { data, refresh } = useFetch<DrupalUserProfile>(
    `https://www.drupal.org/api-d7/user/${DRUPAL_UID}.json`,
    { transform: transformDrupalUserProfile },
  )

  function refreshLive() {
    refresh()
  }

  const drupalcons = computed<DrupalCon[]>(() => {
    const events = data.value?.field_events_attended
    if (!events?.length) return []
    return [...events].reverse().filter(key => !EXCLUDED_EVENT_KEYS.has(key)).map(parseEventKey)
  })

  return { drupalcons, refreshLive }
}
