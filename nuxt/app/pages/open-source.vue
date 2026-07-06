<script setup lang="ts">
useSeoMeta({
  title: 'Open source · stuar.tc',
  description: 'DruxtJS, File (Field) Paths, and the Druxt ecosystem.',
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:px-10">
      <SCEyebrow>// 170+ projects · 35k+ installs · since 2005</SCEyebrow>
      <h1 class="mt-4 text-5xl font-bold tracking-tighter text-highlighted sm:text-[80px] sm:leading-[0.92]">
        Open source
      </h1>
      <p class="mt-5 max-w-2xl text-xl leading-relaxed text-muted">
        Two decades of Drupal contrib and the Druxt ecosystem. Most of what I build, I build in the open.
      </p>
      <div class="mt-6 flex flex-wrap gap-3 font-mono text-[13px]">
        <a href="https://www.drupal.org/u/deciphered" target="_blank" rel="noopener noreferrer" class="text-dimmed hover:text-primary hover:underline">drupal.org/u/deciphered</a>
        <span class="text-dimmed/40">·</span>
        <a href="https://github.com/Decipher" target="_blank" rel="noopener noreferrer" class="text-dimmed hover:text-primary hover:underline">github.com/Decipher</a>
        <span class="text-dimmed/40">·</span>
        <a href="https://www.npmjs.com/~deciphered" target="_blank" rel="noopener noreferrer" class="text-dimmed hover:text-primary hover:underline">npmjs.com/~deciphered</a>
      </div>
    </section>

    <!-- Flagship DruxtJS -->
    <section class="mx-auto max-w-6xl px-6 pb-10 sm:px-10">
      <AppFlagshipDruxt />
    </section>

    <!-- Modules + Activity two-column -->
    <div class="border-t border-default">
      <div class="mx-auto grid max-w-6xl lg:grid-cols-[1.15fr_1fr] lg:divide-x lg:divide-default">
        <!-- Packages -->
        <div class="px-6 py-12 sm:px-10">
          <div class="mb-1.5 flex items-baseline justify-between">
            <h2 class="text-2xl font-bold tracking-tight text-highlighted">
              Open source packages
            </h2>
            <span class="font-mono text-xs text-dimmed">by usage</span>
          </div>
          <SCEyebrow class="mb-5">// drupal.org/u/deciphered · npmjs.com/~deciphered</SCEyebrow>
          <AppModuleList />
        </div>

        <!-- Recent activity + heatmap -->
        <div class="border-t border-default px-6 py-12 sm:px-10 lg:border-t-0">
          <h2 class="mb-1.5 text-2xl font-bold tracking-tight text-highlighted">
            Recent activity
          </h2>
          <SCEyebrow class="mb-5">// GitHub &amp; Drupal.org</SCEyebrow>
          <AppActivityFeed />
          <div class="mt-8 border-t border-default pt-6">
            <div class="mb-3 flex items-baseline justify-between">
              <span class="font-mono text-[13px] font-medium text-muted">Contributions · last 18 weeks</span>
              <span class="font-mono text-[11px] text-dimmed">less → more</span>
            </div>
            <AppContributionHeatmap />
          </div>
        </div>
      </div>
    </div>

    <!-- DrupalCon & community -->
    <section class="border-t border-default">
      <div class="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div class="mb-1.5 flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-bold tracking-tight text-highlighted">
            DrupalCon &amp; community
          </h2>
          <a
            href="https://www.drupal.org/u/deciphered"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 font-mono text-[13px] font-medium text-primary hover:underline"
          >drupal.org/u/Deciphered →</a>
        </div>
        <SCEyebrow class="mb-5">// 11 events attended, 2011 onward · member since 2006</SCEyebrow>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <AppDrupalConList />
        </div>
      </div>
    </section>
  </div>
</template>
