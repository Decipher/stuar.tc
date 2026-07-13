import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEvent, readBody } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'

function makeEvent(body: unknown = {}) {
  const req = new IncomingMessage(null as never)
  req.url = '/api/contact'
  const res = new ServerResponse(req)
  const event = createEvent(req, res)
  vi.mocked(readBody).mockResolvedValue(body)
  return event
}

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return { ...actual, readBody: vi.fn() }
})

vi.mock('resend', () => {
  const send = vi.fn()
  return { Resend: vi.fn(() => ({ emails: { send } })) }
})

async function getResendSend() {
  const { Resend } = await import('resend')
  const instance = new (Resend as unknown as new (k: string) => { emails: { send: ReturnType<typeof vi.fn> } })('key')
  return instance.emails.send
}

describe('contact route', () => {
  beforeEach(() => { vi.unstubAllEnvs() })
  afterEach(() => { vi.clearAllMocks() })

  it('returns 400 when fields are missing', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const { default: handler } = await import('../../server/api/contact.post')
    await expect(handler(makeEvent({ name: '', email: '', message: '' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 500 when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const { default: handler } = await import('../../server/api/contact.post')
    await expect(
      handler(makeEvent({ name: 'Test', email: 'test@example.com', message: 'Hello' })),
    ).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns ok:true on successful send', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const send = await getResendSend()
    send.mockResolvedValue({ data: { id: '123' }, error: null })

    const { default: handler } = await import('../../server/api/contact.post')
    const result = await handler(makeEvent({ name: 'Test', email: 'test@example.com', message: 'Hello' }))
    expect(result).toEqual({ ok: true })
  })

  it('returns 502 when resend returns an error', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const send = await getResendSend()
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified' } })

    const { default: handler } = await import('../../server/api/contact.post')
    await expect(
      handler(makeEvent({ name: 'Test', email: 'test@example.com', message: 'Hello' })),
    ).rejects.toMatchObject({ statusCode: 502 })
  })

  it('sends to correct recipient with reply-to set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const send = await getResendSend()
    send.mockResolvedValue({ data: { id: '123' }, error: null })

    const { default: handler } = await import('../../server/api/contact.post')
    await handler(makeEvent({ name: 'Stuart', email: 'sender@example.com', message: 'Hi' }))

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      from: 'stuar.tc <hello@stuar.tc>',
      to: 'stu@rtclark.net',
      replyTo: 'sender@example.com',
      subject: 'Contact from Stuart',
    }))
  })
})
