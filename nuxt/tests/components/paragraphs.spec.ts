import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { Paragraph } from '~/utils/druxtParagraph'
import AppDruxtParagraph from '~/components/AppDruxtParagraph.vue'
import AppDruxtParagraphCard from '~/components/AppDruxtParagraphCard.vue'
import AppDruxtParagraphCardGroup from '~/components/AppDruxtParagraphCardGroup.vue'
import AppDruxtParagraphCode from '~/components/AppDruxtParagraphCode.vue'
import AppDruxtParagraphJumbotron from '~/components/AppDruxtParagraphJumbotron.vue'
import AppDruxtParagraphLink from '~/components/AppDruxtParagraphLink.vue'
import AppDruxtParagraphMedia from '~/components/AppDruxtParagraphMedia.vue'
import AppDruxtParagraphRepository from '~/components/AppDruxtParagraphRepository.vue'
import AppDruxtParagraphSection from '~/components/AppDruxtParagraphSection.vue'

describe('AppDruxtParagraph', () => {
  it('dispatches to the renderer matching the paragraph type', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraph, {
      props: { paragraph: { type: 'code', code: 'echo hi' } as Paragraph },
    })
    expect(wrapper.text()).toContain('echo hi')
  })

  it('dispatches link paragraphs to the link renderer', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraph, {
      props: { paragraph: { type: 'link', link: { href: '/about', label: 'About' } } as Paragraph },
    })
    expect(wrapper.text()).toContain('About')
  })
})

describe('AppDruxtParagraphCard', () => {
  it('renders as a plain div with a placeholder swatch when there is no image or link', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphCard, {
      props: { paragraph: { type: 'card', description: 'Just text.' } },
    })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('h4').exists()).toBe(false)
    expect(wrapper.text()).toContain('Just text.')
  })

  it('renders an internal NuxtLink with image and title, using a plain arrow', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphCard, {
      props: {
        paragraph: {
          type: 'card',
          title: 'Card title',
          description: 'Description.',
          image: { src: '/img.png', alt: 'alt text', width: 100, height: 80 },
          link: { href: '/internal', label: 'Read more' },
        },
      },
    })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/internal')
    expect(link.attributes('target')).toBeUndefined()
    expect(wrapper.find('img').attributes('src')).toBe('/img.png')
    expect(wrapper.find('h4').text()).toBe('Card title')
    expect(wrapper.text()).toContain('Read more')
    expect(wrapper.text()).toContain('→')
  })

  it('renders an external link with target=_blank and a ↗ arrow', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphCard, {
      props: {
        paragraph: {
          type: 'card',
          description: 'Description.',
          link: { href: 'https://example.com', label: 'Visit' },
        },
      },
    })
    const link = wrapper.find('a')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
    expect(wrapper.text()).toContain('↗')
  })
})

describe('AppDruxtParagraphCardGroup', () => {
  it('renders a card for each entry in paragraph.cards', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphCardGroup, {
      props: {
        paragraph: {
          type: 'card_group',
          cards: [
            { type: 'card', description: 'First card.' },
            { type: 'card', description: 'Second card.' },
          ],
        },
      },
    })
    expect(wrapper.text()).toContain('First card.')
    expect(wrapper.text()).toContain('Second card.')
  })
})

describe('AppDruxtParagraphCode', () => {
  it('passes the code and filename through to SCCodeBlock', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphCode, {
      props: { paragraph: { type: 'code', title: 'example.php', code: '<?php echo 1;' } },
    })
    expect(wrapper.text()).toContain('<?php echo 1;')
    expect(wrapper.text()).toContain('example.php')
  })

  it('renders without a filename when the paragraph has no title', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphCode, {
      props: { paragraph: { type: 'code', code: 'no filename here' } },
    })
    expect(wrapper.text()).toContain('no filename here')
  })
})

describe('AppDruxtParagraphJumbotron', () => {
  it('renders a title and recurses into nested paragraph content', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphJumbotron, {
      props: {
        paragraph: {
          type: 'jumbotron',
          title: 'Heads up',
          content: [{ type: 'code', code: 'nested code' }],
        },
      },
    })
    expect(wrapper.find('h4').text()).toBe('Heads up')
    expect(wrapper.text()).toContain('nested code')
  })

  it('omits the heading when the paragraph has no title', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphJumbotron, {
      props: { paragraph: { type: 'jumbotron', content: [] } },
    })
    expect(wrapper.find('h4').exists()).toBe(false)
  })
})

