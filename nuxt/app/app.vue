<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'canonical', href: 'https://stuar.tc/' },
  ],
  meta: [
    { name: 'theme-color', content: '#C21A74' },
  ],
})

useSeoMeta({
  description: 'Senior Drupal & JavaScript engineer in Ballarat, Australia. Creator of DruxtJS. Decoupled Drupal, done properly.',
  ogType: 'website',
  ogUrl: 'https://stuar.tc/',
  ogSiteName: 'stuar.tc',
  ogLocale: 'en_AU',
  ogTitle: 'Stuart Clark · stuar.tc',
  ogDescription: 'Senior Drupal & JavaScript engineer. Creator of DruxtJS. Doing Druxt.',
  twitterCard: 'summary',
  twitterTitle: 'Stuart Clark · stuar.tc',
  twitterDescription: 'Senior Drupal & JavaScript engineer. Creator of DruxtJS.',
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
