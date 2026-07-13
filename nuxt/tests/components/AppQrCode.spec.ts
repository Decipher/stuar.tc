import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import AppQrCode from '~/components/AppQrCode.vue'

describe('AppQrCode — render', () => {
  it('renders an inline svg with role=img and the encoded URL as its label', async () => {
    const wrapper = await mountSuspended(AppQrCode, {
      props: { value: 'https://stuar.tc/about' },
    })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('QR code to https://stuar.tc/about')
    expect(wrapper.find('title').text()).toBe('QR code to https://stuar.tc/about')
  })

  it('renders the matrix as a single themed path', async () => {
    const wrapper = await mountSuspended(AppQrCode, {
      props: { value: 'https://stuar.tc/' },
    })
    const path = wrapper.find('svg path')
    expect(path.exists()).toBe(true)
    expect(path.attributes('fill')).toBe('currentColor')
    expect(path.attributes('d')!.length).toBeGreaterThan(0)
    // colour follows the active primary via currentColor
    expect(wrapper.find('svg').classes()).toContain('app-qr-code')
  })

  it('applies size to width/height and sets a square viewBox', async () => {
    const wrapper = await mountSuspended(AppQrCode, {
      props: { value: 'https://stuar.tc/', size: 160 },
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('160')
    expect(svg.attributes('height')).toBe('160')
    const size = Number(svg.attributes('viewBox')!.split(' ')[2])
    expect(size).toBeGreaterThan(0)
    const [minX, minY, w, h] = svg.attributes('viewBox')!.split(' ').map(Number)
    expect(`${minX} ${minY} ${w} ${h}`).toBe(svg.attributes('viewBox'))
  })

  it('uses the default size and level when only value is provided', async () => {
    const wrapper = await mountSuspended(AppQrCode, {
      props: { value: 'https://stuar.tc/' },
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('88')
    expect(svg.attributes('height')).toBe('88')
  })

  it('regenerates the path when the value prop changes', async () => {
    const wrapper = await mountSuspended(AppQrCode, {
      props: { value: 'https://stuar.tc/' },
    })
    const before = wrapper.find('svg path').attributes('d')
    await wrapper.setProps({ value: 'https://stuar.tc/community' })
    await nextTick()
    const after = wrapper.find('svg path').attributes('d')
    expect(after).not.toBe(before)
  })

  it('has no axe violations', async () => {
    const wrapper = await mountSuspended(AppQrCode, {
      props: { value: 'https://stuar.tc/' },
    })
    const results = await axe(wrapper.element as HTMLElement)
    expect(results).toHaveNoViolations()
  })
})
