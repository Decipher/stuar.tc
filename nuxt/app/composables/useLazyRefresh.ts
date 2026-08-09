/**
 * Deferred data refresh using IntersectionObserver.
 *
 * Returns a `target` ref to bind to a root element. When the element
 * approaches the viewport (within `rootMargin`), the refresh fires once,
 * then the observer disconnects. Falls back to immediate refresh if
 * IntersectionObserver is unavailable or the element is not bound.
 *
 * @param refresh - Callback to fire when the target enters the viewport.
 * @param options.rootMargin - Pre-fetch margin around the viewport (default '200px').
 * @returns `{ target }` — bind to the element to observe via `ref="target"`.
 */
export function useLazyRefresh(
  refresh: () => void | Promise<void>,
  options: { rootMargin?: string } = {},
) {
  const target = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value || typeof IntersectionObserver === 'undefined') {
      refresh()
      return
    }

    let fired = false
    observer = new IntersectionObserver(
      (entries) => {
        if (fired) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fired = true
            observer!.disconnect()
            observer = null
            refresh()
            break
          }
        }
      },
      { rootMargin: options.rootMargin ?? '200px' },
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { target }
}
