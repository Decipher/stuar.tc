import { mount } from '@vue/test-utils'
import Hero from './Hero.vue'

describe('Hero', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(Hero)
    expect(wrapper.vm).toBeTruthy()

    // Expect HTML to match snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
