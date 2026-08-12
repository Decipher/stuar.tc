import { describe, it, expect } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

let mockRequestUrl: { hostname: string, origin: string } = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
let mockRoutePath = '/about'

mockNuxtImport('useRequestURL', () => () => mockRequestUrl)
mockNuxtImport('useRoute', () => () => ({ path: mockRoutePath }))

describe('useShareUrl', () => {
  it('uses the request origin for a real host', async () => {
    mockRequestUrl = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl().value).toBe('https://stuar.tc/about')
  })

  it('uses the request origin for a Cloudflare tunnel host', async () => {
    mockRequestUrl = { hostname: 'random-words.trycloudflare.com', origin: 'https://random-words.trycloudflare.com' }
    mockRoutePath = '/writing/hello-world'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl().value).toBe('https://random-words.trycloudflare.com/writing/hello-world')
  })

  it('falls back to the production origin for a "localhost" request', async () => {
    mockRequestUrl = { hostname: 'localhost', origin: 'http://localhost:3000' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl().value).toBe('https://stuar.tc/about')
  })

  it('falls back to the production origin for a "127.0.0.1" request', async () => {
    mockRequestUrl = { hostname: '127.0.0.1', origin: 'http://127.0.0.1:3000' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl().value).toBe('https://stuar.tc/about')
  })

  it('falls back to "/" when the route path is empty', async () => {
    mockRequestUrl = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
    mockRoutePath = ''
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl().value).toBe('https://stuar.tc/')
  })
})

describe('useShareUrl with forQr option', () => {
  it('prefixes the path with /q for a real host', async () => {
    mockRequestUrl = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl({ forQr: true }).value).toBe('https://stuar.tc/q/about')
  })

  it('prefixes the path with /q for a Cloudflare tunnel host', async () => {
    mockRequestUrl = { hostname: 'random-words.trycloudflare.com', origin: 'https://random-words.trycloudflare.com' }
    mockRoutePath = '/writing/hello-world'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl({ forQr: true }).value).toBe('https://random-words.trycloudflare.com/q/writing/hello-world')
  })

  it('prefixes the path with /q when falling back to production origin for localhost', async () => {
    mockRequestUrl = { hostname: 'localhost', origin: 'http://localhost:3000' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl({ forQr: true }).value).toBe('https://stuar.tc/q/about')
  })

  it('prefixes the path with /q when falling back to production origin for 127.0.0.1', async () => {
    mockRequestUrl = { hostname: '127.0.0.1', origin: 'http://127.0.0.1:3000' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl({ forQr: true }).value).toBe('https://stuar.tc/q/about')
  })

  it('prefixes /q before the / fallback when the route path is empty', async () => {
    mockRequestUrl = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
    mockRoutePath = ''
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl({ forQr: true }).value).toBe('https://stuar.tc/q/')
  })

  it('does not prefix /q by default (forQr absent)', async () => {
    mockRequestUrl = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl().value).toBe('https://stuar.tc/about')
  })

  it('does not prefix /q when forQr is false', async () => {
    mockRequestUrl = { hostname: 'stuar.tc', origin: 'https://stuar.tc' }
    mockRoutePath = '/about'
    const { useShareUrl } = await import('~/composables/useShareUrl')
    expect(useShareUrl({ forQr: false }).value).toBe('https://stuar.tc/about')
  })
})
