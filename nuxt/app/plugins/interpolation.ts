/**
 * Registers `v-interpolation`, which makes internal links inside `v-html`
 * content navigate through the router instead of reloading the document.
 *
 * See app/utils/interpolation.ts for the behaviour and why it exists.
 *
 * Registered on both server and client: SSR must be able to resolve the
 * directive to prerender the pages that carry it (getSSRProps renders
 * nothing), and the click handling only binds in mounted(), which never
 * runs on the server.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  nuxtApp.vueApp.directive(
    'interpolation',
    // Bound method rather than a lambda: identical call semantics, and no
    // wrapper function that only a real click could ever execute.
    createInterpolationDirective(router.push.bind(router)),
  )
})
