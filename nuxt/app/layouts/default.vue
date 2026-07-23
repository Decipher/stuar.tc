<script setup lang="ts">
import { site } from '~/data/site'

const navLinks = [
  { label: 'open source', to: '/open-source' },
  { label: 'community', to: '/community' },
  { label: 'writing', to: '/writing' },
  { label: 'about', to: '/about' },
  // { label: 'photos', to: '/photos' }, // photos section disabled
]

const siteLinks = [
  { label: 'open source', to: '/open-source' },
  { label: 'community', to: '/community' },
  { label: 'writing', to: '/writing' },
  { label: 'about', to: '/about' },
  // { label: 'photos', to: '/photos' }, // photos section disabled
]

const elsewhereLinks = site.socials.map(s => ({ label: `${s.label} ↗`, to: s.href }))

const contactOpen = useContactModal()
const isDev = inject('devMode', import.meta.dev)

async function handleContactSubmit(payload: { name: string; email: string; message: string }) {
  await $fetch('/api/contact', { method: 'POST', body: payload })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-muted text-default">
    <SCAppHeader :links="navLinks" contact-label="Contact" @contact="contactOpen = true">
      <template #menu-footer>
        <SCStatusPill available :label="site.status" />
        <div class="mt-3 flex gap-4 font-mono text-xs text-muted">
          <NuxtLink v-for="l in elsewhereLinks" :key="l.to" :to="l.to" class="hover:text-highlighted no-underline">
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
      :feed-links="[{ label: 'RSS', href: '/blog.xml' }]"
      copyright="© 2026 Stuart Clark"
      stack="Nuxt · Tailwind · decoupled Drupal via DruxtJS"
    />
    <SCBackToTop />
    <SCContactModal v-model:open="contactOpen" :submit-handler="handleContactSubmit" />
    <DevGrid v-if="isDev" />
  </div>
</template>
