<script setup lang="ts">
import { computed } from 'vue'

/**
 * Satori-rendered OG share image (1200×630) — composition A "QR sidebar".
 *
 * Geometry follows `openspec/changes/add-social-share-qr/design-brief.md` §2.
 * The QR is rendered as a flex grid of cells (design decision D2 — not an
 * `<svg>`, for Satori reliability) using the shared {@link useQrCode} matrix,
 * so build- and runtime QR encoding never diverge. Inline styles only, every
 * multi-child div is `display:flex` (Satori constraint).
 */
const props = defineProps<{
  /** Page title, shown as the H1. */
  title: string
  /** Canonical absolute URL the QR encodes. Named `value` (not `url`) because
   *  `url` is a reserved {@link OgImageOptions} key meaning "use a prebuilt image". */
  value: string
  /** Eyebrow label, e.g. `about`. */
  eyebrow?: string
}>()

const matrix = useQrCode(() => props.value, { level: 'H' })

/** Per-module pixel size so the QR occupies ~300px on the 1200×630 canvas. */
const moduleSize = computed(() => Math.floor(300 / matrix.value.size))
/** QR square box size in pixels. */
const qrBox = computed(() => `${matrix.value.size * moduleSize.value}px`)
/** Origin-stripped caption, e.g. `stuar.tc/about`. */
const urlLabel = computed(() => props.value.replace(/^https?:\/\//, ''))
</script>

<template>
  <div :style="{ width: '1200px', height: '630px', background: '#FAF9F7', display: 'flex', flexDirection: 'row', fontFamily: 'Archivo, sans-serif' }">
    <!-- left column 62% -->
    <div :style="{ width: '62%', padding: '64px 0 64px 72px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }">
      <div :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '36px' }">
        <div :style="{ width: '15px', height: '15px', background: '#C21A74' }" />
        <div :style="{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '18px', color: '#0F0F10', marginLeft: '10px' }">stuar.tc</div>
      </div>
      <div :style="{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, fontSize: '15px', color: '#C21A74', marginBottom: '18px' }">
        // {{ eyebrow }}
      </div>
      <div :style="{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: '64px', lineHeight: 1.02, color: '#0F0F10', maxWidth: '640px', marginBottom: '22px' }">
        {{ title }}
      </div>
      <div :style="{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, fontSize: '16px', color: '#7c7970' }">
        {{ urlLabel }}
      </div>
    </div>
    <!-- right column 38%: QR card -->
    <div :style="{ width: '38%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '40px' }">
      <div :style="{ position: 'relative', display: 'flex', flexDirection: 'row', background: '#FAF9F7', border: '1px solid #E7C9D9', borderRadius: '6px', padding: '18px' }">
        <div :style="{ display: 'flex', flexDirection: 'column', width: qrBox, height: qrBox }">
          <div v-for="(row, y) in matrix.modules" :key="y" :style="{ display: 'flex', flexDirection: 'row' }">
            <div v-for="(on, x) in row" :key="x" :style="{ width: moduleSize + 'px', height: moduleSize + 'px', background: on ? '#87104E' : 'transparent' }" />
          </div>
        </div>
        <div :style="{ position: 'absolute', bottom: '-9px', right: '-9px', width: '18px', height: '18px', background: '#C21A74', borderRadius: '4px' }" />
      </div>
    </div>
  </div>
</template>
