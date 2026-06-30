<script setup lang="ts">
import { stats } from '~/data/stats'
import { projects } from '~/data/projects'
import { activity } from '~/data/activity'
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:px-10">
      <SCEyebrow>// Hello world.</SCEyebrow>
      <h1 class="mt-7 text-5xl font-bold tracking-tighter text-highlighted sm:text-7xl sm:tracking-[-0.045em] lg:text-[108px] lg:leading-[0.9]">
        Stuart Clark
      </h1>
      <p class="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-2xl">
        Senior Drupal &amp; JavaScript engineer in Ballarat, Australia. Creator of
        <strong class="font-semibold text-highlighted">DruxtJS</strong>. Decoupled
        Drupal, done properly.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <SCStatusPill available />
        <UButton color="primary" label="View open source" trailing-icon="i-lucide-arrow-right" to="/open-source" />
        <UButton color="neutral" variant="outline" label="About" to="/about" />
      </div>
    </section>

    <!-- Stats -->
    <SCStatBand :stats="stats" />

    <!-- Heartbeat -->
    <section class="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <SCSectionHeader title="Heartbeat" action="all activity →" to="/open-source" />
      <div class="mt-7 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div class="flex items-center gap-3 rounded-md border border-default bg-default p-6">
          <span class="relative flex size-3">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span class="relative inline-flex size-3 rounded-full bg-success" />
          </span>
          <div>
            <p class="font-mono text-[13px] font-medium text-highlighted">Live</p>
            <p class="font-mono text-xs text-dimmed">recent commits &amp; releases</p>
          </div>
        </div>
        <div class="rounded-md border border-default bg-default px-6 py-2">
          <SCActivityRow
            v-for="a in activity"
            :key="a.repo + a.when"
            :when="a.when"
            :repo="a.repo"
            :action="a.action"
          />
        </div>
      </div>
    </section>

    <!-- Selected work -->
    <section class="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
      <SCSectionHeader title="Selected work" action="all projects →" to="/open-source" />
      <div class="mt-7 grid gap-4 md:grid-cols-3">
        <SCProjectCard
          v-for="p in projects"
          :key="p.name"
          :tag="p.tag"
          :name="p.name"
          :description="p.description"
          :meta="p.meta"
        />
      </div>
    </section>

    <!-- Photography teaser -->
    <section class="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-16 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <SCEyebrow>// off the clock</SCEyebrow>
        <h2 class="mt-3 text-2xl font-bold tracking-tight text-highlighted">
          Photography &amp; drone work
        </h2>
        <p class="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
          A quiet corner of the site. Chronological, no captions.
        </p>
        <UButton color="neutral" variant="link" label="View photos →" to="/photos" class="mt-3 -ml-3" />
      </div>
      <SCGallery
        :items="[
          { src: 'https://picsum.photos/seed/stuart-photo-1/400/400', alt: 'Photograph 1' },
          { src: 'https://picsum.photos/seed/stuart-photo-2/400/400', alt: 'Photograph 2' },
          { src: 'https://picsum.photos/seed/stuart-photo-3/400/400', alt: 'Photograph 3' },
          { src: 'https://picsum.photos/seed/stuart-photo-4/400/400', alt: 'Photograph 4' },
        ]"
      />
    </section>
  </div>
</template>
