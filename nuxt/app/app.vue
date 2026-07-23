<script setup lang="ts">
import { canonicalUrlForPath, ogDescriptionForPath, ogEyebrowForPath, ogTitleForPath } from '~/utils/socialMeta'

useHead({
  title: 'Stuart Clark · stuar.tc',
  titleTemplate: applyTitleTemplate,
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'alternate', type: 'application/rss+xml', title: 'Blog', href: '/blog.xml' },
    { rel: 'alternate', type: 'application/rss+xml', title: 'Planet Drupal', href: '/planet-drupal.xml' },
  ],
  meta: [
    { name: 'theme-color', content: '#C21A74' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://stuar.tc/#website',
            url: 'https://stuar.tc/',
            name: 'stuar.tc',
            description: 'Senior Drupal & JavaScript engineer. Creator of DruxtJS.',
            inLanguage: 'en-AU',
          },
          {
            '@type': 'Person',
            '@id': 'https://stuar.tc/#person',
            url: 'https://stuar.tc/',
            name: 'Stuart Clark',
            jobTitle: 'Senior Drupal & JavaScript Engineer',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Ballarat',
              addressCountry: 'AU',
            },
            sameAs: [
              'https://www.drupal.org/u/deciphered',
              'https://github.com/Decipher',
              'https://au.linkedin.com/in/stuartclark4',
            ],
          },
        ],
      }),
    },
  ],
})

const route = useRoute()
const ogImageAlt = computed(() => `${ogTitleForPath(route.path)} — stuar.tc share card with QR code linking to the page`)

// Route-aware fallbacks. `writing/[...slug].vue` (and any other data-driven
// page) overrides these with its own specific values once its data loads —
// this is deliberately just the generic per-section fallback, not the final
// word for every route.
useSeoMeta({
  description: 'Senior Drupal & JavaScript engineer in Ballarat, Australia. Creator of DruxtJS. Decoupled Drupal, done properly.',
  ogType: 'website',
  ogUrl: () => canonicalUrlForPath(route.path),
  ogSiteName: 'stuar.tc',
  ogLocale: 'en_AU',
  ogTitle: () => `${ogTitleForPath(route.path)} · stuar.tc`,
  ogDescription: () => ogDescriptionForPath(route.path),
  ogImageAlt,
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${ogTitleForPath(route.path)} · stuar.tc`,
  twitterDescription: () => ogDescriptionForPath(route.path),
  twitterImageAlt: ogImageAlt,
})

// Per-page branded OG image (composition A). Title/eyebrow resolve from the
// route; the QR encodes the request-aware URL (tunnel in dev, stuar.tc in
// production) so the share card's QR and caption match where the visitor is.
// og:image/twitter:image are injected automatically by nuxt-og-image.
defineOgImage('StuartcOgImage', {
  title: computed(() => ogTitleForPath(route.path)),
  value: useShareUrl(),
  eyebrow: computed(() => ogEyebrowForPath(route.path)),
})

// Route-aware canonical link (production origin — correct for SEO, unlike the
// previous hardcoded homepage root which declared every page a duplicate of /).
useHead(computed(() => ({
  link: [{ rel: 'canonical', href: canonicalUrlForPath(route.path) }],
})))

const showSplash = ref(true)

useHead(computed(() => showSplash.value ? { htmlAttrs: { style: 'overflow: hidden' } } : {}))

// On the homepage, wait for the primary above-the-fold data (the activity
// feed) to settle before hiding the splash, so it doesn't disappear only for
// visitors to watch the page keep loading underneath it. Capped by a maximum
// wait so a slow or failing upstream API can't strand the splash on screen.
// A minimum floor still applies everywhere so the splash never just flashes
// past when data happens to already be ready. Other routes have no such data
// dependency, so they only wait on the floor.
const HOME_READY_TIMEOUT_MS = 2500
const MIN_SPLASH_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function waitForHomeReady(): Promise<void> {
  const homeReady = useHomeReadiness()
  if (homeReady.value) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      stop()
      resolve()
    }, HOME_READY_TIMEOUT_MS)
    const stop: () => void = watch(homeReady, (ready) => {
      if (ready) {
        clearTimeout(timer)
        stop()
        resolve()
      }
    })
  })
}

onMounted(async () => {
  const contentReady = route.path === '/'
    ? Promise.all([delay(MIN_SPLASH_MS), waitForHomeReady()])
    : delay(MIN_SPLASH_MS)

  await Promise.all([
    document.fonts.ready,
    contentReady,
  ])
  showSplash.value = false
})
</script>

<template>
  <UApp>
    <Transition name="splash-fade" appear>
      <AppSplash v-if="showSplash" />
    </Transition>
    <NuxtLoadingIndicator color="var(--ui-primary)" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
