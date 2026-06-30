import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppSplash from '~/components/AppSplash.vue'

describe('AppSplash', () => {
  it('renders branded boot splash', async () => {
    const wrapper = await mountSuspended(AppSplash)
    expect(wrapper.text()).toContain('stuar.tc')
    expect(wrapper.text()).toContain('booting')
  })
  it('uses fixed positioning', async () => {
    const wrapper = await mountSuspended(AppSplash)
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })
})
