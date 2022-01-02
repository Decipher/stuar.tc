import { mount } from '@vue/test-utils'
import Card from './Card.vue'

const stubs = ['NuxtLink']

describe('Card', () => {
  test('is a Vue instance', () => {
    const props = {
      title: 'test',
      to: '/',
    }
    const wrapper = mount(Card, { props, stubs })
    expect(wrapper.vm).toBeTruthy()

    // Expect HTML to match snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
