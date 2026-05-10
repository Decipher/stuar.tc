import { shallowMount } from '@vue/test-utils'
import Default from './Default.vue'

jest.mock('druxt-entity', () => ({
  DruxtEntityMixin: {},
}))

describe('DruxtEntityParagraphTextFormattedDefault', () => {
  test('is a Vue instance', () => {
    const wrapper = shallowMount(Default)
    expect(wrapper.vm).toBeTruthy()
  })

  test('renders container with prose class', () => {
    const mockEntity = {
      attributes: {},
      relationships: {},
    }
    const wrapper = shallowMount(Default, {
      propsData: { entity: mockEntity },
    })
    expect(wrapper.find('.prose').exists()).toBe(true)
  })

  test('renders slot content', () => {
    const mockEntity = {
      attributes: {},
      relationships: {},
    }
    const wrapper = shallowMount(Default, {
      propsData: { entity: mockEntity },
      slots: {
        default: '<p>Test content</p>',
      },
    })
    expect(wrapper.text()).toContain('Test content')
  })
})
