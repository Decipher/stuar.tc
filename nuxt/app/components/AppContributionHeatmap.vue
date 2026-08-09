<script setup lang="ts">
const { cells, refreshLive } = useContributions(52)
const { target } = useLazyRefresh(refreshLive)
const scrollEl = ref<HTMLDivElement | null>(null)

function bindRefs(el: Element | ComponentPublicInstance | null) {
  target.value = el as HTMLElement | null
  scrollEl.value = el as HTMLDivElement | null
}

async function scrollToEnd() {
  await nextTick()
  scrollEl.value!.scrollLeft = scrollEl.value!.scrollWidth
}

onMounted(scrollToEnd)
watch(cells, scrollToEnd)
</script>

<template>
  <div :ref="bindRefs" class="overflow-x-auto">
    <SCContributionHeatmap :weeks="52" :cells="cells.length ? cells : undefined" />
  </div>
</template>
