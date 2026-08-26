/**
 * Click-to-route behaviour for internal links inside `v-html` content.
 *
 * Article bodies arrive from Drupal as HTML strings and render through
 * `v-html`, so their inline links are plain `<a>` elements that Vue never
 * sees. Left alone, every internal link in a post costs a full document load
 * instead of a router navigation.
 *
 * Rather than rewriting the markup into `<NuxtLink>` components, this
 * intercepts the click and hands same-origin paths to the router. The markup
 * stays exactly as authored, so crawlers, middle-click, and "copy link
 * address" all behave as they did.
 *
 * The approach comes from nuxt-interpolation, which did this for Nuxt 2 and
 * has had no release since 2021. This is a Vue 3 rewrite of the same idea.
 *
 * Kept as a plain factory rather than living in the plugin so it can be
 * tested without a Nuxt runtime: the plugin supplies the real router, the
 * test supplies a spy.
 */
import type { Directive } from 'vue'

interface InterpolatedElement extends HTMLElement {
  _interpolationCleanup?: () => void
}

export function createInterpolationDirective(push: (to: string) => unknown): Directive {
  const onClick = (event: MouseEvent) => {
    // currentTarget is the element the listener was added to, which bind()
    // only ever does for anchors, so no null or non-anchor case exists.
    const anchor = event.currentTarget as HTMLAnchorElement
    const href = anchor.getAttribute('href')

    // Only same-origin paths. Anything absolute, protocol-relative, a mailto
    // or an in-page hash is the browser's job.
    if (!href || !href.startsWith('/') || href.startsWith('//')) return

    // Leave anything that isn't a plain left click to the browser: modifier
    // clicks open tabs and windows, and routing would break that.
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (anchor.hasAttribute('target')) return
    // A download link's default is the download itself, not navigation.
    if (anchor.hasAttribute('download')) return

    event.preventDefault()
    push(href)
  }

  const bind = (el: InterpolatedElement) => {
    const anchors = Array.from(el.getElementsByTagName('a'))
    for (const anchor of anchors) {
      // Browsing-context keywords are case-insensitive, so _BLANK opens a
      // window too. relList deduplicates, since updated() rebinds the same
      // anchors when the subtree has not actually changed.
      if (anchor.target.toLowerCase() === '_blank') {
        anchor.relList.add('noopener')
      }
      anchor.addEventListener('click', onClick)
    }
    el._interpolationCleanup = () => {
      for (const anchor of anchors) anchor.removeEventListener('click', onClick)
    }
  }

  const unbind = (el: InterpolatedElement) => {
    el._interpolationCleanup?.()
    delete el._interpolationCleanup
  }

  return {
    // The directive must be resolvable during SSR or every page using it
    // fails to prerender. It adds no server-rendered attributes; the click
    // handling is client behaviour bound in mounted().
    getSSRProps: () => ({}),
    mounted: el => bind(el as InterpolatedElement),
    // `v-html` replaces the whole subtree, so listeners from the previous
    // render belong to elements that no longer exist. Rebind.
    updated: (el) => {
      unbind(el as InterpolatedElement)
      bind(el as InterpolatedElement)
    },
    beforeUnmount: el => unbind(el as InterpolatedElement),
  }
}
