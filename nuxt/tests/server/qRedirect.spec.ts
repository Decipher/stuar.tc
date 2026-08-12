import { describe, it, expect } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'

function makeEvent(url: string) {
  const req = new IncomingMessage(null as never)
  req.url = url
  const res = new ServerResponse(req)
  return { event: createEvent(req, res), res }
}

describe('QR campaign redirect (/q/[...path])', () => {
  it('redirects /q/about to /about with UTM params', async () => {
    const { event, res } = makeEvent('/q/about')
    const { default: handler } = await import('../../server/routes/q/[...path]')
    await handler(event)
    expect(res.statusCode).toBe(302)
    expect(res.getHeader('location')).toBe('/about?utm_medium=qr&utm_source=share-card&utm_campaign=og-image')
  })

  it('redirects /q/writing/hello-world preserving nested paths', async () => {
    const { event, res } = makeEvent('/q/writing/hello-world')
    const { default: handler } = await import('../../server/routes/q/[...path]')
    await handler(event)
    expect(res.statusCode).toBe(302)
    expect(res.getHeader('location')).toBe('/writing/hello-world?utm_medium=qr&utm_source=share-card&utm_campaign=og-image')
  })

  it('redirects /q/ to / with UTM params', async () => {
    const { event, res } = makeEvent('/q/')
    const { default: handler } = await import('../../server/routes/q/[...path]')
    await handler(event)
    expect(res.statusCode).toBe(302)
    expect(res.getHeader('location')).toBe('/?utm_medium=qr&utm_source=share-card&utm_campaign=og-image')
  })

  it('redirects bare /q to / with UTM params', async () => {
    const { event, res } = makeEvent('/q')
    const { default: handler } = await import('../../server/routes/q/[...path]')
    await handler(event)
    expect(res.statusCode).toBe(302)
    expect(res.getHeader('location')).toBe('/?utm_medium=qr&utm_source=share-card&utm_campaign=og-image')
  })

  it('strips any existing query params from the request', async () => {
    const { event, res } = makeEvent('/q/about?foo=bar')
    const { default: handler } = await import('../../server/routes/q/[...path]')
    await handler(event)
    expect(res.statusCode).toBe(302)
    const location = res.getHeader('location') as string
    expect(location).toBe('/about?utm_medium=qr&utm_source=share-card&utm_campaign=og-image')
    expect(location).not.toContain('foo=bar')
  })
})
