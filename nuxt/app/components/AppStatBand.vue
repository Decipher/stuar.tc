<script setup lang="ts">
const { stats, refreshLive } = useStats()
const { target } = useLazyRefresh(refreshLive)
</script>

<template>
  <div ref="target">
    <SCStatBand :stats="stats" />
  </div>
</template>
