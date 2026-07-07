<script setup lang="ts">
import {
  measureElement,
  getGapResult,
  getAlignmentResult,
  formatPx,
  getElementLabel,
  type MeasureRect,
} from '~/utils/dev-measure'

// ── Konami code ───────────────────────────────────────────────────────────────
// ↑ ↑ ↓ ↓ ← → ← → A B
const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'a', 'b',
]
let konamiIdx = 0
let konamiTimer: ReturnType<typeof setTimeout> | null = null

// ── Visibility state ──────────────────────────────────────────────────────────
const piVisible     = ref(false)
const authenticated = ref(false) // session-only; resets on reload
const showPassword  = ref(false)
const showConsole   = ref(false)

// ── Password ──────────────────────────────────────────────────────────────────
const pw        = ref('')
const pwError   = ref(false)
const pwShake   = ref(false)
const pwSuccess = ref(false)
const pwInput   = ref<HTMLInputElement | null>(null)

watch(showPassword, async (v) => {
  if (v) { await nextTick(); pwInput.value?.focus() }
})

function unleet(s: string): string {
  return s.toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/4/g, 'a').replace(/3/g, 'e').replace(/1/g, 'i')
    .replace(/0/g, 'o').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/\|/g, 'i').replace(/@/g, 'a').replace(/\$/g, 's')
}

function submitPassword() {
  if (unleet(pw.value) === 'hacktheplanet') {
    pwSuccess.value = true
    setTimeout(() => {
      authenticated.value = true
      showPassword.value  = false
      showConsole.value   = true
      pwSuccess.value     = false
      pw.value            = ''
      pwError.value       = false
    }, 1400)
  }
  else {
    pwError.value = true
    pwShake.value = true
    setTimeout(() => { pwShake.value = false }, 480)
  }
}

function onPiClick() {
  if (authenticated.value) showConsole.value = true
  else showPassword.value = true
}

// ── Overlay state ─────────────────────────────────────────────────────────────
type GridSize = 'off' | '4' | '8'
const grid           = ref<GridSize>('off')
const columns        = ref(false)
const outlines       = ref(false)
const overlayOpacity = ref(40)

const STORAGE_KEY = 'sc-devconsole-v1'

onMounted(() => {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    grid.value           = s.grid     ?? 'off'
    columns.value        = s.columns  ?? false
    outlines.value       = s.outlines ?? false
    overlayOpacity.value = s.opacity  ?? 40
    piVisible.value      = s.pi       ?? false
  }
  catch { /* ignore malformed localStorage JSON */ }
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (konamiTimer) clearTimeout(konamiTimer)
  document.body.classList.remove('sc-devgrid-outlines')
})

watch([grid, columns, outlines, overlayOpacity, piVisible], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      grid: grid.value, columns: columns.value,
      outlines: outlines.value, opacity: overlayOpacity.value,
      pi: piVisible.value,
    }))
  }
  catch { /* ignore localStorage quota errors */ }
})

watch(outlines, v => document.body.classList.toggle('sc-devgrid-outlines', v))

// ── Measure layer ─────────────────────────────────────────────────────────────
const measuring        = ref(false)
const measureHover     = ref<MeasureRect | null>(null)
const measurePinnedA   = ref<MeasureRect | null>(null)
const measurePinnedB   = ref<MeasureRect | null>(null)
const measureLabelA    = ref('')
const measureLabelB    = ref('')
const measureLabelHov  = ref('')
const measureBlocker   = ref<HTMLDivElement | null>(null)

watch(measuring, (v) => {
  if (!v) {
    measureHover.value   = null
    measurePinnedA.value = null
    measurePinnedB.value = null
  }
})

/** Get the real page element under (x, y) by temporarily blinding our overlay. */
function elementAtPoint(x: number, y: number): Element | null {
  const blocker = measureBlocker.value!
  blocker.style.pointerEvents = 'none'
  const el = document.elementFromPoint(x, y)
  blocker.style.pointerEvents = 'all'
  if (!el || el.closest('[data-dev-console]')) return null
  return el
}

function onMeasureMove(e: MouseEvent) {
  const el = elementAtPoint(e.clientX, e.clientY)
  if (el) {
    measureHover.value  = measureElement(el)
    measureLabelHov.value = getElementLabel(el)
  }
  else {
    measureHover.value  = null
    measureLabelHov.value = ''
  }
}

function onMeasureClick(e: MouseEvent) {
  e.preventDefault()
  const el = elementAtPoint(e.clientX, e.clientY)

  if (!el) {
    // Clicked empty space → clear
    measurePinnedA.value = null
    measurePinnedB.value = null
    return
  }

  if (!measurePinnedA.value) {
    // First pick
    measurePinnedA.value = measureElement(el)
    measureLabelA.value  = getElementLabel(el)
  }
  else if (!measurePinnedB.value) {
    // Second pick → lock measurement
    measurePinnedB.value = measureElement(el)
    measureLabelB.value  = getElementLabel(el)
  }
  else {
    // Third pick → restart
    measurePinnedA.value = measureElement(el)
    measureLabelA.value  = getElementLabel(el)
    measurePinnedB.value = null
    measureLabelB.value  = ''
  }
}

/**
 * The "target" for gap/alignment: locked B when set, otherwise live hover.
 * Null when nothing to compare against.
 */
