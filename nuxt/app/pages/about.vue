<script setup lang="ts">
import { site } from '~/data/site'

useSeoMeta({
  title: 'About · stuar.tc',
  description: 'Senior Drupal & JavaScript engineer in Ballarat, Australia.',
})

const { stats, ffpSites } = useStats()
const openContact = useContactModal()

const expertise = [
  { tag: 'Core', name: 'Decoupled Drupal', description: 'JSON:API, RESTful, GraphQL - building API-first Drupal for JS front-ends.' },
  { tag: 'Framework', name: 'DruxtJS', description: 'Creator and maintainer of the 170+ project Druxt ecosystem for Nuxt.' },
  { tag: 'Frontend', name: 'Nuxt & Vue', description: 'SSR, SSG, and interactive client patterns with Nuxt UI and Tailwind.' },
  { tag: 'Backend', name: 'Drupal module dev', description: 'From File (Field) Paths to custom contrib - 20 years of Drupal internals.' },
  { tag: 'DevOps', name: 'CI/CD & hosting', description: 'GitHub Actions, Platform.sh, DDEV, and automated testing pipelines.' },
  { tag: 'Community', name: 'Mentoring & review', description: 'Patch reviews, issue triage, and Splash Award-winning contributions.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-6 pb-12 pt-20 sm:px-10">
      <SCEyebrow>// about</SCEyebrow>
      <h1 class="mt-7 text-5xl font-bold tracking-tighter text-highlighted sm:text-7xl sm:tracking-[-0.045em]">
        Stuart Clark
      </h1>
      <p class="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
        Senior Drupal &amp; JavaScript engineer in Ballarat, Australia.
        Creator of <strong class="font-semibold text-highlighted">DruxtJS</strong>.
        24+ years on the web, ~20 in Drupal.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <SCStatusPill available />
        <UButton color="primary" label="View open source" trailing-icon="i-lucide-arrow-right" to="/open-source" />
        <UButton color="neutral" variant="outline" label="Get in touch" @click="openContact = true" />
      </div>
    </section>

    <!-- Portrait + bio -->
    <section class="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
      <div class="grid gap-8 lg:grid-cols-[1fr_1.8fr] lg:gap-12">
        <SCImageSlot
          src="https://www.gravatar.com/avatar/499831a65f45885a7e1b70ea47c06a58?s=600"
          alt="Stuart Clark"
          ratio="aspect-[4/5]"
          rounded="rounded-lg"
        />
        <div class="space-y-5 text-lg leading-relaxed text-muted">
          <p>
            I build decoupled Drupal systems - APIs, frameworks, and the front-ends
            that consume them. My focus is making the boundary between Drupal and
            JavaScript feel effortless.
          </p>
          <p>
            In 2019 I created <strong class="font-semibold text-highlighted">DruxtJS</strong>,
            a framework that maps Drupal’s JSON:API directly into reactive Vue
            components. It won the <strong class="font-semibold text-highlighted">Splash
            Award</strong> at DrupalCon Singapore 2024.
          </p>
          <p>
            Before Druxt, I built and maintain
            <strong class="font-semibold text-highlighted">File (Field) Paths</strong>
            - one of the most widely installed contrib modules in Drupal,
            running on {{ ffpSites }}+ sites.
          </p>
          <p>
            When I’m not shipping code I fly drones along the Victorian coast
            and pretend I’ll write more blog posts.
          </p>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <SCStatBand :stats="stats" />

    <!-- Expertise -->
    <section class="mx-auto max-w-6xl space-y-5 px-6 py-16 sm:px-10">
      <SCSectionHeader title="Expertise" />
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SCProjectCard
          v-for="e in expertise"
          :key="e.name"
          :tag="e.tag"
          :name="e.name"
          :description="e.description"
        />
      </div>
    </section>

    <!-- Elsewhere -->
    <section class="mx-auto max-w-6xl space-y-5 px-6 pb-16 sm:px-10">
      <SCSectionHeader title="Elsewhere" />
      <div class="grid gap-4 sm:grid-cols-3">
        <NuxtLink
          v-for="soc in site.socials"
          :key="soc.label"
          :to="soc.href"
          class="flex items-center justify-between rounded-md border border-default bg-default p-6 transition-colors hover:bg-muted"
        >
          <span class="font-mono text-[13px] font-medium text-highlighted">{{ soc.label }}</span>
          <span class="font-mono text-xs text-dimmed">↗</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
