import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { axe } from 'vitest-axe'
import AppSplashAward from '~/components/AppSplashAward.vue'
import AppTalksList from '~/components/AppTalksList.vue'
import AppOrganizerRoles from '~/components/AppOrganizerRoles.vue'
import { talks } from '~/data/talks'
import { organizerRoles } from '~/data/community'

describe('AppSplashAward', () => {
  it('renders the Splash Award recognition card', async () => {
    const wrapper = await mountSuspended(AppSplashAward)
    expect(wrapper.text()).toContain('Open Source Splash Award')
    expect(wrapper.text()).toContain('DruxtJS')
  })

  it('disambiguates awarded vs attended', async () => {
    const wrapper = await mountSuspended(AppSplashAward)
    expect(wrapper.text()).toContain('DrupalCon Singapore')
    expect(wrapper.text()).toContain('2024')
    expect(wrapper.text()).toContain('awarded · not attended')
  })

  it('uses gold accent classes', async () => {
    const wrapper = await mountSuspended(AppSplashAward)
    expect(wrapper.html()).toContain('gold-500')
    expect(wrapper.html()).toContain('gold-400')
  })

  it('has no axe violations', async () => {
    const wrapper = await mountSuspended(AppSplashAward)
    const results = await axe(wrapper.element as HTMLElement, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})

describe('AppTalksList', () => {
  it('renders a card for every talk in talks.ts', async () => {
    const wrapper = await mountSuspended(AppTalksList)
    for (const t of talks) {
      expect(wrapper.text()).toContain(t.title)
      expect(wrapper.text()).toContain(t.event)
    }
  })

  it('renders talk tags', async () => {
    const wrapper = await mountSuspended(AppTalksList)
    expect(wrapper.text()).toContain('Drupal')
    expect(wrapper.text()).toContain('Druxt')
  })

  it('does not render confidence or evidence fields', async () => {
    const wrapper = await mountSuspended(AppTalksList)
    expect(wrapper.text()).not.toContain('confidence')
    expect(wrapper.text()).not.toContain('evidence')
    expect(wrapper.text()).not.toContain('bichon')
  })

  it('has no axe violations', async () => {
    const wrapper = await mountSuspended(AppTalksList)
    const results = await axe(wrapper.element as HTMLElement, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})

describe('AppOrganizerRoles', () => {
  it('renders every organizer role from community.ts', async () => {
    const wrapper = await mountSuspended(AppOrganizerRoles)
    for (const o of organizerRoles) {
      expect(wrapper.text()).toContain(o.event)
      expect(wrapper.text()).toContain(o.role)
    }
  })

  it('renders periods in mono font', async () => {
    const wrapper = await mountSuspended(AppOrganizerRoles)
    expect(wrapper.text()).toContain('Jan 2011 – Apr 2012')
    expect(wrapper.text()).toContain('2011 – present')
  })

  it('does not render evidence fields', async () => {
    const wrapper = await mountSuspended(AppOrganizerRoles)
    expect(wrapper.text()).not.toContain('evidence')
    expect(wrapper.text()).not.toContain('bichon')
  })

  it('has no axe violations', async () => {
    const wrapper = await mountSuspended(AppOrganizerRoles)
    const results = await axe(wrapper.element as HTMLElement, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})
