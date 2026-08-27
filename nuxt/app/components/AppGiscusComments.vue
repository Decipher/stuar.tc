<script setup lang="ts">
const props = defineProps<{ path: string }>()

const colorMode = useColorMode()
const containerRef = ref<HTMLDivElement>()

function themeUrl(mode: string): string {
  return `${window.location.origin}/giscus-theme-${mode === 'dark' ? 'dark' : 'light'}.css`
}

function injectGiscus() {
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', 'Decipher/stuar.tc')
  script.setAttribute('data-repo-id', 'R_kgDOGZt96w')
  script.setAttribute('data-category', 'General')
  script.setAttribute('data-category-id', 'DIC_kwDOGZt9684CAB_7')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', themeUrl(colorMode.value))
  script.setAttribute('data-lang', 'en')
  containerRef.value?.appendChild(script)
}

onMounted(injectGiscus)

// The container is keyed on `path`, so an article-to-article client-side
// navigation replaces it with an empty div while this component instance
// survives — onMounted does not fire again. Without re-injecting here the
// reader gets a blank comments block until a full page load. `flush: 'post'`
// waits for the replacement div to exist before appending to it.
watch(() => props.path, injectGiscus, { flush: 'post' })

// Giscus's iframe is cross-origin — it can't read the site's own dark-mode
// class, so theme switches have to be pushed in explicitly via its
// documented postMessage API rather than relying on a media query in the
// theme CSS (which would only track OS preference, not this toggle).
watch(() => colorMode.value, (mode) => {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: themeUrl(mode) } } },
    'https://giscus.app',
  )
})
</script>

<template>
  <div class="mt-16 border-t border-default pt-9">
    <div class="mb-4.5 flex items-baseline gap-3">
      <h3 class="text-xl font-bold tracking-[-0.02em] text-highlighted">Discussion</h3>
      <span class="font-mono text-xs text-muted">via GitHub Discussions</span>
    </div>
    <div ref="containerRef" :key="path" class="min-h-[200px] rounded-lg border border-default bg-default p-6" />
  </div>
</template>