const gapTarget = computed<MeasureRect | null>(() =>
  measurePinnedB.value ?? measureHover.value,
)

const gapResult = computed(() =>
  measurePinnedA.value && gapTarget.value
    ? getGapResult(measurePinnedA.value, gapTarget.value)
    : null,
)

const alignResult = computed(() =>
  measurePinnedA.value && gapTarget.value
    ? getAlignmentResult(measurePinnedA.value, gapTarget.value)
    : null,
)

// Mid-line position for the horizontal gap indicator.
// All gap-line computeds below are template-gated (v-if="gapResult && …
// measurePinnedA && gapTarget") so the non-null assertions are safe there.
const hGapLineY = computed(() => {
  const a = measurePinnedA.value!, b = gapTarget.value!
  const overlapTop    = Math.max(a.top, b.top)
  const overlapBottom = Math.min(a.bottom, b.bottom)
  if (overlapBottom > overlapTop) return (overlapTop + overlapBottom) / 2
  return (a.centerY + b.centerY) / 2
})

// Mid-line position for the vertical gap indicator
const vGapLineX = computed(() => {
  const a = measurePinnedA.value!, b = gapTarget.value!
  const overlapLeft  = Math.max(a.left, b.left)
  const overlapRight = Math.min(a.right, b.right)
  if (overlapRight > overlapLeft) return (overlapLeft + overlapRight) / 2
  return (a.centerX + b.centerX) / 2
})

// Left edge of horizontal gap line
const hGapLeft = computed(() =>
  gapResult.value!.hDir === 'right' ? measurePinnedA.value!.right : gapTarget.value!.right,
)

// Width of horizontal gap line — template gates on gapResult.h !== null
const hGapWidth = computed(() => gapResult.value!.h!)

// Top of vertical gap line
const vGapTop = computed(() =>
  gapResult.value!.vDir === 'below' ? measurePinnedA.value!.bottom : gapTarget.value!.bottom,
)

// Height of vertical gap line — template gates on gapResult.v !== null
const vGapHeight = computed(() => gapResult.value!.v!)

// ── Color scheme ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const appConfig = useAppConfig() as any

const COLOR_OPTIONS = [
  { name: 'magenta',  hex: '#c21a74', label: 'Magenta'  },
  { name: 'electric', hex: '#1f4fe0', label: 'Electric' },
  { name: 'violet',   hex: '#7c3aed', label: 'Violet'   },
  { name: 'cyan',     hex: '#0891b2', label: 'Cyan'     },
  { name: 'amber',    hex: '#d97706', label: 'Amber'    },
  { name: 'orange',   hex: '#ea580c', label: 'Orange'   },
]

const currentPrimary = computed(() => appConfig.ui.colors.primary)

// ── Client data inspector ─────────────────────────────────────────────────────
const nuxtApp = useNuxtApp()
const showPayload = ref(false)
const payloadJson = computed(() =>
  JSON.stringify(nuxtApp.payload?.data ?? {}, null, 2),
)

/**
 * Static shell — fetches the page's generated HTML and renders it in a
 * full-viewport iframe so the user can see what was static at generation time
 * vs what's been hydrated client-side since.
 *
 * Most meaningful against `nuxt preview` of a generated site; in `nuxt dev`
 * the fetch returns per-request SSR output instead.
 */
const showStaticShell = ref(false)
const staticHtml = ref('')
const staticError = ref('')
const staticLoading = ref(false)

async function toggleStaticShell() {
  if (showStaticShell.value) {
    showStaticShell.value = false
    return
  }
  staticLoading.value = true
  staticError.value = ''
  try {
    const res = await fetch(location.href, { headers: { accept: 'text/html' } })
    staticHtml.value = await res.text()
    showStaticShell.value = true
  }
  catch (e) {
    staticError.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    staticLoading.value = false
  }
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showStaticShell.value) { showStaticShell.value = false; return }
    if (measuring.value) {
      if (measurePinnedA.value) {
        // First Escape clears the current selection
        measurePinnedA.value = null
        measurePinnedB.value = null
      }
      else {
        measuring.value = false
      }
      return
    }
    if (showConsole.value)  { showConsole.value  = false; return }
    if (showPassword.value) { showPassword.value = false; pw.value = ''; return }
  }

  const inFormEl = e.composedPath().some(
    (n): n is HTMLElement =>
      n instanceof Element && ['INPUT', 'TEXTAREA', 'SELECT'].includes((n as HTMLElement).tagName),
  )
  /* v8 ignore next */ // composedPath() target resolution is unreliable in happy-dom
  if (inFormEl) return

  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++
    clearTimeout(konamiTimer!)
    konamiTimer = setTimeout(() => { konamiIdx = 0 }, 2000)
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0
      piVisible.value = true
    }
  }
  else {
    konamiIdx = 0
    clearTimeout(konamiTimer!)
  }
}

// ── Overlay computed styles ───────────────────────────────────────────────────
const alpha = computed(() => overlayOpacity.value / 100)
const p     = (pct: number) => `color-mix(in srgb, var(--ui-primary) ${pct}%, transparent)`

const gridStyle = computed(() => {
  const size = Number(grid.value)
  const a    = Math.round(alpha.value * 90)
  return {
    backgroundImage: `radial-gradient(circle, ${p(a)} 1px, transparent 1px)`,
    backgroundSize:  `${size}px ${size}px`,
  }
})
</script>

