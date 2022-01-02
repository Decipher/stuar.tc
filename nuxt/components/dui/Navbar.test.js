import { mount } from '@vue/test-utils'
import Navbar from './Navbar.vue'

const stubs = ['NuxtLink']

describe('Navbar', () => {
  test('is a Vue instance', () => {
    const props = { title: 'Stuart Clark' }
    const wrapper = mount(Navbar, { props, stubs })
    expect(wrapper.vm).toBeTruthy()

    // Expect HTML to match snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
