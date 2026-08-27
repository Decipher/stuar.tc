import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppOSSProfiles from '~/components/AppOSSProfiles.vue'

const refreshSpy = vi.fn()

mockNuxtImport('useOSSProfiles', () => () => ({
  githubStat: ref('40 repos · 480 ★'),
  drupalStat: ref('170 modules · 3.8k ★'),
  npmStat: ref('25 packages'),
  refreshLive: refreshSpy,
}))

mockNuxtImport('useLazyRefresh', () => () => ({
  target: ref(null),
}))

describe('AppOSSProfiles', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('renders profile stats from useOSSProfiles', async () => {
    const wrapper = await mountSuspended(AppOSSProfiles)
    expect(wrapper.text()).toContain('GitHub')
    expect(wrapper.text()).toContain('@Decipher')
    expect(wrapper.text()).toContain('40 repos · 480 ★')
    expect(wrapper.text()).toContain('Drupal.org')
    expect(wrapper.text()).toContain('170 modules · 3.8k ★')
    expect(wrapper.text()).toContain('npm')
    expect(wrapper.text()).toContain('25 packages')
  })

  it('passes the sponsor URL with UTM params to the sponsor link', async () => {
    const wrapper = await mountSuspended(AppOSSProfiles)
    const sponsorLink = wrapper
      .findAll('a')
      .find(a => a.attributes('href')?.includes('sponsors/Decipher'))
    expect(sponsorLink).toBeTruthy()
    const href = sponsorLink!.attributes('href')!
    expect(href).toContain('utm_source=stuar.tc')
    expect(href).toContain('utm_medium=web')
    expect(href).toContain('utm_campaign=sponsor')
    expect(href).toContain('utm_content=open-source')
  })

  it('sponsor button click dispatches tracking without touching dataLayer', async () => {
    const wrapper = await mountSuspended(AppOSSProfiles)
    const sponsorButton = wrapper
      .findAll('a')
      .find(a => a.text().includes('GitHub Sponsors'))
    expect(sponsorButton).toBeTruthy()
    await sponsorButton!.trigger('click')
    // Writing to the queue directly is the regression: gtag.js ignores array
    // literals, so the event silently never reaches GA4. Dispatch has to go
    // through nuxt-gtag — see tests/composables/useSponsorTracking.spec.ts.
    expect(window.dataLayer).toHaveLength(0)
  })
})
