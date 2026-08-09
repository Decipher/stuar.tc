<script setup lang="ts">
import { drupalcons as staticDrupalCons } from '~/data/drupalcons'

const { drupalcons: liveDrupalCons, refreshLive } = useDrupalCons()
const { target } = useLazyRefresh(refreshLive)
const items = computed(() => liveDrupalCons.value.length ? liveDrupalCons.value : staticDrupalCons)
</script>

<template>
  <div ref="target">
    <SCDrupalConCard
      v-for="dc in items"
      :key="`${dc.year}-${dc.city}`"
      :year="dc.year"
      :city="dc.city"
      :note="dc.note"
    />
  </div>
</template>
