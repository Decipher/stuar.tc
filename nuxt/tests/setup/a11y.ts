import * as matchers from 'vitest-axe/matchers'
import { expect, vi } from 'vitest'
import 'vitest-axe/extend-expect'

expect.extend(matchers)

// nuxt-og-image's `defineOgImage` is a build-time macro: it's tree-shaken on
// the client and replaced by a Vite transform that doesn't run in the vitest
// `nuxt` environment. Stub it as a no-op (the real work happens during SSR /
// prerender via server plugins, not at runtime).
vi.stubGlobal('defineOgImage', () => {})
