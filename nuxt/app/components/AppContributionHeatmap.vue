<script setup lang="ts">
const { cells } = useContributions(18)
</script>

<template>
  <SCContributionHeatmap :weeks="18" :cells="cells.length ? cells : undefined" />
</template>
