<script setup lang="ts">
const navLinks = [
  { label: 'open source', to: '/open-source' },
  { label: 'community', to: '/community' },
  // { label: 'writing', to: '/writing' }, // writing section disabled
  { label: 'about', to: '/about' },
  // { label: 'photos', to: '/photos' }, // photos section disabled
]

const siteLinks = [
  { label: 'open source', to: '/open-source' },
  { label: 'community', to: '/community' },
  // { label: 'writing', to: '/writing' }, // writing section disabled
  { label: 'about', to: '/about' },
  // { label: 'photos', to: '/photos' }, // photos section disabled
]

const elsewhereLinks = [
  { label: 'drupal.org ↗', to: 'https://drupal.org/u/Deciphered' },
  { label: 'github ↗', to: 'https://github.com/Decipher' },
  { label: 'linkedin ↗', to: '#' },
]

const contactOpen = useContactModal()
const isDev = inject('devMode', import.meta.dev)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-muted text-default">
    <SCAppHeader :links="navLinks" contact-label="Contact" @contact="contactOpen = true">
      <template #menu-footer>
        <SCStatusPill available />
        <div class="mt-3 flex gap-4 font-mono text-xs text-neutral-400">
          <NuxtLink v-for="l in elsewhereLinks" :key="l.to" :to="l.to" class="hover:text-neutral-200">
            {{ l.label }}
          </NuxtLink>
        </div>
      </template>
    </SCAppHeader>
    <main class="flex-1">
      <slot />
    </main>
    <SCAppFooter
      tagline="Doing Druxt. Decoupled Drupal &amp; JavaScript, from Ballarat, Australia."
      :site-links="siteLinks"
      :elsewhere-links="elsewhereLinks"
      copyright="© 2026 Stuart Clark"
      stack="Nuxt · Tailwind · decoupled Drupal via DruxtJS"
    />
    <SCBackToTop />
    <SCContactModal v-model:open="contactOpen" />
    <DevGrid v-if="isDev" />
  </div>
</template>
