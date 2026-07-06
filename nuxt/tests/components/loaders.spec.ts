import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Activity } from '~/data/activity'
import type { Module } from '~/data/modules'
import type { Stat } from '~/data/stats'
import type { DrupalCon } from '~/data/drupalcons'
import type { NpmModule } from '~/composables/useNpmPackages'
import AppSplash from '~/components/AppSplash.vue'
import AppActivityFeed from '~/components/AppActivityFeed.vue'
import AppModuleList from '~/components/AppModuleList.vue'
import AppContributionHeatmap from '~/components/AppContributionHeatmap.vue'
import AppStatBand from '~/components/AppStatBand.vue'
import AppDrupalConList from '~/components/AppDrupalConList.vue'
import AppFlagshipDruxt from '~/components/AppFlagshipDruxt.vue'

const activityData = ref<Activity[]>([])
const modulesData = ref<Module[]>([])
const totalCountData = ref<number>(0)
const coMaintainedData = ref<Module[]>([])
const npmPackagesData = ref<NpmModule[]>([])
const cellsData = ref<number[]>([])
const statsData = ref<Stat[]>([])
const drupalConsData = ref<DrupalCon[]>([])

mockNuxtImport('useActivity', () => () => ({ activity: activityData }))
mockNuxtImport('useModules', () => () => ({ modules: modulesData, totalCount: totalCountData }))
mockNuxtImport('useCoMaintainedModules', () => () => ({ modules: coMaintainedData }))
mockNuxtImport('useNpmPackages', () => () => ({ packages: npmPackagesData }))
mockNuxtImport('useContributions', () => () => ({ cells: cellsData }))
mockNuxtImport('useStats', () => () => ({ stats: statsData }))
mockNuxtImport('useDrupalCons', () => () => ({ drupalcons: drupalConsData }))

describe('AppSplash', () => {
  it('renders branded boot splash', async () => {
    const wrapper = await mountSuspended(AppSplash)
    expect(wrapper.text()).toContain('stuar.tc')
    expect(wrapper.text()).toContain('booting')
  })
  it('uses fixed positioning', async () => {
    const wrapper = await mountSuspended(AppSplash)
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })
})

describe('AppActivityFeed', () => {
  beforeEach(() => { activityData.value = [] })

  it('renders activity rows with fallback data', async () => {
    const wrapper = await mountSuspended(AppActivityFeed)
    expect(wrapper.findAllComponents({ name: 'SCActivityRow' }).length).toBeGreaterThan(0)
  })

  it('renders live activity rows when data is available', async () => {
    activityData.value = [
      { when: '1h', repo: 'druxt/druxt', action: 'pushed 3 commits', href: 'https://github.com/druxt/druxt' },
    ]
    const wrapper = await mountSuspended(AppActivityFeed)
    expect(wrapper.findAllComponents({ name: 'SCActivityRow' }).length).toBe(1)
  })
})

