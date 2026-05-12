import { shallowMount } from '@vue/test-utils'
import Image from './Image.vue'

jest.mock('druxt-entity', () => ({
  DruxtFieldMixin: {},
}))

const stubs = ['DruxtEntity', 'NuxtImg']

const mocks = {
  $druxt: {
    settings: {
      baseUrl: 'http://stuartclark.ddev.site',
    },
  },
}

describe('DruxtFieldImage', () => {
  test('is a Vue instance', () => {
    const wrapper = shallowMount(Image, {
      stubs,
      mocks,
      data: () => ({
        model: { data: { id: 'test-uuid' } },
      }),
    })
    expect(wrapper.vm).toBeTruthy()
  })

  test('src() method constructs correct URL', () => {
    const wrapper = shallowMount(Image, {
      stubs,
      mocks,
      data: () => ({
        model: { data: { id: 'test-uuid' } },
      }),
    })
    const entity = {
      attributes: {
        uri: { url: '/sites/default/files/2022-01/test.png' },
      },
    }
    expect(wrapper.vm.src(entity)).toBe(
      'http://stuartclark.ddev.site/sites/default/files/2022-01/test.png'
    )
  })

  test('renders with model data', () => {
    const wrapper = shallowMount(Image, {
      stubs,
      mocks,
      data: () => ({
        model: { data: { id: 'file-uuid-123' } },
      }),
    })
    expect(wrapper.vm).toBeTruthy()
    expect(wrapper.vm.model.data.id).toBe('file-uuid-123')
  })
})
