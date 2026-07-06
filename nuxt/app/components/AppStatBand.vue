<script setup lang="ts">
const { stats } = useStats()
</script>

<template>
  <SCStatBand :stats="stats" />
</template>
