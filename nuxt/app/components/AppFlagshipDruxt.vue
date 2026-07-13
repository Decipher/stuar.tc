<script setup lang="ts">
</script>

<template>
  <a
    href="https://druxtjs.org"
    target="_blank"
    rel="noopener noreferrer"
    class="block overflow-hidden rounded-md border border-default bg-default transition-colors hover:border-primary/40"
  >
    <div class="grid lg:grid-cols-[1.2fr_1fr]">
      <div class="p-8 sm:p-10">
        <span class="font-mono text-[11px] font-medium uppercase tracking-widest text-primary">Flagship framework</span>
        <h2 class="mt-3 text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">DruxtJS</h2>
        <p class="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
          A fully decoupled Drupal + Nuxt framework. Maps Drupal's JSON:API straight into Vue
          components. Content modelling on the back, modern DX on the front.
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <span class="inline-flex items-center gap-2 rounded-sm bg-elevated px-3 py-1.5 font-mono text-[12px] font-medium text-muted">
            <span class="size-2 rounded-full bg-yellow-500" />
            Splash Award · DrupalCon Singapore 2024
          </span>
          <span class="rounded-sm bg-elevated px-3 py-1.5 font-mono text-[12px] font-medium text-muted">
            Nuxt · Vue · JSON:API
          </span>
        </div>
        <div class="mt-7 flex gap-8">
          <div>
            <div class="font-mono text-2xl font-bold tracking-tight text-highlighted">2019</div>
            <div class="mt-1 text-xs text-dimmed">started</div>
          </div>
          <div>
            <div class="font-mono text-2xl font-bold tracking-tight text-highlighted">25+</div>
            <div class="mt-1 text-xs text-dimmed">packages</div>
          </div>
          <div>
            <div class="font-mono text-2xl font-bold tracking-tight text-highlighted">MIT</div>
            <div class="mt-1 text-xs text-dimmed">licensed</div>
          </div>
        </div>
      </div>
      <div class="relative hidden min-h-[260px] overflow-hidden lg:block">
        <img src="/druxt-entity.png" alt="DruxtJS Entity component rendering Drupal content" class="size-full object-cover">
        <span class="absolute bottom-4 left-5 font-mono text-[11px] text-dimmed">druxtjs.org</span>
      </div>
    </div>
  </a>
</template>
