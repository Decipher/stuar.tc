// @vitest-environment happy-dom
// Opted out of the shared `nuxt` environment: the directive is plain DOM
// behaviour and needs no Nuxt runtime, so happy-dom is both enough and
// considerably faster.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createInterpolationDirective } from '../../app/utils/interpolation'

const push = vi.fn()
const interpolation = createInterpolationDirective(push)

const Host = defineComponent({
  props: { html: { type: String, required: true } },
  setup: props => () => h('div', { innerHTML: props.html }),
})

const mountWith = (html: string, { skipMount = false } = {}) => {
  const wrapper = mount(Host, { props: { html }, global: { directives: { interpolation } } })
  // The directive is applied by hand rather than via `v-interpolation` in a
  // template: the host renders raw innerHTML, which is the case under test.
  if (!skipMount) interpolation.mounted?.(wrapper.element as HTMLElement, {} as never, {} as never, null)
  return wrapper
}

const click = (el: Element, init: MouseEventInit = {}) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })
  el.dispatchEvent(event)
  return event
}

describe('v-interpolation', () => {
  beforeEach(() => push.mockClear())

  it('routes an internal link instead of loading the document', () => {
    const w = mountWith('<p><a href="/writing/hello-world-20211126">post</a></p>')
    const event = click(w.element.querySelector('a')!)
    expect(push).toHaveBeenCalledWith('/writing/hello-world-20211126')
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves external links to the browser', () => {
    const w = mountWith('<p><a href="https://www.drupal.org/project/decoupled_settings">d.o</a></p>')
    const event = click(w.element.querySelector('a')!)
    expect(push).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('leaves protocol-relative links to the browser', () => {
    const w = mountWith('<p><a href="//evil.example.com/x">x</a></p>')
    click(w.element.querySelector('a')!)
    expect(push).not.toHaveBeenCalled()
  })

  it('leaves modifier clicks alone so new tabs still open', () => {
    const w = mountWith('<p><a href="/uses">uses</a></p>')
    const event = click(w.element.querySelector('a')!, { metaKey: true })
    expect(push).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('leaves links with an explicit target alone', () => {
    const w = mountWith('<p><a href="/uses" target="_blank">uses</a></p>')
    click(w.element.querySelector('a')!)
    expect(push).not.toHaveBeenCalled()
  })

  it('adds rel="noopener" to target="_blank" links', () => {
    const w = mountWith('<p><a href="/x" target="_blank">x</a></p>')
    expect(w.element.querySelector('a')!.getAttribute('rel')).toBe('noopener')
  })


  it('covers every modifier key, not just meta', () => {
    const w = mountWith('<p><a href="/uses">uses</a></p>')
    for (const key of ['ctrlKey', 'shiftKey', 'altKey'] as const) {
      click(w.element.querySelector('a')!, { [key]: true })
    }
    expect(push).not.toHaveBeenCalled()
  })

  it('leaves non-left clicks and already-handled events alone', () => {
    const w = mountWith('<p><a href="/uses">uses</a></p>')
    click(w.element.querySelector('a')!, { button: 1 })
    const handled = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    handled.preventDefault()
    w.element.querySelector('a')!.dispatchEvent(handled)
    expect(push).not.toHaveBeenCalled()
  })

  it('ignores anchors with no href', () => {
    const w = mountWith('<p><a id="bare">no href</a></p>')
    click(w.element.querySelector('a')!)
    expect(push).not.toHaveBeenCalled()
  })

  it('appends noopener to an existing rel', () => {
    const w = mountWith('<p><a href="/x" target="_blank" rel="nofollow">x</a></p>')
    expect(w.element.querySelector('a')!.getAttribute('rel')).toBe('nofollow noopener')
  })

  it('rebinds on update so replaced subtrees still route', async () => {
    const w = mountWith('<p><a href="/first">first</a></p>')
    await w.setProps({ html: '<p><a href="/second">second</a></p>' })
    interpolation.updated?.(w.element as HTMLElement, {} as never, {} as never, {} as never)
    click(w.element.querySelector('a')!)
    expect(push).toHaveBeenCalledWith('/second')
  })

  it('unbinding an element that was never bound is a no-op', () => {
    const w = mountWith('<p><a href="/uses">uses</a></p>', { skipMount: true })
    expect(() => interpolation.beforeUnmount?.(w.element as HTMLElement, {} as never, {} as never, null)).not.toThrow()
  })

  it('renders no SSR props, so prerendering resolves the directive', () => {
    expect((interpolation as { getSSRProps?: () => object }).getSSRProps?.()).toEqual({})
  })

  it('leaves download links to the browser', () => {
    const w = mountWith('<p><a href="/files/report.pdf" download>report</a></p>')
    const event = click(w.element.querySelector('a')!)
    expect(push).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('hardens target="_BLANK" too, without duplicating noopener on rebind', () => {
    const w = mountWith('<p><a href="/x" target="_BLANK" rel="nofollow">x</a></p>')
    interpolation.updated?.(w.element as HTMLElement, {} as never, {} as never, {} as never)
    expect(w.element.querySelector('a')!.getAttribute('rel')).toBe('nofollow noopener')
  })

  it('stops routing once unbound', () => {
    const w = mountWith('<p><a href="/uses">uses</a></p>')
    interpolation.beforeUnmount?.(w.element as HTMLElement, {} as never, {} as never, null)
    click(w.element.querySelector('a')!)
    expect(push).not.toHaveBeenCalled()
  })
})
