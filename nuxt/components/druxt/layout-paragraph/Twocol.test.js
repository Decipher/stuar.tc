import { shallowMount } from '@vue/test-utils'
import Twocol from './Twocol.vue'

jest.mock('druxt-layout-paragraphs', () => ({
  DruxtLayoutParagraphMixin: {},
}))

const mockEntity = {
  attributes: {
    field_title: 'Two Column Section',
  },
}

describe('DruxtLayoutParagraphTwocol', () => {
  const createWrapper = (options = {}) =>
    shallowMount(Twocol, {
      data: () => ({ entity: mockEntity }),
      ...options,
    })

  test('is a Vue instance', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm).toBeTruthy()
  })

  test('renders title from entity field', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('h2').text()).toBe('Two Column Section')
  })

  test('renders named slots', () => {
    const wrapper = shallowMount(Twocol, {
      data: () => ({ entity: mockEntity }),
      slots: {
        top: '<p>Top content</p>',
        first: '<p>First column</p>',
        second: '<p>Second column</p>',
        bottom: '<p>Bottom content</p>',
      },
    })
    expect(wrapper.text()).toContain('Top content')
    expect(wrapper.text()).toContain('First column')
    expect(wrapper.text()).toContain('Second column')
    expect(wrapper.text()).toContain('Bottom content')
  })

  test('has flex wrapper for columns', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.md\\:flex').exists()).toBe(true)
  })

  test('has container with spacing', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.container').exists()).toBe(true)
    expect(wrapper.find('.my-32').exists()).toBe(true)
  })
})
