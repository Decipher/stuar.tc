import { shallowMount } from '@vue/test-utils'
import Default from './Default.vue'

jest.mock('druxt-entity', () => ({
  DruxtEntityMixin: {},
}))

jest.mock('druxt-layout-paragraphs', () => ({
  DruxtLayoutParagraph: {
    name: 'DruxtLayoutParagraph',
    template: '<div><slot></slot></div>',
    props: ['entity'],
  },
}))

describe('DruxtEntityParagraphSectionDefault', () => {
  test('is a Vue instance', () => {
    const wrapper = shallowMount(Default, {
      data: () => ({ entity: {} }),
      stubs: ['DruxtLayoutParagraph'],
    })
    expect(wrapper.vm).toBeTruthy()
  })

  test('renders DruxtLayoutParagraph', () => {
    const wrapper = shallowMount(Default, {
      data: () => ({ entity: {} }),
      stubs: ['DruxtLayoutParagraph'],
    })
    expect(
      wrapper.findComponent({ name: 'DruxtLayoutParagraph' }).exists()
    ).toBe(true)
  })

  test('delegates to DruxtLayoutParagraph with entity', () => {
    const wrapper = shallowMount(Default, {
      data: () => ({
        entity: { attributes: { field_title: 'Test' }, relationships: {} },
      }),
      stubs: ['DruxtLayoutParagraph'],
    })
    expect(wrapper.find('druxtlayoutparagraph-stub').exists()).toBe(true)
  })
})
