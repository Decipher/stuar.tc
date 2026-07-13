import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StuartcOgImage from '~/components/OgImage/StuartcOgImage.satori.vue'

describe('StuartcOgImage (Satori template)', () => {
  it('renders the title, eyebrow and URL caption', async () => {
    const wrapper = await mountSuspended(StuartcOgImage, {
      props: { title: 'About', value: 'https://stuar.tc/about', eyebrow: 'about' },
    })
    const html = wrapper.html()
    expect(html).toContain('About')
    expect(html).toContain('// about')
    expect(html).toContain('stuar.tc/about')
    expect(html).toContain('stuar.tc')
  })

  it('renders the QR as a grid of themed cells on the paper canvas', async () => {
    const wrapper = await mountSuspended(StuartcOgImage, {
      props: { title: 'Open source', value: 'https://stuar.tc/open-source', eyebrow: 'open-source' },
    })
    const html = wrapper.html()
    // paper canvas
    expect(html).toContain('#FAF9F7')
    // dark modules use magenta-700, light cells are transparent
    expect(html).toContain('#87104E')
    expect(html).toContain('transparent')
    // magenta wordmark dot + corner dot
    expect(html).toContain('#C21A74')
    // QR grid rows exist
    expect(wrapper.findAll('div').length).toBeGreaterThan(50)
  })

  it('uses a default-sized 1200×630 canvas', async () => {
    const wrapper = await mountSuspended(StuartcOgImage, {
      props: { title: 'Community', value: 'https://stuar.tc/community', eyebrow: 'community' },
    })
    expect(wrapper.html()).toContain('1200px')
    expect(wrapper.html()).toContain('630px')
  })
})
