<script setup lang="ts">
const isDev = inject('devMode', import.meta.dev)
const appVersion = useRuntimeConfig().public.appVersion as string

// The changelog collection has no routed page — it's only ever rendered
// here, inline in the panel. `.path('/changelog')` is just the collection
// item's derived identifier, not a real navigable URL. Fetched lazily, only
// once the console actually opens, so @nuxt/content's rendering pipeline
// isn't pulled into every visitor's eager bundle for a panel most never find.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changelogPage = ref<any>(null)
// Collapsed by default — the full history is long enough to push the rest
// of the console (dev tools, in dev mode) below the fold otherwise.
const showChangelog = ref(false)

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

watch(showConsole, async (open) => {
  if (open && !changelogPage.value)
    changelogPage.value = await queryCollection('changelog').path('/changelog').first()
})

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

// ── Persistence (dev + prod — just the badge's visibility) ────────────────────
// Dev-only prefs (overlay, measure, color scheme, module list) live in
// DevGridTools.vue's own storage key — see there for why they're split.
const STORAGE_KEY = 'sc-devconsole-v1'

onMounted(() => {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    piVisible.value = s.pi ?? false
  }
  catch { /* ignore malformed localStorage JSON */ }
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (konamiTimer) clearTimeout(konamiTimer)
})

watch(piVisible, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pi: piVisible.value }))
  }
  catch { /* ignore localStorage quota errors */ }
})

// ── Keyboard ──────────────────────────────────────────────────────────────────
// Only this shell's own overlays (console, password). DevGridTools.vue owns
// its own listener for its own overlays (static shell, measure) — those
// always close this shell's console first (see its toggle handlers), so
// there's no ordering dependency between the two listeners.
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
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
</script>

<template>
  <Teleport to="body">

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
    <!-- v-show, not v-if: DevGridTools lives inside this so its section
         markup lands in the right place in the console body, but its own
         Teleport (grid overlay, measure layer, ...) is meant to keep
         working with the console closed — v-if would unmount DevGridTools
         (and everything it teleported) the moment the console closes,
         taking the grid overlay down with it. -->
    <Transition name="sc-scale">
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
      <div
        v-show="showConsole"
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

            <!-- Version / changelog — always available, dev and prod. No
                 routed page: this is the only place the changelog renders.
                 Collapsed by default — the full history is long enough to
                 push the rest of the console (dev tools) below the fold. -->
            <section data-dev-console :style="isDev ? 'margin-bottom:26px;' : ''">
              <h3 class="sc-section-label">// VERSION</h3>
              <div data-dev-console style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
                <span style="font-family:ui-monospace,monospace;font-size:12px;color:#a1a1aa;">stuar.tc v{{ appVersion }}</span>
                <button
                  v-if="changelogPage"
                  data-dev-console
                  class="sc-btn"
                  :class="{ 'sc-btn-active': showChangelog }"
                  @click="showChangelog = !showChangelog"
                >{{ showChangelog ? 'Hide' : 'Changelog' }}</button>
              </div>
              <div
                v-if="showChangelog && changelogPage"
                data-dev-console
                style="margin-top:12px;max-height:220px;overflow-y:auto;border:1px solid rgb(255 255 255 / 6%);border-radius:4px;padding:10px 12px;background:rgb(0 0 0 / 25%);"
              >
                <LazyContentRenderer
                  :value="changelogPage"
                  data-dev-console
                  class="prose prose-sm prose-invert max-w-none font-mono"
                  style="font-size:11px;"
                />
              </div>
            </section>

            <LazyDevGridTools v-if="isDev" v-model:show-console="showConsole" />

          </div>

          <div data-dev-console style="border-top:1px solid rgb(255 255 255 / 5%);padding:9px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
            <span style="font-family:ui-monospace,monospace;font-size:10px;color:#27272a;">{{ isDev ? 'stuar.tc dev console' : 'stuar.tc console' }}</span>
            <span style="font-family:ui-monospace,monospace;font-size:10px;color:#27272a;">ESC to close</span>
          </div>
        </div>
      </div>
    </Transition>

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
  text-decoration: none;
  display: inline-block;
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
