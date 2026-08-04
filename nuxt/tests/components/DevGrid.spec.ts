import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import DevGrid from '~/components/DevGrid.vue'

// DevGrid queries the `changelog` collection to render inline in the panel.
// There's no routed page for it (unlike articleEntries), so there's no
// existing shared mock shape to reuse — a bare spy is enough here: what
// matters is that DevGrid asks for the right collection/path and doesn't
// crash regardless of what comes back (real MDC-rendered content is
// covered by the e2e check in tests/seo/seo.spec.ts against a real build).
// mockNuxtImport's factory is hoisted above regular imports/consts, so the
// spy has to live inside vi.hoisted() too — same reasoning as writing.spec.ts.
const { queryChangelogSpy } = vi.hoisted(() => ({
  queryChangelogSpy: vi.fn(() => ({
    path: () => ({ first: async () => null }),
  })),
}))
mockNuxtImport('queryCollection', () => queryChangelogSpy)

// ── constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sc-devconsole-v1'
const KONAMI_KEYS = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'a', 'b']

// ── helpers ───────────────────────────────────────────────────────────────────

function pressKey(k: string, target: EventTarget = document.body) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
}

async function triggerKonami() {
  for (const k of KONAMI_KEYS) { pressKey(k); await nextTick() }
}

/**
 * The console modal uses v-show, not v-if (see DevGrid.vue for why —
 * DevGridTools' own Teleported overlays need to survive the console
 * closing), so its markup stays in the DOM even when closed. Check the
 * outermost backdrop's actual `display` instead of DOM/text presence.
 */
function isConsoleVisible(): boolean {
  const backdrop = document.querySelector<HTMLElement>('[style*="9996"]')
  return !!backdrop && backdrop.style.display !== 'none'
}

/** Mount, run konami, click π → password modal is now open.
 *  Expects fake timers to be active (the `password modal` block sets them). */
async function openPasswordModal() {
  const w = await mountSuspended(DevGrid)
  await vi.runAllTimersAsync() // flush mount-scheduled timers under the fake-timer regime
  await triggerKonami()
  document.querySelector<HTMLElement>('.sc-pi-badge')!.click()
  await nextTick()
  return w
}

/**
 * Full unlock: mount → konami → password → wait for 1400ms animation.
 * Uses fake timers ONLY around the setTimeout inside submitPassword so
 * mountSuspended itself can run with real timers.
 */
async function mountAndUnlock(options?: Parameters<typeof mountSuspended>[1]) {
  const w = await mountSuspended(DevGrid, options)
  await triggerKonami()
  document.querySelector<HTMLElement>('.sc-pi-badge')!.click()
  await nextTick()

  const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
  input.value = 'hacktheplanet'
  input.dispatchEvent(new Event('input', { bubbles: true }))

  vi.useFakeTimers()
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await nextTick()
  await vi.advanceTimersByTimeAsync(1500) // async variant flushes Vue's scheduler
  vi.useRealTimers()
  await nextTick()

  return w
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  await nextTick()
  await nextTick() // second tick lets Teleport content flush
  // Force-remove any leaked Teleport nodes so later tests start clean
  document.querySelectorAll('.sc-pi-badge,[data-dev-console],[data-grid-overlay]')
    .forEach(el => el.remove())
  document.body.classList.remove('sc-devgrid-outlines')
})

// ── startup / localStorage ────────────────────────────────────────────────────

describe('DevGrid startup', () => {
  it('mounts without error', async () => {
    const w = await mountSuspended(DevGrid)
    expect(w.html()).not.toBeNull()
    w.unmount()
  })

  it('pi badge is hidden by default', async () => {
    const w = await mountSuspended(DevGrid)
    expect(document.querySelector('.sc-pi-badge')).toBeNull()
    w.unmount()
  })

  it('shows pi badge when localStorage has pi:true', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pi: true }))
    const w = await mountSuspended(DevGrid)
    await nextTick()
    expect(document.querySelector('.sc-pi-badge')).not.toBeNull()
    w.unmount()
  })

  it('handles corrupt localStorage JSON without throwing', async () => {
    localStorage.setItem(STORAGE_KEY, 'NOT_JSON')
    const w = await mountSuspended(DevGrid)
    await nextTick()
    expect(document.querySelector('.sc-pi-badge')).toBeNull()
    w.unmount()
  })

  it('removes keydown listener on unmount', async () => {
    const w = await mountSuspended(DevGrid)
    await nextTick()
    w.unmount()
    await nextTick()
    // Listener removed: konami no longer fires
    await triggerKonami()
    expect(document.querySelector('.sc-pi-badge')).toBeNull()
  })
})

// ── konami code ───────────────────────────────────────────────────────────────

