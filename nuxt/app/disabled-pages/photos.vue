<script setup lang="ts">
useSeoMeta({
  title: 'Photography · stuar.tc',
  description: 'Photography and drone work by Stuart Clark.',
})

const photos = Array.from({ length: 12 }, (_, i) => ({
  src: `https://picsum.photos/seed/stuart-photo-${i + 1}/600/600`,
  alt: `Photograph ${i + 1}`,
}))
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-10 px-6 pb-16 pt-20 sm:px-10">
    <header>
      <SCEyebrow>// off the clock</SCEyebrow>
      <h1 class="mt-7 text-4xl font-bold tracking-tighter text-highlighted sm:text-5xl">
        Photography &amp; drone work
      </h1>
      <p class="mt-4 max-w-md text-lg leading-relaxed text-muted">
        A quiet corner of the site. Chronological, no captions.
      </p>
    </header>
    <SCGallery :items="photos" />
  </div>
</template>