<template>
  <Teleport to="body">

    <!-- ── Dot grid overlay ──────────────────────────────────────────────── -->
    <div
      v-if="grid !== 'off'"
      data-grid-overlay
      :style="gridStyle"
      style="position:fixed;inset:0;pointer-events:none;z-index:9990;"
    />

    <!-- ── Column guides overlay ─────────────────────────────────────────── -->
    <div
      v-if="columns"
      style="position:fixed;inset:0;pointer-events:none;z-index:9990;display:flex;justify-content:center;"
    >
      <div style="width:100%;max-width:72rem;position:relative;">
        <div :style="`position:absolute;inset-block:0;left:0;width:1px;background:${p(Math.round(alpha*60))};`" />
        <div :style="`position:absolute;inset-block:0;right:0;width:1px;background:${p(Math.round(alpha*60))};`" />
        <div :style="`position:absolute;inset-block:0;left:0;width:24px;background:${p(Math.round(alpha*12))};`" />
        <div :style="`position:absolute;inset-block:0;right:0;width:24px;background:${p(Math.round(alpha*12))};`" />
        <div :style="`position:absolute;inset-block:0;left:40px;width:1px;background:color-mix(in srgb,#6366f1 ${Math.round(alpha*38)}%,transparent);`" />
        <div :style="`position:absolute;inset-block:0;right:40px;width:1px;background:color-mix(in srgb,#6366f1 ${Math.round(alpha*38)}%,transparent);`" />
        <div :style="`position:absolute;inset-block:0;left:50%;width:1px;background:${p(Math.round(alpha*18))};`" />
        <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-family:ui-monospace,monospace;font-size:10px;font-weight:600;color:color-mix(in srgb,var(--ui-primary) 65%,transparent);white-space:nowrap;background:rgb(0 0 0 / 55%);padding:2px 6px;border-radius:3px;">
          max-w-6xl · 72rem · px-6 / sm:px-10
        </div>
      </div>
    </div>

    <!-- ── Measure layer ─────────────────────────────────────────────────── -->
    <template v-if="measuring">

      <!-- Full-screen event capture overlay (briefly blinded for elementFromPoint). ESC exits. -->
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
      <div
        ref="measureBlocker"
        data-dev-console
        data-measure-blocker
        style="position:fixed;inset:0;z-index:9982;cursor:crosshair;"
        @mousemove="onMeasureMove"
        @click.prevent="onMeasureClick"
      />

      <!-- Hover highlight (only while A isn't pinned, or before B is pinned) -->
      <div
        v-if="measureHover && !measurePinnedB"
        data-dev-console
        :style="`
          position:fixed;
          top:${measureHover.top}px;left:${measureHover.left}px;
          width:${measureHover.width}px;height:${measureHover.height}px;
          pointer-events:none;z-index:9983;
          border:1px dashed ${p(65)};
          background:${p(6)};
          box-sizing:border-box;
        `"
      >
        <!-- Dimension label -->
        <div
          data-dev-console
          style="
            position:absolute;bottom:100%;left:0;margin-bottom:3px;
            font-family:ui-monospace,monospace;font-size:11px;font-weight:600;
            color:var(--ui-primary);background:rgb(0 0 0 / 70%);
            padding:2px 5px;border-radius:3px;white-space:nowrap;line-height:1.4;
          "
        >
          {{ measureLabelHov }} · {{ formatPx(measureHover.width) }} × {{ formatPx(measureHover.height) }}
        </div>
        <!-- Centre crosshair -->
        <div data-dev-console :style="`position:absolute;top:50%;left:0;right:0;height:1px;background:${p(30)};`" />
        <div data-dev-console :style="`position:absolute;left:50%;top:0;bottom:0;width:1px;background:${p(30)};`" />
      </div>

      <!-- Pinned A highlight (solid) -->
      <div
        v-if="measurePinnedA"
        data-dev-console
        :style="`
          position:fixed;
          top:${measurePinnedA.top}px;left:${measurePinnedA.left}px;
          width:${measurePinnedA.width}px;height:${measurePinnedA.height}px;
          pointer-events:none;z-index:9984;
          border:2px solid var(--ui-primary);
          background:${p(8)};
          box-sizing:border-box;
        `"
      >
        <div
          data-dev-console
          style="
            position:absolute;bottom:100%;left:0;margin-bottom:3px;
            font-family:ui-monospace,monospace;font-size:11px;font-weight:600;
            color:var(--ui-primary);background:rgb(0 0 0 / 80%);
            padding:2px 6px;border-radius:3px;white-space:nowrap;line-height:1.4;
          "
        >
          [A] {{ measureLabelA }} · {{ formatPx(measurePinnedA.width) }} × {{ formatPx(measurePinnedA.height) }}
        </div>
        <!-- Corner markers -->
        <div data-dev-console style="position:absolute;top:-2px;left:-2px;width:6px;height:6px;border-top:2px solid var(--ui-primary);border-left:2px solid var(--ui-primary);" />
        <div data-dev-console style="position:absolute;top:-2px;right:-2px;width:6px;height:6px;border-top:2px solid var(--ui-primary);border-right:2px solid var(--ui-primary);" />
        <div data-dev-console style="position:absolute;bottom:-2px;left:-2px;width:6px;height:6px;border-bottom:2px solid var(--ui-primary);border-left:2px solid var(--ui-primary);" />
        <div data-dev-console style="position:absolute;bottom:-2px;right:-2px;width:6px;height:6px;border-bottom:2px solid var(--ui-primary);border-right:2px solid var(--ui-primary);" />
      </div>

      <!-- Pinned B highlight (secondary colour) -->
      <div
        v-if="measurePinnedB"
        data-dev-console
        :style="`
          position:fixed;
          top:${measurePinnedB.top}px;left:${measurePinnedB.left}px;
          width:${measurePinnedB.width}px;height:${measurePinnedB.height}px;
          pointer-events:none;z-index:9984;
          border:2px solid color-mix(in srgb,var(--ui-primary) 55%,white);
          background:color-mix(in srgb,var(--ui-primary) 5%,transparent);
          box-sizing:border-box;
        `"
      >
        <div
          data-dev-console
          style="
            position:absolute;bottom:100%;left:0;margin-bottom:3px;
            font-family:ui-monospace,monospace;font-size:11px;font-weight:600;
            color:color-mix(in srgb,var(--ui-primary) 55%,white);
            background:rgb(0 0 0 / 80%);
            padding:2px 6px;border-radius:3px;white-space:nowrap;line-height:1.4;
          "
        >
          [B] {{ measureLabelB }} · {{ formatPx(measurePinnedB.width) }} × {{ formatPx(measurePinnedB.height) }}
        </div>
      </div>

      <!-- Horizontal gap indicator -->
      <template v-if="gapResult && gapResult.h !== null && measurePinnedA && gapTarget">
        <div
          data-dev-console
          :style="`
            position:fixed;
            top:${hGapLineY - 0.5}px;
            left:${hGapLeft}px;
            width:${hGapWidth}px;height:1px;
            background:var(--ui-primary);pointer-events:none;z-index:9985;
          `"
        >
          <!-- Tick marks -->
          <div data-dev-console style="position:absolute;left:0;top:-4px;width:1px;height:9px;background:var(--ui-primary);" />
          <div data-dev-console style="position:absolute;right:0;top:-4px;width:1px;height:9px;background:var(--ui-primary);" />
          <!-- Label -->
          <div
            v-if="hGapWidth > 18"
            data-dev-console
            style="
              position:absolute;top:-9px;left:50%;transform:translateX(-50%);
              font-family:ui-monospace,monospace;font-size:10px;font-weight:700;
              color:var(--ui-primary);background:rgb(0 0 0 / 80%);
              padding:1px 4px;border-radius:3px;white-space:nowrap;
            "
          >{{ formatPx(gapResult.h) }}</div>
        </div>
        <!-- Label beside the line when gap too narrow for inline -->
        <div
          v-if="hGapWidth <= 18"
          data-dev-console
          :style="`
            position:fixed;top:${hGapLineY - 9}px;left:${hGapLeft + hGapWidth + 4}px;
            font-family:ui-monospace,monospace;font-size:10px;font-weight:700;
            color:var(--ui-primary);background:rgba(0,0,0,0.8);
            padding:1px 4px;border-radius:3px;white-space:nowrap;z-index:9985;pointer-events:none;
          `"
        >{{ formatPx(gapResult.h) }}</div>
      </template>

      <!-- Vertical gap indicator -->
      <template v-if="gapResult && gapResult.v !== null && measurePinnedA && gapTarget">
        <div
          data-dev-console
          :style="`
            position:fixed;
            left:${vGapLineX - 0.5}px;
            top:${vGapTop}px;
            width:1px;height:${vGapHeight}px;
            background:var(--ui-primary);pointer-events:none;z-index:9985;
          `"
        >
          <div data-dev-console style="position:absolute;top:0;left:-4px;width:9px;height:1px;background:var(--ui-primary);" />
          <div data-dev-console style="position:absolute;bottom:0;left:-4px;width:9px;height:1px;background:var(--ui-primary);" />
          <div
            v-if="vGapHeight > 18"
            data-dev-console
            style="
              position:absolute;left:6px;top:50%;transform:translateY(-50%);
              font-family:ui-monospace,monospace;font-size:10px;font-weight:700;
              color:var(--ui-primary);background:rgb(0 0 0 / 80%);
              padding:1px 4px;border-radius:3px;white-space:nowrap;
            "
          >{{ formatPx(gapResult.v) }}</div>
        </div>
        <div
          v-if="vGapHeight <= 18"
          data-dev-console
          :style="`
            position:fixed;top:${vGapTop + vGapHeight + 4}px;left:${vGapLineX + 6}px;
            font-family:ui-monospace,monospace;font-size:10px;font-weight:700;
            color:var(--ui-primary);background:rgba(0,0,0,0.8);
            padding:1px 4px;border-radius:3px;white-space:nowrap;z-index:9985;pointer-events:none;
          `"
        >{{ formatPx(gapResult.v) }}</div>
      </template>

      <!-- Centre-alignment guide lines -->
      <template v-if="alignResult && measurePinnedA && gapTarget">
        <!-- Shared horizontal centre (same Y) -->
        <div
          v-if="alignResult.hCentre"
          data-dev-console
          :style="`
            position:fixed;
            top:${(measurePinnedA.centerY + gapTarget.centerY) / 2 - 0.5}px;
            left:${Math.min(measurePinnedA.left, gapTarget.left) - 20}px;
            width:${Math.abs(measurePinnedA.right - gapTarget.left) + 40 + Math.abs(Math.min(measurePinnedA.left, gapTarget.left) - Math.min(measurePinnedA.left, gapTarget.left))}px;
            width:${Math.max(measurePinnedA.right, gapTarget.right) - Math.min(measurePinnedA.left, gapTarget.left) + 40}px;
            height:1px;
            border-top:1px dashed ${p(45)};
            pointer-events:none;z-index:9983;
          `"
        />
        <!-- Shared vertical centre (same X) -->
        <div
          v-if="alignResult.vCentre"
          data-dev-console
          :style="`
            position:fixed;
            left:${(measurePinnedA.centerX + gapTarget.centerX) / 2 - 0.5}px;
            top:${Math.min(measurePinnedA.top, gapTarget.top) - 20}px;
            height:${Math.max(measurePinnedA.bottom, gapTarget.bottom) - Math.min(measurePinnedA.top, gapTarget.top) + 40}px;
            width:1px;
            border-left:1px dashed ${p(45)};
            pointer-events:none;z-index:9983;
          `"
        />
      </template>

      <!-- Measure HUD (bottom-left) -->
      <div
        data-dev-console
        style="
          position:fixed;bottom:16px;left:16px;z-index:9986;
          background:#09090f;border:1px solid color-mix(in srgb,var(--ui-primary) 22%,transparent);
          border-radius:8px;padding:10px 14px;max-width:320px;
          box-shadow:0 4px 20px rgb(0 0 0 / 60%);
          font-family:ui-monospace,monospace;font-size:11px;
        "
      >
        <div v-if="!measurePinnedA" style="color:#52525b;">
          Click an element to measure · ESC to exit
        </div>
        <template v-else>
          <div style="color:var(--ui-primary);margin-bottom:6px;">
            [A] {{ measureLabelA }}
            <span style="color:#52525b;"> · {{ formatPx(measurePinnedA.width) }} × {{ formatPx(measurePinnedA.height) }}</span>
          </div>
          <div v-if="!measurePinnedB && !measureHover" style="color:#52525b;">
            Hover or click a second element
          </div>
          <template v-if="gapTarget">
            <div style="color:color-mix(in srgb,var(--ui-primary) 55%,white);margin-bottom:6px;">
              [{{ measurePinnedB ? 'B' : '→' }}] {{ measurePinnedB ? measureLabelB : measureLabelHov }}
              <span style="color:#52525b;"> · {{ formatPx(gapTarget.width) }} × {{ formatPx(gapTarget.height) }}</span>
            </div>
            <!-- Gap info -->
            <div v-if="gapResult" style="color:#a1a1aa;border-top:1px solid rgb(255 255 255 / 6%);padding-top:6px;">
              <span v-if="gapResult.h !== null">H gap: <strong style="color:var(--ui-primary);">{{ formatPx(gapResult.h) }}</strong> </span>
              <span v-if="gapResult.v !== null">V gap: <strong style="color:var(--ui-primary);">{{ formatPx(gapResult.v) }}</strong></span>
              <span v-if="gapResult.h === null && gapResult.v === null" style="color:#52525b;">overlapping</span>
            </div>
            <!-- Alignment flags -->
            <div v-if="alignResult" style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;">
              <span v-if="alignResult.topEdge"    class="sc-align-tag">top ✓</span>
              <span v-if="alignResult.bottomEdge" class="sc-align-tag">bottom ✓</span>
              <span v-if="alignResult.leftEdge"   class="sc-align-tag">left ✓</span>
              <span v-if="alignResult.rightEdge"  class="sc-align-tag">right ✓</span>
              <span v-if="alignResult.hCentre"    class="sc-align-tag">H-centre ✓</span>
              <span v-if="alignResult.vCentre"    class="sc-align-tag">V-centre ✓</span>
            </div>
          </template>
          <div style="color:#3f3f46;margin-top:8px;">ESC to clear · click again to restart</div>
        </template>
      </div>

    </template>

    <!-- ── Pi badge ──────────────────────────────────────────────────────── -->
    <button
      v-if="piVisible"
      class="sc-pi-badge"
      aria-label="Dev console"
      @click="onPiClick"
    >π</button>

    <!-- ── Password modal ────────────────────────────────────────────────── -->
    <Transition name="sc-fade">
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
      <div
        v-if="showPassword"
        data-dev-console
        style="position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgb(0 0 0 / 82%);backdrop-filter:blur(4px);"
        @click.self="showPassword = false; pw = ''"
      >
        <div
          :class="{ 'sc-shake': pwShake }"
          data-dev-console
          style="background:#09090f;border-radius:8px;overflow:hidden;width:100%;max-width:400px;margin:16px;border:1px solid color-mix(in srgb,var(--ui-primary) 30%,transparent);box-shadow:0 16px 56px rgb(0 0 0 / 85%);"
        >
          <div data-dev-console style="background:#0d0d18;border-bottom:1px solid color-mix(in srgb,var(--ui-primary) 18%,transparent);padding:9px 14px;display:flex;align-items:center;gap:8px;">
            <div class="sc-pulse-dot" data-dev-console style="width:9px;height:9px;border-radius:50%;" />
            <span style="font-family:ui-monospace,monospace;font-size:10px;color:#4a4a5a;letter-spacing:0.14em;text-transform:uppercase;flex:1;">RESTRICTED ACCESS</span>
            <button
              data-dev-console
              style="font-family:ui-monospace,monospace;font-size:12px;color:#3f3f46;background:none;border:none;cursor:pointer;line-height:1;"
              @click="showPassword = false; pw = ''"
            >✕</button>
          </div>
          <div data-dev-console style="padding:22px 18px;">
            <template v-if="!pwSuccess">
              <p style="font-family:ui-monospace,monospace;font-size:12px;color:#71717a;letter-spacing:0.04em;line-height:1.7;margin-bottom:18px;">
                UNAUTHORIZED ACCESS DETECTED.<br>
                <span style="color:#a1a1aa;">ENTER PASSPHRASE TO CONTINUE.</span>
              </p>
              <div
                :style="`border:1px solid ${pwError ? 'rgba(248,113,113,0.45)' : 'color-mix(in srgb,var(--ui-primary) 28%,transparent)'};border-radius:4px;background:rgba(0,0,0,0.35);display:flex;align-items:center;padding:9px 12px;gap:8px;`"
              >
                <span style="font-family:ui-monospace,monospace;font-size:14px;color:var(--ui-primary);flex-shrink:0;">></span>
                <input
                  ref="pwInput"
                  v-model="pw"
                  type="password"
                  aria-label="Dev console passphrase"
                  placeholder="h4ck_th3_pl4n3t"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  data-dev-console
                  style="flex:1;background:transparent;border:none;outline:none;font-family:ui-monospace,monospace;font-size:13px;color:#e4e4e7;caret-color:var(--ui-primary);"
                  @keydown.enter="submitPassword"
                  @input="pwError = false"
                >
              </div>
              <p v-if="pwError" style="font-family:ui-monospace,monospace;font-size:11px;color:#f87171;margin-top:9px;letter-spacing:0.06em;">// ACCESS DENIED.</p>
              <button class="sc-auth-btn" data-dev-console @click="submitPassword">AUTHENTICATE</button>
            </template>
            <template v-else>
              <div style="text-align:center;padding:14px 0;">
                <p class="sc-access-granted">ACCESS GRANTED</p>
                <p style="font-family:ui-monospace,monospace;font-size:11px;color:#3f3f46;margin-top:8px;letter-spacing:0.12em;">// HACK THE PLANET</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Dev console modal ─────────────────────────────────────────────── -->
    <Transition name="sc-scale">
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
      <div
        v-if="showConsole"
        data-dev-console
        style="position:fixed;inset:0;z-index:9996;display:flex;align-items:center;justify-content:center;background:rgb(0 0 0 / 72%);backdrop-filter:blur(3px);"
        @click.self="showConsole = false"
      >
        <div
          data-dev-console
          style="background:#09090f;border-radius:10px;overflow:hidden;width:100%;max-width:560px;max-height:85vh;margin:16px;display:flex;flex-direction:column;border:1px solid color-mix(in srgb,var(--ui-primary) 22%,transparent);box-shadow:0 20px 72px rgb(0 0 0 / 92%);"
        >
          <div data-dev-console style="background:#0d0d18;border-bottom:1px solid color-mix(in srgb,var(--ui-primary) 18%,transparent);padding:11px 18px;display:flex;align-items:center;gap:10px;flex-shrink:0;">
            <div style="display:flex;gap:5px;" data-dev-console>
              <div class="sc-pulse-dot" data-dev-console style="width:10px;height:10px;border-radius:50%;" />
              <div data-dev-console style="width:10px;height:10px;border-radius:50%;background:#2a2a38;" />
              <div data-dev-console style="width:10px;height:10px;border-radius:50%;background:#2a2a38;" />
            </div>
            <span style="font-family:ui-monospace,monospace;font-size:11px;color:#71717a;letter-spacing:0.13em;text-transform:uppercase;flex:1;text-align:center;">H4CK TH3 PL4N3T</span>
            <button data-dev-console style="font-family:ui-monospace,monospace;font-size:12px;color:#3f3f46;background:none;border:none;cursor:pointer;padding:2px 4px;" @click="showConsole = false">✕</button>
          </div>

          <div data-dev-console style="overflow-y:auto;padding:20px;flex:1;">

            <!-- Color scheme -->
            <section data-dev-console style="margin-bottom:26px;">
              <h3 class="sc-section-label">// COLOR SCHEME</h3>
              <div data-dev-console style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
                <button
                  v-for="c in COLOR_OPTIONS"
                  :key="c.name"
                  data-dev-console
                  :title="c.label"
                  :style="`display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:none;cursor:pointer;padding:5px 6px;border-radius:7px;outline:${currentPrimary === c.name ? '2px solid rgba(255,255,255,0.45)' : '2px solid transparent'};outline-offset:2px;transition:outline-color 0.15s;`"
                  @click="appConfig.ui.colors.primary = c.name"
                >
                  <div :style="`width:34px;height:34px;border-radius:8px;background:${c.hex};box-shadow:${currentPrimary === c.name ? '0 0 12px ' + c.hex + '90' : '0 2px 8px rgba(0,0,0,0.45)'};transition:box-shadow 0.2s;`" />
                  <span style="font-family:ui-monospace,monospace;font-size:10px;color:#52525b;">{{ c.label }}</span>
                </button>
              </div>
              <p style="font-family:ui-monospace,monospace;font-size:10px;color:#3f3f46;margin-top:10px;">
                primary: <span style="color:#71717a;">{{ currentPrimary }}</span>
              </p>
            </section>

            <!-- Dev overlay -->
            <section data-dev-console style="margin-bottom:26px;">
              <h3 class="sc-section-label">// DEV OVERLAY</h3>
              <div data-dev-console style="display:flex;flex-direction:column;gap:11px;">
                <div data-dev-console style="display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-family:ui-monospace,monospace;font-size:12px;color:#a1a1aa;">Grid</span>
                  <div data-dev-console style="display:flex;gap:4px;">
                    <button v-for="opt in (['off', '4', '8'] as GridSize[])" :key="opt" data-dev-console class="sc-btn" :class="{ 'sc-btn-active': grid === opt }" @click="grid = opt">
                      {{ opt === 'off' ? 'Off' : opt + 'px' }}
                    </button>
                  </div>
                </div>
                <div data-dev-console style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <span style="font-family:ui-monospace,monospace;font-size:12px;color:#a1a1aa;">Columns <span style="font-size:10px;color:#3f3f46;margin-left:6px;">max-w-6xl / px-6 / sm:px-10</span></span>
                  <button data-dev-console class="sc-btn" :class="{ 'sc-btn-active': columns }" @click="columns = !columns">{{ columns ? 'On' : 'Off' }}</button>
                </div>
                <div data-dev-console style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <span style="font-family:ui-monospace,monospace;font-size:12px;color:#a1a1aa;">Outlines <span style="font-size:10px;color:#3f3f46;margin-left:6px;">all elements</span></span>
                  <button data-dev-console class="sc-btn" :class="{ 'sc-btn-active': outlines }" @click="outlines = !outlines">{{ outlines ? 'On' : 'Off' }}</button>
                </div>
                <div data-dev-console>
                  <div data-dev-console style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
                    <span style="font-family:ui-monospace,monospace;font-size:12px;color:#a1a1aa;">Overlay Opacity</span>
                    <span style="font-family:ui-monospace,monospace;font-size:11px;color:#52525b;">{{ overlayOpacity }}%</span>
                  </div>
                  <input v-model.number="overlayOpacity" data-dev-console type="range" min="10" max="80" aria-label="Overlay opacity" style="width:100%;accent-color:var(--ui-primary);cursor:pointer;" >
                </div>
              </div>
            </section>

            <!-- Measure tool -->
            <section data-dev-console>
              <h3 class="sc-section-label">// MEASURE</h3>
              <div data-dev-console style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
                <div style="font-family:ui-monospace,monospace;font-size:11px;color:#52525b;line-height:1.6;">
                  Click elements to measure gaps &amp; alignment.<br>
                  2 picks = locked comparison · ESC to clear
                </div>
                <button
                  data-dev-console
                  class="sc-btn"
                  :class="{ 'sc-btn-active': measuring }"
                  style="flex-shrink:0;"
                  @click="measuring = !measuring; showConsole = false"
                >{{ measuring ? 'Active' : 'Start' }}</button>
              </div>
            </section>

            <!-- Client data -->
            <section data-dev-console>
              <h3 class="sc-section-label">// CLIENT DATA</h3>
              <div data-dev-console style="display:flex;flex-direction:column;gap:11px;">
                <!-- Static shell -->
                <div data-dev-console style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                  <div style="font-family:ui-monospace,monospace;font-size:11px;color:#52525b;line-height:1.6;">
                    Static shell overlay<br>
                    <span style="font-size:10px;color:#3f3f46;">Fetches generated HTML · shows what<br>was SSG vs hydrated since. Best vs<br><code style="color:#71717a;">nuxt preview</code></span>
                  </div>
                  <button
                    data-dev-console
                    class="sc-btn"
                    :class="{ 'sc-btn-active': showStaticShell }"
                    style="flex-shrink:0;"
                    @click="toggleStaticShell"
                  >{{ staticLoading ? '…' : showStaticShell ? 'Hide' : 'Show' }}</button>
                </div>
                <p v-if="staticError" data-dev-console style="font-family:ui-monospace,monospace;font-size:10px;color:#f87171;letter-spacing:0.04em;margin:0;">// FETCH ERROR: {{ staticError }}</p>
                <!-- Payload inspector -->
                <div data-dev-console style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-family:ui-monospace,monospace;font-size:11px;color:#52525b;">Nuxt payload (SSG snapshot)</span>
                  <button data-dev-console class="sc-btn" :class="{ 'sc-btn-active': showPayload }" @click="showPayload = !showPayload">{{ showPayload ? 'Hide' : 'Show' }}</button>
                </div>
                <pre v-if="showPayload" data-dev-console style="margin:0;max-height:240px;overflow-y:auto;font-family:ui-monospace,monospace;font-size:10px;line-height:1.5;color:#71717a;background:rgb(0 0 0 / 35%);border-radius:4px;padding:8px;border:1px solid rgb(255 255 255 / 6%);">{{ payloadJson }}</pre>
              </div>
            </section>

          </div>

          <div data-dev-console style="border-top:1px solid rgb(255 255 255 / 5%);padding:9px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
            <span style="font-family:ui-monospace,monospace;font-size:10px;color:#27272a;">stuar.tc dev console</span>
            <span style="font-family:ui-monospace,monospace;font-size:10px;color:#27272a;">ESC to close</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Static shell overlay ───────────────────────────────────────────── -->
    <div
      v-if="showStaticShell"
      data-dev-console
      data-static-shell
      style="position:fixed;inset:0;z-index:9999;background:#0a0a0a;"
    >
      <div data-dev-console style="position:fixed;top:12px;left:12px;z-index:10000;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#4ade80;background:rgb(0 0 0 / 85%);padding:6px 12px;border-radius:4px;border:1px solid rgb(74 222 128 / 30%);letter-spacing:0.1em;">
        STATIC SHELL — SSG OUTPUT
        <span style="color:#52525b;margin-left:8px;font-weight:400;">{{ staticHtml.length.toLocaleString() }} bytes</span>
      </div>
      <button
        data-dev-console
        class="sc-btn"
        style="position:fixed;top:12px;right:12px;z-index:10000;"
        @click="showStaticShell = false"
      >Close ✕</button>
      <iframe
        data-dev-console
        :srcdoc="staticHtml"
        style="width:100%;height:100%;border:0;background:#fff;"
        title="Static SSG output"
      />
    </div>

  </Teleport>
</template>

<style>
.sc-pi-badge {
  position: fixed; bottom: 16px; right: 16px; z-index: 9993;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-family: ui-serif, Georgia, "Times New Roman", serif; font-size: 20px;
  color: color-mix(in srgb, var(--ui-primary) 13%, transparent);
  background: transparent; border: none; cursor: pointer;
  border-radius: 6px; user-select: none;
  transition: color 0.4s ease, text-shadow 0.4s ease;
}

.sc-pi-badge:hover {
  color: color-mix(in srgb, var(--ui-primary) 55%, transparent);
  text-shadow: 0 0 12px color-mix(in srgb, var(--ui-primary) 40%, transparent);
}

.sc-pulse-dot {
  background: var(--ui-primary);
  box-shadow: 0 0 7px color-mix(in srgb, var(--ui-primary) 65%, transparent);
  animation: sc-pulse 2.4s ease-in-out infinite;
}

.sc-btn {
  padding: 3px 9px; border-radius: 4px;
  border: 1px solid rgb(255 255 255 / 10%);
  background: rgb(255 255 255 / 4%);
  color: #71717a; font-family: ui-monospace, monospace; font-size: 11px; cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}

.sc-btn:hover {
  background: rgb(255 255 255 / 8%);
  color: #a1a1aa;
}

.sc-btn-active {
  background: color-mix(in srgb, var(--ui-primary) 20%, transparent) !important;
  border-color: color-mix(in srgb, var(--ui-primary) 58%, transparent) !important;
  color: color-mix(in srgb, var(--ui-primary) 80%, white) !important;
}

.sc-auth-btn {
  margin-top: 14px; width: 100%; padding: 9px;
  background: color-mix(in srgb, var(--ui-primary) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--ui-primary) 38%, transparent);
  border-radius: 4px;
  color: color-mix(in srgb, var(--ui-primary) 80%, white);
  font-family: ui-monospace, monospace; font-size: 11px;
  letter-spacing: 0.13em; text-transform: uppercase; cursor: pointer;
  transition: background 0.15s;
}
.sc-auth-btn:hover { background: color-mix(in srgb, var(--ui-primary) 16%, transparent); }

.sc-section-label {
  font-family: ui-monospace, monospace; font-size: 10px; color: #52525b;
  letter-spacing: 0.15em; text-transform: uppercase;
  margin: 0 0 12px; padding-bottom: 8px;
  border-bottom: 1px solid rgb(255 255 255 / 5%);
}

.sc-align-tag {
  font-family: ui-monospace, monospace; font-size: 10px;
  color: color-mix(in srgb, var(--ui-primary) 75%, white);
  background: color-mix(in srgb, var(--ui-primary) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--ui-primary) 35%, transparent);
  padding: 1px 5px; border-radius: 3px;
}

@keyframes sc-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }

@keyframes sc-shake {
  0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)}
  35%{transform:translateX(8px)} 55%{transform:translateX(-5px)} 75%{transform:translateX(5px)}
}
.sc-shake { animation: sc-shake 0.45s ease; }

@keyframes sc-access-granted {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(4px);
  }

  40% {
    opacity: 1;
    transform: scale(1.04) translateY(0);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.sc-access-granted {
  font-family: ui-monospace, monospace; font-size: 20px;
  color: #4ade80; letter-spacing: 0.2em;
  text-shadow: 0 0 16px rgb(74 222 128 / 50%);
  animation: sc-access-granted 0.6s cubic-bezier(.34,1.56,.64,1) forwards;
}
.sc-fade-enter-active,.sc-fade-leave-active{transition:opacity .18s ease}
.sc-fade-enter-from,.sc-fade-leave-to{opacity:0}
.sc-scale-enter-active,.sc-scale-leave-active{transition:opacity .22s ease,transform .22s ease}

.sc-scale-enter-from, .sc-scale-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.sc-devgrid-outlines *:not([class*="sc-"]) {
  outline: 1px solid color-mix(in srgb, var(--ui-primary) 30%, transparent) !important;
  outline-offset: -1px;
}

.sc-devgrid-outlines *:not([class*="sc-"])::before,
.sc-devgrid-outlines *:not([class*="sc-"])::after {
  outline: 1px dashed rgb(99 102 241 / 20%) !important;
}
</style>