describe('konami code', () => {
  it('reveals pi badge after full sequence', async () => {
    const w = await mountSuspended(DevGrid)
    await triggerKonami()
    expect(document.querySelector('.sc-pi-badge')).not.toBeNull()
    w.unmount()
  })

  it('wrong key resets progress; second full sequence still works', async () => {
    const w = await mountSuspended(DevGrid)
    pressKey('ArrowUp'); await nextTick()
    pressKey('ArrowUp'); await nextTick()
    pressKey('z');       await nextTick() // resets
    await triggerKonami()
    expect(document.querySelector('.sc-pi-badge')).not.toBeNull()
    w.unmount()
  })

  it('sequence resets after 2-second idle timeout', async () => {
    vi.useFakeTimers()
    const w = await mountSuspended(DevGrid)
    await vi.runAllTimersAsync()
    pressKey('ArrowUp'); await nextTick()
    pressKey('ArrowUp'); await nextTick()
    await vi.advanceTimersByTimeAsync(2100) // 2s idle → konamiIdx resets to 0
    await nextTick()
    // Remaining 8 keys (not a full 10-key sequence) → no badge
    for (const k of KONAMI_KEYS.slice(2)) { pressKey(k); await nextTick() }
    expect(document.querySelector('.sc-pi-badge')).toBeNull()
    w.unmount()
    vi.useRealTimers()
  })
})

// ── password modal ────────────────────────────────────────────────────────────

describe('password modal', () => {
  // Fake timers for the whole block so mountSuspended + Teleport rendering
  // flush deterministically. openPasswordModal() calls runAllTimersAsync().
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('clicking pi shows password modal', async () => {
    const w = await openPasswordModal()
    expect(document.querySelector('input[type="password"]')).not.toBeNull()
    w.unmount()
  })

  it('password input has 1Password suppression attributes', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    expect(input.getAttribute('data-1p-ignore')).not.toBeNull()
    expect(input.getAttribute('data-lpignore')).toBe('true')
    expect(input.getAttribute('data-form-type')).toBe('other')
    expect(input.getAttribute('autocomplete')).toBe('new-password')
    w.unmount()
  })

  it('wrong password shows error state', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    input.value = 'wrongpassword'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('ACCESS DENIED')
    w.unmount()
  })

  it('typing after a wrong password clears the error', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    input.value = 'wrong'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    input.value = 'x'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).not.toContain('ACCESS DENIED')
    w.unmount()
  })

  it('wrong password triggers shake class, which clears after 480ms', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    input.value = 'wrongpassword'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(document.querySelector('.sc-shake')).not.toBeNull()
    await vi.advanceTimersByTimeAsync(500)
    await nextTick()
    expect(document.querySelector('.sc-shake')).toBeNull()
    w.unmount()
  })

  it('ESC closes password modal', async () => {
    const w = await openPasswordModal()
    pressKey('Escape')
    await nextTick()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    w.unmount()
  })

  it('clicking backdrop closes password modal', async () => {
    const w = await openPasswordModal()
    // Outermost fixed overlay at z-index 9998
    const backdrop = document.querySelector<HTMLElement>('[style*="9998"]')!
    backdrop.click()
    await nextTick()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    w.unmount()
  })

  it('✕ button closes password modal', async () => {
    const w = await openPasswordModal()
    const closeBtns = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .filter(b => b.textContent?.trim() === '✕')
    closeBtns[0]?.click() // first ✕ is the password modal's
    await nextTick()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    w.unmount()
  })

  it('correct leet password shows ACCESS GRANTED', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    input.value = 'h4ck_th3_pl4n3t'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('ACCESS GRANTED')
    w.unmount()
  })

  it('after success animation console opens and password modal closes', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    input.value = 'hacktheplanet'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    await vi.advanceTimersByTimeAsync(1500)
    await nextTick()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    expect(document.body.innerHTML).toContain('H4CK TH3 PL4N3T')
    w.unmount()
  })

  it('correct password (plain text) also works', async () => {
    const w = await openPasswordModal()
    const input = document.querySelector<HTMLInputElement>('input[type="password"]')!
    input.value = 'hacktheplanet'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('ACCESS GRANTED')
    w.unmount()
  })
})

// ── authenticated flow (shell only — dev tools live in DevGridTools.spec.ts) ──

describe('authenticated flow', () => {
  it('pi click opens console directly when already authenticated', async () => {
    const w = await mountAndUnlock()
    pressKey('Escape'); await nextTick() // close console
    document.querySelector<HTMLElement>('.sc-pi-badge')!.click()
    await nextTick()
    expect(isConsoleVisible()).toBe(true)
    w.unmount()
  })

  it('ESC closes the console', async () => {
    const w = await mountAndUnlock()
    pressKey('Escape'); await nextTick()
    expect(isConsoleVisible()).toBe(false)
    w.unmount()
  })

  it('ESC with nothing open is a harmless no-op', async () => {
    const w = await mountAndUnlock()
    pressKey('Escape'); await nextTick() // close console
    pressKey('Escape'); await nextTick() // nothing open now
    expect(isConsoleVisible()).toBe(false)
    expect(document.querySelector('input[type="password"]')).toBeNull()
    w.unmount()
  })

  it('console ✕ close button works', async () => {
    const w = await mountAndUnlock()
    const closeBtns = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .filter(b => b.textContent?.trim() === '✕')
    closeBtns[closeBtns.length - 1]?.click() // last ✕ is the console's
    await nextTick()
    expect(isConsoleVisible()).toBe(false)
    w.unmount()
  })

  it('clicking console backdrop closes the console', async () => {
    const w = await mountAndUnlock()
    // The console's outermost overlay (z-index 9996); @click.self fires on direct click
    const backdrop = document.querySelector<HTMLElement>('[style*="9996"]')!
    backdrop.click()
    await nextTick()
    expect(isConsoleVisible()).toBe(false)
    w.unmount()
  })

  it('closing the console does not unmount DevGridTools (grid overlay survives)', async () => {
    const w = await mountAndUnlock({ global: { provide: { devMode: true } } })
    await vi.waitFor(() => {
      expect(document.body.innerHTML).toContain('COLOR SCHEME')
    }, { timeout: 3000, interval: 50 })

    const btn4 = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === '4px')
    btn4?.click()
    await nextTick()
    expect(document.body.querySelector('[data-grid-overlay]')).not.toBeNull()

    pressKey('Escape'); await nextTick() // close console
    expect(isConsoleVisible()).toBe(false)
    // The whole point of the grid overlay is inspecting the real page with
    // the console out of the way — closing it must not take the grid down.
    expect(document.body.querySelector('[data-grid-overlay]')).not.toBeNull()
    w.unmount()
  }, 10000)
})

