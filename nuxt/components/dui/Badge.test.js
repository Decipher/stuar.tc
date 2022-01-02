import { mount } from '@vue/test-utils'
import Badge from './Badge.vue'

describe('Badge', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(Badge)
    expect(wrapper.vm).toBeTruthy()

    // Expect HTML to match snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
