import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(Button)
    expect(wrapper.vm).toBeTruthy()

    // Expect HTML to match snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
