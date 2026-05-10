import { shallowMount } from '@vue/test-utils'
import Index from './index.vue'

jest.mock('druxt-entity', () => ({
  DruxtEntity: { template: '<div><slot></slot></div>' },
  DruxtView: { template: '<div><slot></slot></div>' },
}))

const stubs = ['DruxtEntity', 'DruxtView']

describe('PagesArticlesIndex', () => {
  test('is a Vue instance', () => {
    const wrapper = shallowMount(Index, { stubs })
    expect(wrapper.vm).toBeTruthy()
  })

  test('renders page title', () => {
    const wrapper = shallowMount(Index, { stubs })
    expect(wrapper.text()).toContain('Latest')
  })
})