// ── version / changelog section (always available, dev and prod) ─────────────

describe('version section', () => {
  it('shows the app version', async () => {
    const w = await mountAndUnlock()
    expect(document.body.innerHTML).toContain('// VERSION')
    expect(document.body.innerHTML).toMatch(/stuar\.tc v\d+\.\d+\.\d+/)
    w.unmount()
  })

  it('queries the changelog collection for inline display, not a routed page', async () => {
    const w = await mountAndUnlock()
    expect(queryChangelogSpy).toHaveBeenCalledWith('changelog')
    // No link anywhere in the panel points at a /changelog route — the
    // content renders inline, there's nothing to navigate to.
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-dev-console] a')]
    expect(links.some(a => a.getAttribute('href') === '/changelog')).toBe(false)
    w.unmount()
  })

  it('does not crash when the changelog collection has no data yet', async () => {
    const w = await mountAndUnlock()
    // queryChangelogSpy resolves to null by default — the section should
    // still show the version line without a Changelog toggle at all.
    expect(document.body.innerHTML).toContain('// VERSION')
    const btn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Changelog')
    expect(btn).toBeUndefined()
    w.unmount()
  })

  it('starts collapsed, and the Changelog toggle expands/collapses it', async () => {
    queryChangelogSpy.mockImplementationOnce(() => ({
      path: () => ({ first: async () => ({ body: { type: 'minimal', value: [] }, path: '/changelog' }) }),
    }))
    const w = await mountAndUnlock()
    const btn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Changelog')
    expect(btn, 'Changelog toggle should appear once the collection resolves').not.toBeUndefined()
    expect(document.body.innerHTML).not.toContain('>Hide<')

    btn?.click()
    await nextTick()
    const hideBtn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Hide')
    expect(hideBtn, 'button relabels to Hide once expanded').not.toBeUndefined()

    hideBtn?.click()
    await nextTick()
    expect(document.body.innerHTML).not.toContain('>Hide<')
    w.unmount()
  })
})

// ── production mode (isDev false — the real, un-injected default) ────────────

describe('production mode', () => {
  it('footer reads "stuar.tc console" (not "dev console") when isDev is false', async () => {
    const w = await mountAndUnlock()
    expect(document.body.innerHTML).toContain('stuar.tc console')
    expect(document.body.innerHTML).not.toContain('stuar.tc dev console')
    w.unmount()
  })

  it('dev-only tooling never appears — unlock still shows only the version panel', async () => {
    const w = await mountAndUnlock()
    expect(document.body.innerHTML).not.toContain('COLOR SCHEME')
    expect(document.body.innerHTML).not.toContain('MEASURE')
    expect(document.body.innerHTML).not.toContain('CLIENT DATA')
    w.unmount()
  })
})

// ── dev mode integration (devMode injected true — proves the Lazy wiring works) ─

describe('dev mode integration', () => {
  it('mounts DevGridTools inside the console when isDev is true', async () => {
    const w = await mountAndUnlock({ global: { provide: { devMode: true } } })
    await vi.waitFor(() => {
      expect(document.body.innerHTML).toContain('COLOR SCHEME')
    }, { timeout: 3000, interval: 50 })
    expect(document.body.innerHTML).toContain('MEASURE')
    expect(document.body.innerHTML).toContain('CLIENT DATA')
    w.unmount()
  }, 10000)
})

// ── localStorage persistence ──────────────────────────────────────────────────

describe('localStorage persistence', () => {
  it('writes state to localStorage when prefs change', async () => {
    const w = await mountSuspended(DevGrid)
    await triggerKonami() // sets pi:true → triggers save
    await nextTick()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved).toHaveProperty('pi', true)
    w.unmount()
  })

  it('handles localStorage write failure silently', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const w = await mountSuspended(DevGrid)
    await triggerKonami()
    await nextTick()
    expect(true).toBe(true) // no throw
    w.unmount()
  })
})
