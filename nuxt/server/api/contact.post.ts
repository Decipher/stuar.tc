import { defineEventHandler, readBody, createError } from 'h3'
import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const { name, email, message } = await readBody(event)

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'Mail service not configured' })
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: 'stuar.tc <hello@stuar.tc>',
    to: 'stu@rtclark.net',
    replyTo: email,
    subject: `Contact from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    throw createError({ statusCode: 502, message: error.message ?? 'Failed to send message' })
  }

  return { ok: true }
})
