<script setup lang="ts">
import { site } from '~/data/site'

const elsewhereLinks = site.socials.map(s => ({ label: `${s.label} ↗`, to: s.href }))
</script>

<template>
  <div class="flex min-h-screen flex-col bg-default text-default">
    <div class="border-b border-default">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <SCAppLogo />
        <SCThemeToggle />
      </div>
    </div>
    <main class="flex-1">
      <slot />
    </main>
    <SCAppFooter
      compact
      :elsewhere-links="elsewhereLinks"
    />
  </div>
</template>
