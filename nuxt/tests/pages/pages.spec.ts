import { describe, it, expect } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'
import AboutPage from '~/pages/about.vue'
import OpenSourcePage from '~/pages/open-source.vue'
import UsesPage from '~/disabled-pages/uses.vue'
import DrupalGivePage from '~/disabled-pages/drupalgive.vue'
import CommunityPage from '~/pages/community.vue'
import PhotosPage from '~/disabled-pages/photos.vue'
import StyleguidePage from '~/disabled-pages/styleguide.vue'
import { axe } from 'vitest-axe'

const mockLatestArticles = [
  { path: '/writing/test', date: '2022-04-12', title: 'Test post', description: 'A test.', readingTime: '5 min', categories: ['Druxt'] },
  { path: '/writing/hello-world', date: '2021-11-26', title: 'Hello world', readingTime: '3 min', categories: ['Druxt'] },
]

mockNuxtImport('queryCollection', () => {
  return () => ({
    order: () => ({
      limit: () => ({
        all: async () => mockLatestArticles,
      }),
    }),
  })
})

describe('Home page', () => {
  it('renders hero with name and eyebrow', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('h1').text()).toContain('Stuart Clark')
    expect(wrapper.text()).toContain('// Hello world.')
  })
  it('renders stats, heartbeat, projects', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).toContain('24+')
    expect(wrapper.text()).toContain('Heartbeat')
    expect(wrapper.text()).toContain('DruxtJS')
    // photography teaser disabled for first launch
    // expect(wrapper.text()).toContain('Photography')
  })
  it('renders the latest-posts section with a featured and compact post', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).toContain('From the blog')
    expect(wrapper.text()).toContain('all posts →')
    expect(wrapper.text()).toContain('Test post')
    expect(wrapper.text()).toContain('Hello world')
  })
})

describe('About page', () => {
  it('renders heading and bio', async () => {
    const wrapper = await mountSuspended(AboutPage)
    expect(wrapper.find('h1').text()).toContain('Stuart Clark')
    expect(wrapper.text()).toContain('Ballarat')
    expect(wrapper.text()).toContain('DruxtJS')
  })
  it('renders expertise and elsewhere sections', async () => {
    const wrapper = await mountSuspended(AboutPage)
    expect(wrapper.text()).toContain('Expertise')
    expect(wrapper.text()).toContain('Decoupled Drupal')
    expect(wrapper.text()).toContain('Elsewhere')
    expect(wrapper.text()).toContain('drupal.org')
  })
  it('renders File (Field) Paths install count from data', async () => {
    const wrapper = await mountSuspended(AboutPage)
    expect(wrapper.text()).toContain('sites run File (Field) Paths')
    // Falls back to static stats when the Drupal API is unavailable in tests
    expect(wrapper.text()).toContain('29,589+ sites')
  })
  it('renders Get in touch button that opens the contact modal', async () => {
    const wrapper = await mountSuspended(AboutPage)
    const btn = wrapper.findAll('button').find(b => b.text().includes('Get in touch'))
    expect(btn).toBeTruthy()
    await btn?.trigger('click')
    expect(useContactModal().value).toBe(true)
  })
})

describe('Open source page', () => {
  it('renders flagship, modules, activity, ecosystem', async () => {
    const wrapper = await mountSuspended(OpenSourcePage)
    expect(wrapper.text()).toContain('DruxtJS')
    expect(wrapper.text()).toContain('Flagship framework')
    expect(wrapper.text()).toContain('Open source packages')
    expect(wrapper.text()).toContain('Recent activity')
  })
  it('does not render community section (moved to /community)', async () => {
    const wrapper = await mountSuspended(OpenSourcePage)
    expect(wrapper.text()).not.toContain('DrupalCon & community')
    expect(wrapper.text()).not.toContain('DrupalCons attended')
  })
})

describe('Uses page', () => {
  it('renders use groups', async () => {
    const wrapper = await mountSuspended(UsesPage)
    expect(wrapper.text()).toContain('Editor')
    expect(wrapper.text()).toContain('VS Code')
    expect(wrapper.text()).toContain('DDEV')
  })
})

describe('DrupalGive page', () => {
  it('renders maintained projects and cons', async () => {
    const wrapper = await mountSuspended(DrupalGivePage)
    expect(wrapper.text()).toContain('Maintaining')
    expect(wrapper.text()).toContain('File (Field) Paths')
    expect(wrapper.text()).toContain('DrupalCons')
  })
})

describe('Community page', () => {
  it('renders heading and splash award', async () => {
    const wrapper = await mountSuspended(CommunityPage)
    expect(wrapper.find('h1').text()).toContain('Speaking')
    expect(wrapper.text()).toContain('Splash Award')
    expect(wrapper.text()).toContain('2024')
  })
  it('renders talks and drupalcons', async () => {
    const wrapper = await mountSuspended(CommunityPage)
    expect(wrapper.text()).toContain('Talks')
    expect(wrapper.text()).toContain('Features 101')
    expect(wrapper.text()).toContain('DrupalCons attended')
    expect(wrapper.text()).toContain('Organising & training')
  })
  it('renders organiser roles from community data', async () => {
    const wrapper = await mountSuspended(CommunityPage)
    expect(wrapper.text()).toContain('DrupalCamp Melbourne')
    expect(wrapper.text()).toContain('Drupal Melbourne meetup')
  })
})

describe('Photos page', () => {
  it('renders heading and gallery', async () => {
    const wrapper = await mountSuspended(PhotosPage)
    expect(wrapper.find('h1').text()).toContain('Photography')
  })
})

describe('Styleguide page', () => {
  it('renders component showcase', async () => {
    const wrapper = await mountSuspended(StyleguidePage)
    expect(wrapper.text()).toContain('component library')
  })
})

describe('Home page accessibility', () => {
  it('has no axe violations', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const results = await axe(wrapper.element as HTMLElement, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})
