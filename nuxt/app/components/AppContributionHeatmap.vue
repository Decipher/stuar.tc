<script setup lang="ts">
const { cells } = useContributions(52)
const scrollEl = ref<HTMLDivElement | null>(null)

async function scrollToEnd() {
  await nextTick()
  scrollEl.value!.scrollLeft = scrollEl.value!.scrollWidth
}

onMounted(scrollToEnd)
watch(cells, scrollToEnd)
</script>

<template>
  <div ref="scrollEl" class="overflow-x-auto">
    <SCContributionHeatmap :weeks="52" :cells="cells.length ? cells : undefined" />
  </div>
</template>
