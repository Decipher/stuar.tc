<script setup lang="ts">
</script>

<template>
  <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-default">
    <div class="flex items-center gap-3">
      <span class="size-[18px] bg-primary motion-safe:animate-ping" />
      <span class="font-mono text-2xl font-semibold text-highlighted">stuar.tc</span>
      <span class="h-6 w-2.5 bg-primary motion-safe:animate-pulse" />
    </div>
    <p class="flex items-center gap-2 font-mono text-xs text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-3.5 motion-safe:animate-spin" />
      booting decoupled front end…
    </p>
  </div>
</template>
