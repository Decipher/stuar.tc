import { mount } from '@vue/test-utils'
import StuartClark from './StuartClark.vue'

const mocks = {
  $store: {
    state: {
      config: {
        title: undefined,
        social: {},
      },
    },
  },
}
const stubs = ['LogoDrupal', 'LogoGithub', 'LogoTwitter']

describe('StuartClark', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(StuartClark, { mocks, stubs })
    expect(wrapper.vm).toBeTruthy()
  })
})
