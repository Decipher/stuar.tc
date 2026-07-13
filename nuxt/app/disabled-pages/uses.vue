<script setup lang="ts">
import { uses } from '~/data/uses'

useSeoMeta({
  title: 'Uses · stuar.tc',
  description: 'The tools, hardware, and services I use day to day.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-10 px-6 py-16 sm:px-10">
    <header>
      <SCEyebrow>// uses</SCEyebrow>
      <h1 class="mt-4 text-4xl font-bold tracking-tighter text-highlighted sm:text-5xl">
        What I use
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        The tools, hardware, and services behind the work.
      </p>
    </header>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SCUsesGroup
        v-for="g in uses"
        :key="g.group"
        :group="g.group"
        :items="g.items"
      />
    </div>
  </div>
</template>
