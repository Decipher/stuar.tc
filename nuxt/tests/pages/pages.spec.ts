import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'
import AboutPage from '~/pages/about.vue'
import OpenSourcePage from '~/pages/open-source.vue'
import UsesPage from '~/pages/uses.vue'
import DrupalGivePage from '~/pages/drupalgive.vue'
import SpeakingPage from '~/pages/speaking.vue'
import PhotosPage from '~/pages/photos.vue'
import StyleguidePage from '~/pages/styleguide.vue'
import { axe } from 'vitest-axe'

describe('Home page', () => {
  it('renders hero with name and eyebrow', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('h1').text()).toContain('Stuart Clark')
    expect(wrapper.text()).toContain('// Hello world.')
  })
  it('renders stats, heartbeat, projects, photography', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).toContain('24+')
    expect(wrapper.text()).toContain('Heartbeat')
    expect(wrapper.text()).toContain('DruxtJS')
    expect(wrapper.text()).toContain('Photography')
  })
  it('does not render writing section', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).not.toContain('Writing')
    expect(wrapper.text()).not.toContain('all posts')
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
})

describe('Open source page', () => {
  it('renders flagship, modules, activity, cons', async () => {
    const wrapper = await mountSuspended(OpenSourcePage)
    expect(wrapper.text()).toContain('DruxtJS')
    expect(wrapper.text()).toContain('Flagship framework')
    expect(wrapper.text()).toContain('Open source packages')
    expect(wrapper.text()).toContain('Recent activity')
    expect(wrapper.text()).toContain('DrupalCon')
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

describe('Speaking page', () => {
  it('renders heading and splash award', async () => {
    const wrapper = await mountSuspended(SpeakingPage)
    expect(wrapper.find('h1').text()).toContain('Talks')
    expect(wrapper.text()).toContain('Splash Award')
  })
  it('renders talks and drupalcons', async () => {
    const wrapper = await mountSuspended(SpeakingPage)
    expect(wrapper.text()).toContain('Selected talks')
    expect(wrapper.text()).toContain('Features 101')
    expect(wrapper.text()).toContain('DrupalCons attended')
    expect(wrapper.text()).toContain('Singapore')
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
