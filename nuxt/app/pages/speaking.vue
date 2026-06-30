<script setup lang="ts">
import { talks } from '~/data/talks'
import { drupalcons } from '~/data/drupalcons'

useSeoMeta({
  title: 'Speaking · stuar.tc',
  description: 'Talks and presentations by Stuart Clark.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-16 px-6 py-16 sm:px-10">
    <!-- Header -->
    <header>
      <SCEyebrow>// speaking</SCEyebrow>
      <h1 class="mt-4 text-4xl font-bold tracking-tighter text-highlighted sm:text-5xl">
        Talks &amp; sessions
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Splash Award winner at DrupalCon Singapore 2024 for DruxtJS.
        A decade of sessions on decoupled Drupal architecture, module
        maintenance, and front-end DX.
      </p>
    </header>

    <!-- Splash Award highlight -->
    <SCFeaturedCard eyebrow="DrupalCon Singapore 2024" title="Splash Award" description="Won the community Splash Award for DruxtJS, recognizing the framework that makes decoupled Drupal feel native to Nuxt developers.">
      <template #media>
        <SCImageSlot
          src="https://picsum.photos/seed/singapore-award/600/400"
          alt="DrupalCon Singapore 2024"
          ratio=""
          rounded="rounded-none"
          class="size-full"
        />
      </template>
    </SCFeaturedCard>

    <!-- Talks grid -->
    <section class="space-y-5">
      <SCSectionHeader title="Selected talks" />
      <div class="grid gap-4 md:grid-cols-2">
        <div
          v-for="t in talks"
          :key="t.title"
          class="flex h-full flex-col gap-3.5 rounded-md border border-default bg-default p-6"
        >
          <div class="flex items-baseline justify-between gap-3">
            <span class="font-mono text-[11px] font-medium uppercase tracking-wider text-primary">{{ t.event }}</span>
            <span class="font-mono text-xs text-dimmed">{{ t.year }}</span>
          </div>
          <h3 class="text-xl font-bold tracking-tight text-highlighted">{{ t.title }}</h3>
          <p class="flex-1 text-[15px] leading-relaxed text-muted">{{ t.description }}</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="tag in t.tags"
              :key="tag"
              color="neutral"
              variant="subtle"
              :label="tag"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- DrupalCons -->
    <section class="space-y-5">
      <SCSectionHeader title="DrupalCons attended" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SCDrupalConCard
          v-for="dc in drupalcons"
          :key="dc.year"
          :year="dc.year"
          :city="dc.city"
          :note="dc.note"
        />
      </div>
    </section>
  </div>
</template>
