<script setup lang="ts">
import { drupalcons as staticDrupalCons } from '~/data/drupalcons'

const { drupalcons: liveDrupalCons } = useDrupalCons()
const items = computed(() => liveDrupalCons.value.length ? liveDrupalCons.value : staticDrupalCons)
</script>

<template>
  <SCDrupalConCard
    v-for="dc in items"
    :key="`${dc.year}-${dc.city}`"
    :year="dc.year"
    :city="dc.city"
    :note="dc.note"
  />
</template>
