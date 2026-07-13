import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ErrorPage from '~/error.vue'

describe('Error page — 404', () => {
  it('renders 404 copy and eyebrow', async () => {
    const wrapper = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 404, statusMessage: 'Not Found' } },
    })
    expect(wrapper.text()).toContain('// 404')
    expect(wrapper.text()).toContain("This page doesn't resolve.")
    expect(wrapper.text()).toContain('Either way, home is a safer bet.')
  })

  it('links back to home', async () => {
    const wrapper = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 404, statusMessage: 'Not Found' } },
    })
    const homeLink = wrapper.findAll('a').find(a => a.text().includes('Back to home'))
    expect(homeLink?.attributes('href')).toBe('/')
  })

  it('hides the decorative numeral from assistive tech', async () => {
    const wrapper = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 404, statusMessage: 'Not Found' } },
    })
    const numeral = wrapper.find('[data-testid="error-numeral"]')
    expect(numeral.attributes('aria-hidden')).toBe('true')
    expect(numeral.text()).toBe('404')
  })
})

describe('Error page — 500', () => {
  it('renders generic 500 copy, no technical details', async () => {
    const wrapper = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 500, statusMessage: 'Internal Server Error' } },
    })
    expect(wrapper.text()).toContain('// 500')
    expect(wrapper.text()).toContain('Something broke on our end.')
    expect(wrapper.text()).toContain('Not a you problem.')
    expect(wrapper.text()).not.toContain('Internal Server Error')
    expect(wrapper.text()).not.toContain('statusCode')
  })

  it('still offers a single link back home', async () => {
    const wrapper = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 500, statusMessage: 'Internal Server Error' } },
    })
    expect(wrapper.findAll('a').filter(a => a.text().includes('Back to home')).length).toBe(1)
  })
})
