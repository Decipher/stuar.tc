import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { parseEventKey, transformDrupalUserProfile, useDrupalCons } from '~/composables/useDrupalCons'

// --- parseEventKey ---

describe('parseEventKey', () => {
  it('parses a simple city key', () => {
    expect(parseEventKey('vienna_2017')).toEqual({ year: '2017', city: 'Vienna' })
  })
  it('maps neworleans to New Orleans', () => {
    expect(parseEventKey('neworleans_2016')).toEqual({ year: '2016', city: 'New Orleans' })
  })
  it('maps global to Global', () => {
    expect(parseEventKey('global_2020')).toEqual({ year: '2020', city: 'Global' })
  })
  it('maps europe to Europe', () => {
    expect(parseEventKey('europe_2021')).toEqual({ year: '2021', city: 'Europe' })
  })
  it('title-cases a lowercase city', () => {
    expect(parseEventKey('london_2011')).toEqual({ year: '2011', city: 'London' })
  })
  it('corrects the mistagged barcelona_2020 drupal.org profile entry to Europe', () => {
    expect(parseEventKey('barcelona_2020')).toEqual({ year: '2020', city: 'Europe' })
  })
})

// --- transformDrupalUserProfile ---

describe('transformDrupalUserProfile', () => {
  it('trims the response down to field_events_attended', () => {
    const result = transformDrupalUserProfile({
      field_events_attended: ['vienna_2017'],
      // Fields the real drupal.org profile entity includes that must be dropped.
      roles: { authenticated: 'authenticated' },
      picture: { url: 'https://example.com/avatar.png' },
    } as never)
    expect(result).toEqual({ field_events_attended: ['vienna_2017'] })
  })
})

// --- useDrupalCons ---

const profileData = ref<unknown>(null)
const refreshSpy = vi.fn()
mockNuxtImport('useFetch', () => (url: string) => {
  if (url.includes('api-d7/user')) return { data: profileData, refresh: refreshSpy }
  return { data: ref(null), refresh: vi.fn() }
})

describe('useDrupalCons', () => {
  beforeEach(() => {
    profileData.value = null
    refreshSpy.mockClear()
  })

  it('returns empty array when data is null', () => {
    const { drupalcons } = useDrupalCons()
    expect(drupalcons.value).toEqual([])
  })

  it('returns empty array when field_events_attended is missing', () => {
    profileData.value = {}
    const { drupalcons } = useDrupalCons()
    expect(drupalcons.value).toEqual([])
  })

  it('returns empty array when field_events_attended is empty', () => {
    profileData.value = { field_events_attended: [] }
    const { drupalcons } = useDrupalCons()
    expect(drupalcons.value).toEqual([])
  })

  it('returns parsed DrupalCons in reverse (newest first) order', () => {
    profileData.value = {
      field_events_attended: ['london_2011', 'vienna_2017', 'europe_2021'],
    }
    const { drupalcons } = useDrupalCons()
    expect(drupalcons.value).toHaveLength(3)
    expect(drupalcons.value[0]).toEqual({ year: '2021', city: 'Europe' })
    expect(drupalcons.value[2]).toEqual({ year: '2011', city: 'London' })
  })

  it('parses all known event key formats', () => {
    profileData.value = {
      field_events_attended: ['neworleans_2016', 'global_2020', 'barcelona_2015'],
    }
    const { drupalcons } = useDrupalCons()
    const cities = drupalcons.value.map(dc => dc.city)
    expect(cities).toContain('New Orleans')
    expect(cities).toContain('Global')
    expect(cities).toContain('Barcelona')
  })

  it('refreshLive triggers the profile refresh', () => {
    const { refreshLive } = useDrupalCons()
    refreshLive()
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })
})
