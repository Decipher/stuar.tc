<script setup lang="ts">
import { computed } from 'vue'

/**
 * Inline-SVG QR code, theme-aware.
 *
 * Modules are rendered as a single `<path>` filled with `currentColor`, and
 * the SVG's `color` is bound to `var(--ui-primary)`. Because the colour is a
 * live CSS custom property, the QR re-themes **instantly** on dark-mode toggle
 * or a primary palette swap — with no matrix regeneration and no reload. The
 * matrix itself is produced by {@link useQrCode}, shared with the Satori OG
 * image template so build- and runtime never diverge.
 *
 * The background is transparent; place the component in a container that
 * provides sufficient module contrast (e.g. the dark footer's `#0F0F10` inset).
 */

const props = withDefaults(defineProps<{
  /** The data to encode (usually a canonical URL). */
  value: string
  /** Rendered square size in pixels. */
  size?: number
  /** Error-correction level. Defaults to `H` for scan resilience. */
  level?: 'L' | 'M' | 'Q' | 'H'
}>(), {
  size: 88,
  level: 'H',
})

const matrix = useQrCode(() => props.value, { level: props.level })

/** SVG path: each dark module is `M{x} {y}h1v1h-1z` (unit cell on the module grid). */
const path = computed(() => {
  let d = ''
  for (let y = 0; y < matrix.value.modules.length; y++) {
    const row = matrix.value.modules[y]!
    for (let x = 0; x < row.length; x++) {
      if (row[x])
        d += `M${x} ${y}h1v1h-1z`
    }
  }
  return d
})

const viewBox = computed(() => `0 0 ${matrix.value.size} ${matrix.value.size}`)
const label = computed(() => `QR code to ${props.value}`)
</script>

<template>
  <svg
    :viewBox="viewBox"
    :width="size"
    :height="size"
    role="img"
    :aria-label="label"
    class="app-qr-code"
  >
    <title>{{ label }}</title>
    <path :d="path" fill="currentColor" />
  </svg>
</template>

<style scoped>
.app-qr-code {
  color: var(--ui-primary);
  shape-rendering: crispedges;
}
</style>