describe('AppDruxtParagraphLink', () => {
  it('renders an internal link with a plain arrow', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphLink, {
      props: { paragraph: { type: 'link', link: { href: '/writing', label: 'Read the blog' } } },
    })
    expect(wrapper.text()).toContain('Read the blog →')
    expect(wrapper.find('a').attributes('target')).toBeUndefined()
  })

  it('renders an external link with target=_blank and a ↗ arrow', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphLink, {
      props: { paragraph: { type: 'link', link: { href: 'https://github.com/Decipher', label: 'GitHub' } } },
    })
    expect(wrapper.text()).toContain('GitHub ↗')
    expect(wrapper.find('a').attributes('target')).toBe('_blank')
    expect(wrapper.find('a').attributes('rel')).toBe('noopener')
  })
})

describe('AppDruxtParagraphMedia', () => {
  it('passes image fields through to SCImageLightbox', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphMedia, {
      props: {
        paragraph: {
          type: 'media',
          src: '/photo.jpg',
          alt: 'A photo',
          width: 640,
          height: 480,
          caption: 'A caption',
        },
      },
    })
    expect(wrapper.find('img').attributes('src')).toBe('/photo.jpg')
    expect(wrapper.find('img').attributes('alt')).toBe('A photo')
    expect(wrapper.text()).toContain('A caption')
  })
})

describe('AppDruxtParagraphRepository', () => {
  it('renders only the source link for a minimal, non-sponsor-eligible repository', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphRepository, {
      props: {
        paragraph: {
          type: 'repository',
          description: '<p>Some repo.</p>',
          url: 'https://github.com/someone-else/project',
          gitpod: false,
        },
      },
    })
    expect(wrapper.text()).toContain('View source ↗')
    expect(wrapper.text()).not.toContain('Open in Gitpod')
    expect(wrapper.text()).not.toContain('View on Drupal.org')
    expect(wrapper.text()).not.toContain('Sponsor')
    expect(wrapper.html()).toContain('Some repo.')
  })

  it('renders Gitpod, Drupal.org, and Sponsor links when eligible', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphRepository, {
      props: {
        paragraph: {
          type: 'repository',
          description: '<p>Druxt core.</p>',
          url: 'https://github.com/Druxt/druxt',
          gitpod: true,
          drupalUrl: 'https://www.drupal.org/project/druxt',
        },
      },
    })
    expect(wrapper.text()).toContain('Open in Gitpod ↗')
    expect(wrapper.text()).toContain('View on Drupal.org ↗')
    expect(wrapper.text()).toContain('Sponsor ↗')
    const gitpodLink = wrapper.findAll('a').find(a => a.attributes('href')?.startsWith('https://gitpod.io/#'))
    expect(gitpodLink?.attributes('href')).toBe('https://gitpod.io/#https://github.com/Druxt/druxt')
  })

  it('does not offer a sponsor link for a github.com URL outside the eligible owners', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphRepository, {
      props: {
        paragraph: {
          type: 'repository',
          description: '<p>Third party.</p>',
          url: 'https://github.com/some-other-org/thing',
          gitpod: false,
        },
      },
    })
    expect(wrapper.text()).not.toContain('Sponsor')
  })
})

describe('AppDruxtParagraphSection', () => {
  it('renders regions named first/second side by side', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphSection, {
      props: {
        paragraph: {
          type: 'section',
          title: 'Two columns',
          layout: 'layout_twocol',
          regions: {
            first: [{ type: 'code', code: 'left' }],
            second: [{ type: 'code', code: 'right' }],
          },
        },
      },
    })
    expect(wrapper.find('h3').text()).toBe('Two columns')
    expect(wrapper.text()).toContain('left')
    expect(wrapper.text()).toContain('right')
    expect(wrapper.find('.grid').exists()).toBe(true)
  })

  it('flattens non first/second regions into a single stacked column', async () => {
    const wrapper = await mountSuspended(AppDruxtParagraphSection, {
      props: {
        paragraph: {
          type: 'section',
          layout: 'layout_onecol',
          regions: {
            content: [{ type: 'code', code: 'only region' }],
          },
        },
      },
    })
    expect(wrapper.find('h3').exists()).toBe(false)
    expect(wrapper.text()).toContain('only region')
  })
})
