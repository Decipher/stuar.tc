<script setup lang="ts">
/**
 * A StackBlitz project a reader can run in the page.
 *
 * Nothing from StackBlitz loads until the reader asks for it: the embed boots
 * a whole Node toolchain in the browser, which would cost every reader the
 * page's performance budget and set StackBlitz's cookies on a visit to read
 * a post. Until then a placeholder of the same size holds the space, so the
 * layout doesn't shift when the frame arrives. The "open" link works without
 * JavaScript, and is the better choice on a phone.
 */
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'stackblitz' }> }>()

const running = ref(false)

/**
 * The project URL with StackBlitz's embed and cross-origin isolation options added.
 *
 * Options already in the URL win, so an author can open a different file or
 * show the editor by putting `file` or `view` in the URL they paste.
 *
 * @returns The URL for the frame's `src`.
 */
const embedUrl = computed(() => {
  const url = new URL(props.paragraph.url)
  url.searchParams.set('embed', '1')
  // StackBlitz serves the embed cross-origin isolated only when asked to, and
  // it runs only inside a page that is isolated too: see lib/isolatedRoutes.mjs.
  url.searchParams.set('corp', '1')
  if (!url.searchParams.has('view')) url.searchParams.set('view', 'preview')
  if (!url.searchParams.has('hideNavigation')) url.searchParams.set('hideNavigation', '1')
  return url.toString()
})
</script>

<template>
  <figure class="not-prose my-8">
    <div class="relative h-[560px] overflow-hidden rounded-lg border border-default bg-muted">
      <iframe
        v-if="running"
        :src="embedUrl"
        :title="paragraph.title"
        allow="cross-origin-isolated; clipboard-read; clipboard-write"
        class="size-full"
        loading="lazy"
        data-testid="stackblitz-frame"
      />
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-4 px-6 text-center"
        data-testid="stackblitz-placeholder"
      >
        <UIcon name="i-simple-icons-stackblitz" class="size-10 text-primary" aria-hidden="true" />
        <p class="text-lg font-semibold text-highlighted">
          {{ paragraph.title }}
        </p>
        <p class="max-w-md text-sm text-muted">
          Runs in your browser on StackBlitz, with nothing to install. It loads only when you press Run.
        </p>
        <div class="flex flex-wrap justify-center gap-2.5">
          <UButton
            icon="i-lucide-play"
            label="Run the demo"
            data-testid="stackblitz-run"
            @click="running = true"
          />
          <UButton
            :to="paragraph.url"
            target="_blank"
            rel="noopener"
            icon="i-lucide-external-link"
            label="Open on StackBlitz ↗"
            color="neutral"
            variant="outline"
            class="text-muted hover:border-inverted"
          />
        </div>
      </div>
    </div>
    <!-- Once the frame is up, the open link stays beside it: a browser that can't run the embed leaves the reader a way out without reloading the post. -->
    <div v-if="running" class="mt-2 flex justify-end">
      <UButton
        :to="paragraph.url"
        target="_blank"
        rel="noopener"
        icon="i-lucide-external-link"
        label="Open on StackBlitz ↗"
        color="neutral"
        variant="link"
        size="sm"
        data-testid="stackblitz-open-running"
      />
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <figcaption v-if="paragraph.caption" class="mt-3 text-center text-sm text-muted [&_a]:text-primary [&_code]:font-mono" v-html="paragraph.caption" />
  </figure>
</template>
