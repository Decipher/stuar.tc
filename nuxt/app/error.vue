<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => props.error?.statusCode === 404)

useSeoMeta({
  title: computed(() => isNotFound.value ? '404 · stuar.tc' : '500 · stuar.tc'),
})
</script>

<template>
  <NuxtLayout name="minimal">
    <div class="mx-auto flex max-w-2xl flex-col px-6 pb-16 pt-20 sm:px-10 sm:pb-24 sm:pt-24">
      <p data-testid="error-numeral" aria-hidden="true" class="font-mono text-[88px] font-bold leading-[0.8] tracking-[-0.05em] text-dimmed sm:text-[168px]">
        {{ isNotFound ? '404' : '500' }}
      </p>
      <SCEyebrow class="mt-6">// {{ isNotFound ? '404' : '500' }}</SCEyebrow>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-highlighted sm:text-5xl sm:tracking-[-0.03em]">
        <template v-if="isNotFound">
          This page doesn't resolve.
        </template>
        <template v-else>
          Something broke on our end.
        </template>
      </h1>
      <p class="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
        <template v-if="isNotFound">
          Broken link, bad guess, or one of the routes that's deliberately quiet. Either way, home is a safer bet.
        </template>
        <template v-else>
          Not a you problem. Give it a moment and try again, or head back home.
        </template>
      </p>
      <UButton class="mt-8 w-full sm:w-fit" color="primary" label="Back to home →" to="/" />
    </div>
  </NuxtLayout>
</template>
