<script setup lang="ts">
const stats = [
  { value: '24+', label: 'years on the web' },
  { value: '~20', label: 'years in Drupal' },
  { value: '31,546', label: 'sites run File (Field) Paths' },
  { value: '170+', label: 'open-source projects' },
  { value: '11', label: 'DrupalCons' },
  { value: '1', label: 'Splash Award' },
]
const steps = [
  'Download: <code>composer require drupal/config_pages</code>',
  'Enable: <code>drush en config_pages -y</code>',
]
const gallery = Array.from({ length: 6 }, (_, i) => ({ src: `https://picsum.photos/seed/stuart-photo-${i + 5}/600/600`, alt: `Photograph ${i + 5}` }))
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-14 px-6 py-16 sm:px-10">
      <header class="border-b-2 border-inverted pb-7">
        <SCEyebrow>// stuar.tc · component library</SCEyebrow>
        <h1 class="mt-4 text-5xl font-bold tracking-tighter text-highlighted">Components</h1>
        <p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Nuxt UI v3 + Tailwind v4. One primary token themes the set; toggle dark with the header switch.
        </p>
      </header>

      <section class="space-y-5">
        <SCSectionHeader title="Buttons & status" />
        <div class="flex flex-wrap items-center gap-3">
          <UButton color="primary" label="View open source" trailing-icon="i-lucide-arrow-right" />
          <UButton color="neutral" variant="outline" label="About" />
          <UButton color="primary" variant="link" label="all projects" trailing-icon="i-lucide-arrow-right" />
          <SCStatusPill available />
          <UBadge color="neutral" variant="subtle" label="Druxt" />
        </div>
      </section>

      <section class="space-y-5">
        <SCSectionHeader title="Stat band" />
        <SCStatBand :stats="stats" />
      </section>

      <section class="space-y-5">
        <SCSectionHeader title="Cards" action="all projects →" />
        <div class="grid gap-4 md:grid-cols-3">
          <SCProjectCard tag="Framework" name="DruxtJS" description="Fully decoupled Drupal + Nuxt. Splash Award winner." meta="Creator · open source" />
          <SCProjectCard tag="Module" name="File (Field) Paths" description="Most-installed single contrib module by one author." meta="31,546 sites" />
          <SCDrupalConCard year="2024" city="Singapore" note="Splash Award" />
        </div>
        <SCFeaturedCard eyebrow="Flagship" title="DruxtJS" description="Maps Drupal's JSON:API straight into Vue components.">
          <template #media>
            <SCImageSlot label="druxtjs.org" ratio="" rounded="rounded-none" class="size-full" />
          </template>
        </SCFeaturedCard>
      </section>

      <section class="space-y-5">
        <SCSectionHeader title="Data" />
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-md border border-default bg-default p-6">
            <SCModuleRow name="File (Field) Paths" machine="filefield_paths" installs="31,546" :percent="100" />
            <SCModuleRow name="Sample module" machine="contrib_module_02" installs="3,210" :percent="34" />
          </div>
          <div class="rounded-md border border-default bg-default p-6">
            <SCContributionHeatmap :weeks="18" />
          </div>
        </div>
      </section>

      <section class="space-y-5">
        <SCSectionHeader title="Content" />
        <SCArticleRow date="2022.04.12" title="Decoupling configuration with Config Pages" excerpt="Exposing Drupal configuration to a decoupled front end." reading-time="7 min" category="Druxt" />
        <SCQuote>Good content architecture and good front-end DX shouldn't be a trade-off.</SCQuote>
        <SCSteps :steps="steps" />
        <SCCodeBlock filename="nuxt.config.js">export default {
  modules: ['@druxt-contrib/config-pages', 'druxt'],
}</SCCodeBlock>
        <SCCommentItem author="Jane Developer" date="2022.04.13" body="This pattern saved us a heap of glue code." />
        <SCCommentComposer />
      </section>

      <section class="space-y-5">
        <SCSectionHeader title="Media" />
        <SCGallery :items="gallery" />
      </section>
    </div>
</template>
