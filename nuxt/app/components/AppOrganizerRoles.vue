<script setup lang="ts">
import { organizerRoles } from '~/data/community'
</script>

<template>
  <div class="border-t border-default">
    <div
      v-for="(o, i) in organizerRoles"
      :key="`${o.event}-${o.period}-${i}`"
      class="grid grid-cols-[150px_1fr] gap-5 border-b border-default py-3 sm:grid-cols-[180px_1fr]"
    >
      <span class="font-mono text-[12px] font-medium text-dimmed">{{ o.period }}</span>
      <div class="min-w-0">
        <span class="font-semibold text-[15px] text-highlighted">{{ o.event }}</span>
        <span class="text-[13.5px] text-muted"> — {{ o.role }}</span>
      </div>
    </div>
  </div>
</template>
