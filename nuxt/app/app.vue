<script setup lang="ts">
import { canonicalUrlForPath, ogEyebrowForPath, ogTitleForPath } from '~/utils/socialMeta'

useHead({
  title: 'Stuart Clark · stuar.tc',
  titleTemplate: applyTitleTemplate,
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'canonical', href: 'https://stuar.tc/' },
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

useSeoMeta({
  description: 'Senior Drupal & JavaScript engineer in Ballarat, Australia. Creator of DruxtJS. Decoupled Drupal, done properly.',
  ogType: 'website',
  ogUrl: 'https://stuar.tc/',
  ogSiteName: 'stuar.tc',
  ogLocale: 'en_AU',
  ogTitle: 'Stuart Clark · stuar.tc',
  ogDescription: 'Senior Drupal & JavaScript engineer. Creator of DruxtJS. Doing Druxt.',
  ogImageAlt,
  twitterCard: 'summary_large_image',
  twitterTitle: 'Stuart Clark · stuar.tc',
  twitterDescription: 'Senior Drupal & JavaScript engineer. Creator of DruxtJS.',
  twitterImageAlt: ogImageAlt,
})

// Per-page branded OG image (composition A). Title/eyebrow resolve from the
// route; the QR encodes the canonical URL. og:image/twitter:image are injected
// automatically by nuxt-og-image.
defineOgImage('StuartcOgImage', {
  title: computed(() => ogTitleForPath(route.path)),
  value: computed(() => canonicalUrlForPath(route.path)),
  eyebrow: computed(() => ogEyebrowForPath(route.path)),
})

const showSplash = ref(true)

useHead(computed(() => showSplash.value ? { htmlAttrs: { style: 'overflow: hidden' } } : {}))

onMounted(async () => {
  await Promise.all([
    document.fonts.ready,
    new Promise<void>(resolve => setTimeout(resolve, 300)),
  ])
  showSplash.value = false
})
</script>

<template>
  <UApp>
    <Transition name="splash-fade">
      <AppSplash v-if="showSplash" />
    </Transition>
    <NuxtLoadingIndicator color="var(--ui-primary)" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
