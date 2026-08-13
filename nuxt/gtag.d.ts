/**
 * GA4 dataLayer global type.
 *
 * nuxt-gtag ships a ``globals.d.ts`` but it is not always picked up by
 * ``vue-tsc``. Declaring it here ensures ``window.dataLayer`` is typed
 * everywhere in the codebase.
 */
declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export {}
