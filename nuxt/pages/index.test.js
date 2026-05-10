import { shallowMount } from '@vue/test-utils'
import Index from './index.vue'

jest.mock('druxt-entity', () => ({
  DruxtEntity: { template: '<div><slot></slot></div>' },
  DruxtView: { template: '<div><slot></slot></div>' },
}))

const stubs = ['DruxtEntity', 'DruxtView']

describe('PagesIndex', () => {
  test('is a Vue instance', () => {
    const wrapper = shallowMount(Index, { stubs })
    expect(wrapper.vm).toBeTruthy()
  })

  test('has helloWorld data', () => {
    const wrapper = shallowMount(Index, { stubs })
    expect(wrapper.vm.helloWorld).toBeDefined()
  })

  test('renders Latest heading', () => {
    const wrapper = shallowMount(Index, { stubs })
    expect(wrapper.text()).toContain('Latest')
  })
})