describe('AppModuleList', () => {
  beforeEach(() => {
    modulesData.value = []
    totalCountData.value = 0
    coMaintainedData.value = []
    npmPackagesData.value = []
  })

  it('renders module rows with fallback Drupal data', async () => {
    const wrapper = await mountSuspended(AppModuleList)
    expect(wrapper.findAllComponents({ name: 'SCModuleRow' }).length).toBeGreaterThan(0)
  })

  it('renders live Drupal module rows with profile link footer', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    expect(wrapper.findAllComponents({ name: 'SCModuleRow' }).length).toBe(1)
    expect(wrapper.text()).toContain('drupal.org')
    expect(wrapper.text()).toContain('github')
    expect(wrapper.text()).toContain('npm')
  })

  it('renders npm packages when available', async () => {
    npmPackagesData.value = [
      { name: 'druxt', machine: 'druxt', installs: '2,968/mo', percent: 100, href: 'https://www.npmjs.com/package/druxt', sortKey: 2968 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    expect(wrapper.findAllComponents({ name: 'SCModuleRow' }).length).toBeGreaterThan(1)
  })

  it('filters to npm only when npm filter is active', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
    ]
    npmPackagesData.value = [
      { name: 'druxt', machine: 'druxt', installs: '2,968/mo', percent: 100, href: 'https://www.npmjs.com/package/druxt', sortKey: 2968 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    const npmBtn = wrapper.findAll('button').find(b => b.text() === 'npm')
    await npmBtn!.trigger('click')
    expect(wrapper.findAllComponents({ name: 'SCModuleRow' }).length).toBe(1)
    expect(wrapper.text()).toContain('druxt')
    expect(wrapper.text()).not.toContain('File (Field) Paths')
  })

  it('filters to drupal only when drupal filter is active', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
    ]
    npmPackagesData.value = [
      { name: 'druxt', machine: 'druxt', installs: '2,968/mo', percent: 100, href: 'https://www.npmjs.com/package/druxt', sortKey: 2968 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    const drupalBtn = wrapper.findAll('button').find(b => b.text() === 'drupal')
    await drupalBtn!.trigger('click')
    expect(wrapper.findAllComponents({ name: 'SCModuleRow' }).length).toBe(1)
    expect(wrapper.text()).toContain('File (Field) Paths')
    expect(wrapper.text()).not.toContain('druxt')
  })

  it('filters to co-maint only when co-maint filter is active', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
    ]
    coMaintainedData.value = [
      { name: 'Decoupled Router', machine: 'decoupled_router', installs: '8,773', percent: 100, sortKey: 8773 },
    ]
    npmPackagesData.value = [
      { name: 'druxt', machine: 'druxt', installs: '2,968/mo', percent: 100, href: 'https://www.npmjs.com/package/druxt', sortKey: 2968 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    const coBtn = wrapper.findAll('button').find(b => b.text() === 'co-maint')
    await coBtn!.trigger('click')
    expect(wrapper.findAllComponents({ name: 'SCModuleRow' }).length).toBe(1)
    expect(wrapper.text()).toContain('Decoupled Router')
    expect(wrapper.text()).not.toContain('File (Field) Paths')
    expect(wrapper.text()).not.toContain('druxt')
  })

  it('shows co-maintained modules in all filter', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
    ]
    coMaintainedData.value = [
      { name: 'Decoupled Router', machine: 'decoupled_router', installs: '8,773', percent: 100, sortKey: 8773 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    const rows = wrapper.findAllComponents({ name: 'SCModuleRow' })
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('File (Field) Paths')
    expect(wrapper.text()).toContain('Decoupled Router')
  })

  it('blends all types sorted by sortKey in all filter', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
    ]
    coMaintainedData.value = [
      { name: 'Decoupled Router', machine: 'decoupled_router', installs: '8,773', percent: 100, sortKey: 8773 },
    ]
    npmPackagesData.value = [
      { name: 'druxt', machine: 'druxt', installs: '50,000', percent: 100, href: 'https://www.npmjs.com/package/druxt', sortKey: 50000 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    const text = wrapper.text()
    const druxtPos = text.indexOf('druxt')
    const ffpPos = text.indexOf('File (Field) Paths')
    const drPos = text.indexOf('Decoupled Router')
    // druxt (50k) should appear before File (Field) Paths (30k) before Decoupled Router (8k)
    expect(druxtPos).toBeLessThan(ffpPos)
    expect(ffpPos).toBeLessThan(drPos)
  })

  it('filters out items with fewer than 100 installs/downloads across all types', async () => {
    modulesData.value = [
      { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
      { name: 'Tiny Module', machine: 'tiny_module', installs: '50', percent: 1, sortKey: 50 },
    ]
    npmPackagesData.value = [
      { name: 'druxt', machine: 'druxt', installs: '2,968/mo', percent: 100, href: 'https://www.npmjs.com/package/druxt', sortKey: 2968 },
      { name: 'micro-pkg', machine: 'micro-pkg', installs: '0/mo', percent: 0, href: 'https://www.npmjs.com/package/micro-pkg', sortKey: 0 },
    ]
    const wrapper = await mountSuspended(AppModuleList)
    expect(wrapper.text()).toContain('File (Field) Paths')
    expect(wrapper.text()).toContain('druxt')
    expect(wrapper.text()).not.toContain('Tiny Module')
    expect(wrapper.text()).not.toContain('micro-pkg')
  })
})

describe('AppContributionHeatmap', () => {
  beforeEach(() => { cellsData.value = [] })

  it('renders heatmap with PRNG fallback when no live cells', async () => {
    const wrapper = await mountSuspended(AppContributionHeatmap)
    expect(wrapper.findComponent({ name: 'SCContributionHeatmap' }).exists()).toBe(true)
  })

  it('passes live cells to heatmap when available', async () => {
    cellsData.value = Array.from({ length: 18 * 7 }, (_, i) => i % 4)
    const wrapper = await mountSuspended(AppContributionHeatmap)
    expect(wrapper.findComponent({ name: 'SCContributionHeatmap' }).exists()).toBe(true)
  })
})

describe('AppStatBand', () => {
  it('renders stat band', async () => {
    statsData.value = [{ value: '99', label: 'test stat' }]
    const wrapper = await mountSuspended(AppStatBand)
    expect(wrapper.findComponent({ name: 'SCStatBand' }).exists()).toBe(true)
  })
})

describe('AppDrupalConList', () => {
  beforeEach(() => { drupalConsData.value = [] })

  it('renders DrupalCon cards with fallback data', async () => {
    const wrapper = await mountSuspended(AppDrupalConList)
    expect(wrapper.findAllComponents({ name: 'SCDrupalConCard' }).length).toBeGreaterThan(0)
  })

  it('renders live DrupalCon cards when data is available', async () => {
    drupalConsData.value = [{ year: '2021', city: 'Europe' }]
    const wrapper = await mountSuspended(AppDrupalConList)
    expect(wrapper.findAllComponents({ name: 'SCDrupalConCard' }).length).toBe(1)
  })
})

describe('AppFlagshipDruxt', () => {
  it('renders DruxtJS flagship card with key content', async () => {
    const wrapper = await mountSuspended(AppFlagshipDruxt)
    expect(wrapper.text()).toContain('DruxtJS')
    expect(wrapper.text()).toContain('Flagship framework')
    expect(wrapper.text()).toContain('Splash Award')
  })
})
