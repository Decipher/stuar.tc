import { mount } from '@vue/test-utils'
import StuartClark from './StuartClark.vue'

const mocks = {
  $druxtConfigPages: {
    get: jest.fn(() => ({
      social_drupal: 'Deciphered',
      social_github: 'Decipher',
      social_twitter: 'Decipher',
    })),
  },
}
const stubs = ['LogoDrupal', 'LogoGithub', 'LogoTwitter']

describe('StuartClark', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(StuartClark, { mocks, stubs })
    expect(wrapper.vm).toBeTruthy()

    // Expect HTML to match snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
