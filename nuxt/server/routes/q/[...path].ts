import { defineEventHandler, sendRedirect } from 'h3'

/**
 * QR campaign tracking redirect.
 *
 * Redirects ``/q/<path>`` to ``/<path>?utm_medium=qr&utm_source=share-card&utm_campaign=og-image``
 * so GA4 attributes QR-code-acquired sessions with a distinct source/medium
 * (``share-card / qr``) and campaign (``og-image``), separate from direct traffic.
 *
 * The QR codes on OG share images encode ``/q/``-prefixed URLs (e.g.
 * ``stuar.tc/q/about``); scanning the QR triggers this redirect.
 *
 * @returns A 302 redirect to the real page with UTM parameters appended.
 */
export default defineEventHandler((event) => {
  const target = event.path.split('?')[0]!.replace(/^\/q(?=\/|$)/, '') || '/'
  return sendRedirect(event, `${target}?utm_medium=qr&utm_source=share-card&utm_campaign=og-image`, 302)
})
