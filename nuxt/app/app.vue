<script setup lang="ts">
useHead({
  title: 'Stuart Clark · stuar.tc',
  titleTemplate: applyTitleTemplate,
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
