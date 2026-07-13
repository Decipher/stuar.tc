<script setup lang="ts">
import { drupalcons } from '~/data/drupalcons'

useSeoMeta({
  title: 'DrupalGive · stuar.tc',
  description: 'Giving back to the Drupal community.',
})

const maintain = [
  { name: 'File (Field) Paths', meta: '31,546 sites · maintainer' },
  { name: 'The Druxt ecosystem', meta: '25+ projects · creator' },
  { name: 'Contrib sample 02', meta: '3,210 sites · co-maintainer' },
  { name: 'Contrib sample 03', meta: '1,180 sites · maintainer' },
]
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-10 px-6 py-16 sm:px-10">
    <header>
      <SCEyebrow>// drupalgive</SCEyebrow>
      <h1 class="mt-4 text-4xl font-bold tracking-tighter text-highlighted sm:text-5xl">
        Giving back
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Maintained projects and community contributions.
      </p>
    </header>
    <div class="grid gap-4 md:grid-cols-2">
      <SCGiveBackCard label="Maintaining" :items="maintain" />
      <SCGiveBackCard label="DrupalCons" :items="drupalcons.map(d => ({ name: d.year + ' · ' + d.city, meta: d.note ?? 'attended' }))" />
    </div>
  </div>
</template>
