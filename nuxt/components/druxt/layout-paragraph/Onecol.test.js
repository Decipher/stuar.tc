import { shallowMount } from '@vue/test-utils'
import Onecol from './Onecol.vue'

jest.mock('druxt-layout-paragraphs', () => ({
  DruxtLayoutParagraphMixin: {},
}))

const mockEntity = {
  attributes: {
    field_title: 'Single Column Section',
  },
}

describe('DruxtLayoutParagraphOnecol', () => {
  const createWrapper = (options = {}) =>
    shallowMount(Onecol, {
      data: () => ({ entity: mockEntity }),
      ...options,
    })

  test('is a Vue instance', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm).toBeTruthy()
  })

  test('renders title from entity field', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('h2').text()).toBe('Single Column Section')
  })

  test('renders content slot', () => {
    const wrapper = shallowMount(Onecol, {
      data: () => ({ entity: mockEntity }),
      slots: {
        content: '<p>Column content</p>',
      },
    })
    expect(wrapper.text()).toContain('Column content')
  })

  test('has container wrapper with spacing', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.my-32').exists()).toBe(true)
    expect(wrapper.find('.container').exists()).toBe(true)
  })
})
