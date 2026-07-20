<script setup lang="ts">
import { talks } from '~/data/talks'
import { organizerRoles } from '~/data/community'

useSeoMeta({
  title: 'Community · stuar.tc',
  description: 'Conference talks, DrupalCons attended, community recognition and the events I\'ve helped organise and teach.',
})
</script>

<template>
  <div>
    <!-- Section header -->
    <SCPageHero title="Speaking &amp; community">
      <template #eyebrow>// talks, events &amp; community · 2011 onward</template>
      <template #description>
        Conference talks, DrupalCons attended, community recognition and the events I've helped organise and teach. Fifteen years of Drupal and counting.
      </template>
    </SCPageHero>

    <!-- Splash Award -->
    <section class="mx-auto max-w-6xl px-6 pb-10 sm:px-10">
      <AppSplashAward />
    </section>

    <!-- Talks -->
    <section class="mx-auto max-w-6xl px-6 pb-10 sm:px-10">
      <div class="mb-4.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          Talks
        </h2>
        <span class="font-mono text-[12px] font-medium text-dimmed">{{ talks.length }} conference &amp; community talks</span>
      </div>
      <AppTalksList />
    </section>

    <!-- DrupalCons attended -->
    <section class="mx-auto max-w-6xl border-t border-default px-6 py-12 sm:px-10">
      <div class="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          DrupalCons attended
        </h2>
        <a
          href="https://www.drupal.org/u/deciphered"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[13px] font-medium text-primary hover:underline"
        >drupal.org/u/Deciphered →</a>
      </div>
      <SCEyebrow class="mb-5">// 11 events, 2011–2021 · member since 2006</SCEyebrow>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
        <AppDrupalConList />
      </div>
    </section>

    <!-- Organising & training -->
    <section class="mx-auto max-w-6xl border-t border-default px-6 py-12 sm:px-10">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          Organising &amp; training
        </h2>
        <span class="font-mono text-[12px] font-medium text-dimmed">{{ organizerRoles.length }} events</span>
      </div>
      <AppOrganizerRoles />
    </section>
  </div>
</template>
