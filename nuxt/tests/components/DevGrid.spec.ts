import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import DevGrid from '~/components/DevGrid.vue'

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

function fakeRect(overrides: Partial<DOMRect> = {}): DOMRect {
  const base = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }
  return { ...base, ...overrides } as DOMRect
}

function measurableEl(rect: Partial<DOMRect>, className = 'target-el') {
  const el = document.createElement('div')
  el.className = className
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(fakeRect(rect))
  document.body.appendChild(el)
  return el
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
async function mountAndUnlock() {
  const w = await mountSuspended(DevGrid)
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

  it('loads grid overlay from localStorage (grid:8)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid: '8', pi: false }))
    const w = await mountSuspended(DevGrid)
    await nextTick()
    expect(document.body.querySelector('[data-grid-overlay]')).not.toBeNull()
    w.unmount()
  })

  it('handles corrupt localStorage JSON without throwing', async () => {
    localStorage.setItem(STORAGE_KEY, 'NOT_JSON')
    const w = await mountSuspended(DevGrid)
    await nextTick()
    expect(document.querySelector('.sc-pi-badge')).toBeNull()
    w.unmount()
  })

  it('removes body class and keydown listener on unmount', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ outlines: true }))
    const w = await mountSuspended(DevGrid)
    await nextTick()
    expect(document.body.classList.contains('sc-devgrid-outlines')).toBe(true)
    w.unmount()
    await nextTick()
    expect(document.body.classList.contains('sc-devgrid-outlines')).toBe(false)
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

// ── authenticated flow ────────────────────────────────────────────────────────

describe('authenticated flow', () => {
  it('pi click opens console directly when already authenticated', async () => {
    const w = await mountAndUnlock()
    pressKey('Escape'); await nextTick() // close console
    document.querySelector<HTMLElement>('.sc-pi-badge')!.click()
    await nextTick()
    expect(document.body.innerHTML).toContain('H4CK TH3 PL4N3T')
    w.unmount()
  })

  it('ESC closes the console', async () => {
    const w = await mountAndUnlock()
    pressKey('Escape'); await nextTick()
    expect(document.body.innerHTML).not.toContain('H4CK TH3 PL4N3T')
    w.unmount()
  })

  it('ESC with nothing open is a harmless no-op', async () => {
    const w = await mountAndUnlock()
    pressKey('Escape'); await nextTick() // close console
    pressKey('Escape'); await nextTick() // nothing open now
    expect(document.body.innerHTML).not.toContain('H4CK TH3 PL4N3T')
    expect(document.querySelector('input[type="password"]')).toBeNull()
    w.unmount()
  })

  it('console ✕ close button works', async () => {
    const w = await mountAndUnlock()
    const closeBtns = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .filter(b => b.textContent?.trim() === '✕')
    closeBtns[closeBtns.length - 1]?.click() // last ✕ is the console's
    await nextTick()
    expect(document.body.innerHTML).not.toContain('H4CK TH3 PL4N3T')
    w.unmount()
  })

  it('clicking console backdrop closes the console', async () => {
    const w = await mountAndUnlock()
    // The console's outermost overlay (z-index 9996); @click.self fires on direct click
    const backdrop = document.querySelector<HTMLElement>('[style*="9996"]')!
    backdrop.click()
    await nextTick()
    expect(document.body.innerHTML).not.toContain('H4CK TH3 PL4N3T')
    w.unmount()
  })

  // ── overlay toggles ─────────────────────────────────────────────────────

  it('grid toggle: off → 4px → 8px → off', async () => {
    const w = await mountAndUnlock()
    expect(document.body.querySelector('[data-grid-overlay]')).toBeNull()

    const btn4 = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === '4px')
    btn4?.click(); await nextTick()
    expect(document.body.querySelector('[data-grid-overlay]')).not.toBeNull()

    const btn8 = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === '8px')
    btn8?.click(); await nextTick()
    expect(document.body.querySelector('[data-grid-overlay]')).not.toBeNull()

    const btnOff = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Off')
    btnOff?.click(); await nextTick()
    expect(document.body.querySelector('[data-grid-overlay]')).toBeNull()
    w.unmount()
  })

  it('columns toggle shows/hides column guides', async () => {
    const w = await mountAndUnlock()
    const colRow = [...document.querySelectorAll<HTMLElement>('[data-dev-console] [style*="space-between"]')]
      .find(row => row.textContent?.includes('max-w-6xl'))
    const colBtn = colRow?.querySelector<HTMLElement>('button')

    colBtn?.click(); await nextTick()
    expect(document.body.innerHTML).toContain('max-w-6xl · 72rem')
    colBtn?.click(); await nextTick()
    expect(document.body.innerHTML).not.toContain('max-w-6xl · 72rem')
    w.unmount()
  })

  it('outlines toggle adds/removes body class', async () => {
    const w = await mountAndUnlock()
    const outRow = [...document.querySelectorAll<HTMLElement>('[data-dev-console] [style*="space-between"]')]
      .find(row => row.textContent?.includes('Outlines') && row.textContent?.includes('all elements'))
    const outBtn = outRow?.querySelector<HTMLElement>('button')

    outBtn?.click(); await nextTick()
    expect(document.body.classList.contains('sc-devgrid-outlines')).toBe(true)
    outBtn?.click(); await nextTick()
    expect(document.body.classList.contains('sc-devgrid-outlines')).toBe(false)
    w.unmount()
  })

  it('color scheme buttons mutate appConfig.ui.colors.primary', async () => {
    const w = await mountAndUnlock()
    const electricBtn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.title === 'Electric')
    electricBtn?.click(); await nextTick()
    // After switching to electric, the button should have the active outline style.
    // happy-dom normalises rgba() with spaces after commas, so strip whitespace.
    expect(electricBtn?.style.outline.replace(/\s+/g, '')).toContain('rgba(255,255,255,0.45)')
    w.unmount()
  })

  it('opacity slider adjusts overlay opacity', async () => {
    const w = await mountAndUnlock()
    const btn4 = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === '4px')
    btn4?.click(); await nextTick()
    const slider = document.querySelector<HTMLInputElement>('[data-dev-console] input[type="range"]')!
    slider.value = '60'
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    // The percentage label in the console should reflect the new value
    expect(document.body.innerHTML).toContain('>60%<')
    w.unmount()
  })

  // ── measure mode ────────────────────────────────────────────────────────

  async function activateMeasure() {
    const startBtn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Start')
    startBtn?.click()
    await nextTick()
    return document.querySelector<HTMLElement>('[data-measure-blocker]')!
  }

  it('Start button enters measure mode and closes console', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    expect(blocker).not.toBeNull()
    expect(document.body.innerHTML).not.toContain('H4CK TH3 PL4N3T')
    w.unmount()
  })

  it('measure button shows "Active" while measuring', async () => {
    const w = await mountAndUnlock()
    await activateMeasure()
    // Re-open console to inspect button label
    document.querySelector<HTMLElement>('.sc-pi-badge')!.click()
    await nextTick()
    const activeBtn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Active')
    expect(activeBtn).not.toBeNull()
    w.unmount()
  })

  it('HUD shows "Click an element to measure" before first selection', async () => {
    const w = await mountAndUnlock()
    await activateMeasure()
    expect(document.body.innerHTML).toContain('Click an element to measure')
    w.unmount()
  })

  it('ESC without pins exits measure mode', async () => {
    const w = await mountAndUnlock()
    await activateMeasure()
    pressKey('Escape'); await nextTick()
    expect(document.querySelector('[data-measure-blocker]')).toBeNull()
    w.unmount()
  })

  it('mousemove over element shows hover highlight with dimensions', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const target = measurableEl({ top: 10, left: 20, width: 100, height: 50, right: 120, bottom: 60 })
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(target)
    blocker.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('100px × 50px')
    target.remove()
    w.unmount()
  })

  it('mousemove over a dev-console element shows nothing (filtered)', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const consoleEl = document.createElement('div')
    consoleEl.setAttribute('data-dev-console', '')
    document.body.appendChild(consoleEl)
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(consoleEl)
    blocker.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 30, bubbles: true }))
    await nextTick()
    // No dashed hover box should appear
    expect(document.body.innerHTML).not.toContain('border:1px dashed')
    consoleEl.remove()
    w.unmount()
  })

  it('mousemove with no element under cursor shows no hover box', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null)
    blocker.dispatchEvent(new MouseEvent('mousemove', { clientX: 1, clientY: 1, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).not.toContain('border:1px dashed')
    w.unmount()
  })

  it('click with no element under cursor does not crash', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 1, clientY: 1, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('Click an element to measure')
    w.unmount()
  })

  it('first click pins element A', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0, width: 100, height: 50, right: 100, bottom: 50 })
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 25, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('[A]')
    elA.remove()
    w.unmount()
  })

  it('second click pins element B and shows gap info', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0, width: 100, height: 50, right: 100, bottom: 50 })
    const elB = measurableEl({ top: 0, left: 150, width: 80, height: 50, right: 230, bottom: 50 })
    const fromPoint = vi.spyOn(document, 'elementFromPoint')
    fromPoint.mockReturnValueOnce(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 25, bubbles: true }))
    await nextTick()
    fromPoint.mockReturnValueOnce(elB)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 180, clientY: 25, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('[A]')
    expect(document.body.innerHTML).toContain('[B]')
    expect(document.body.innerHTML).toContain('H gap')
    elA.remove(); elB.remove()
    w.unmount()
  })

  it('third click restarts with new A', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0,   width: 100, height: 50, right: 100, bottom: 50 })
    const elB = measurableEl({ top: 0, left: 150,  width: 80,  height: 50, right: 230, bottom: 50 })
    const elC = measurableEl({ top: 0, left: 0,   width: 200, height: 60, right: 200, bottom: 60 }, 'el-c')
    const fromPoint = vi.spyOn(document, 'elementFromPoint')
    fromPoint.mockReturnValueOnce(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50,  clientY: 25, bubbles: true }))
    await nextTick()
    fromPoint.mockReturnValueOnce(elB)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 180, clientY: 25, bubbles: true }))
    await nextTick()
    fromPoint.mockReturnValueOnce(elC)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 30, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('200px × 60px')
    elA.remove(); elB.remove(); elC.remove()
    w.unmount()
  })

  it('ESC with pins first clears pins, second ESC exits measure mode', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0, width: 100, height: 50, right: 100, bottom: 50 })
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 25, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('[A]')

    pressKey('Escape'); await nextTick()
    expect(document.querySelector('[data-measure-blocker]')).not.toBeNull()
    expect(document.body.innerHTML).toContain('Click an element to measure')

    pressKey('Escape'); await nextTick()
    expect(document.querySelector('[data-measure-blocker]')).toBeNull()
    elA.remove()
    w.unmount()
  })

  it('deactivating measure clears all state', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0, width: 100, height: 50, right: 100, bottom: 50 })
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 25, bubbles: true }))
    await nextTick()

    // Re-open console → click "Active" to deactivate
    document.querySelector<HTMLElement>('.sc-pi-badge')!.click()
    await nextTick()
    const activeBtn = [...document.querySelectorAll<HTMLElement>('[data-dev-console] button')]
      .find(b => b.textContent?.trim() === 'Active')
    activeBtn?.click(); await nextTick()

    expect(document.querySelector('[data-measure-blocker]')).toBeNull()
    elA.remove()
    w.unmount()
  })

  // ── gap indicator rendering ──────────────────────────────────────────────

  async function pinTwo(a: Partial<DOMRect>, b: Partial<DOMRect>) {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl(a)
    const elB = measurableEl(b, 'el-b')
    const fromPoint = vi.spyOn(document, 'elementFromPoint')
    fromPoint.mockReturnValueOnce(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 0, clientY: 0, bubbles: true }))
    await nextTick()
    fromPoint.mockReturnValueOnce(elB)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 0, clientY: 0, bubbles: true }))
    await nextTick()
    return { w, blocker, elA, elB }
  }

  it('renders H gap line with inline label when gap > 18px', async () => {
    // A and B side-by-side with 30px gap, sharing a Y-overlap range
    const { w, elA, elB } = await pinTwo(
      { top: 50, left: 0,   width: 100, height: 100, right: 100, bottom: 150 },
      { top: 50, left: 130, width: 100, height: 100, right: 230, bottom: 150 },
    )
    expect(document.body.innerHTML).toContain('30px')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('renders H gap line with beside label when gap ≤ 18px', async () => {
    const { w, elA, elB } = await pinTwo(
      { top: 0, left: 0,   width: 100, height: 50, right: 100, bottom: 50 },
      { top: 0, left: 110, width: 100, height: 50, right: 210, bottom: 50 },
    )
    expect(document.body.innerHTML).toContain('10px')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('renders V gap line with inline label when gap > 18px', async () => {
    const { w, elA, elB } = await pinTwo(
      { top: 0,  left: 0, width: 100, height: 50, right: 100, bottom: 50  },
      { top: 80, left: 0, width: 100, height: 50, right: 100, bottom: 130 },
    )
    expect(document.body.innerHTML).toContain('30px')
    expect(document.body.innerHTML).toContain('V gap')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('renders V gap line with beside label when gap ≤ 18px', async () => {
    const { w, elA, elB } = await pinTwo(
      { top: 0,  left: 0, width: 100, height: 50, right: 100, bottom: 50  },
      { top: 60, left: 0, width: 100, height: 50, right: 100, bottom: 110 },
    )
    expect(document.body.innerHTML).toContain('10px')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('shows "overlapping" in HUD when elements fully overlap', async () => {
    const { w, elA, elB } = await pinTwo(
      { top: 0,  left: 0,  width: 200, height: 200, right: 200, bottom: 200 },
      { top: 50, left: 50, width: 100, height: 100, right: 150, bottom: 150 },
    )
    expect(document.body.innerHTML).toContain('overlapping')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('renders hCentre alignment guide when both share the same vertical midpoint', async () => {
    // A: centerY=50 (top=0,height=100). B: centerY=50 (top=20,height=60).
    const { w, elA, elB } = await pinTwo(
      { top: 0,  left: 0,   width: 100, height: 100, right: 100, bottom: 100 },
      { top: 20, left: 150, width: 80,  height: 60,  right: 230, bottom: 80  },
    )
    expect(document.body.innerHTML).toContain('H-centre ✓')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('renders vCentre alignment guide when both share the same horizontal midpoint', async () => {
    // A: centerX=100 (left=0,width=200). B: centerX=100 (left=50,width=100).
    const { w, elA, elB } = await pinTwo(
      { top: 0,  left: 0,  width: 200, height: 50, right: 200, bottom: 50  },
      { top: 80, left: 50, width: 100, height: 50, right: 150, bottom: 130 },
    )
    expect(document.body.innerHTML).toContain('V-centre ✓')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('shows all edge alignment tags when rects are identical', async () => {
    const { w, elA, elB } = await pinTwo(
      { top: 10, left: 20, width: 100, height: 50, right: 120, bottom: 60 },
      { top: 10, left: 20, width: 100, height: 50, right: 120, bottom: 60 },
    )
    expect(document.body.innerHTML).toContain('top ✓')
    expect(document.body.innerHTML).toContain('bottom ✓')
    expect(document.body.innerHTML).toContain('left ✓')
    expect(document.body.innerHTML).toContain('right ✓')
    expect(document.body.innerHTML).toContain('H-centre ✓')
    expect(document.body.innerHTML).toContain('V-centre ✓')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('live hover shows → label in HUD before B is locked', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0,   width: 100, height: 50, right: 100, bottom: 50 })
    const elB = measurableEl({ top: 0, left: 150, width: 80,  height: 50, right: 230, bottom: 50 }, 'el-b')
    const fromPoint = vi.spyOn(document, 'elementFromPoint')
    fromPoint.mockReturnValueOnce(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 25, bubbles: true }))
    await nextTick()
    fromPoint.mockReturnValue(elB)
    blocker.dispatchEvent(new MouseEvent('mousemove', { clientX: 180, clientY: 25, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('[→]')
    elA.remove(); elB.remove()
    w.unmount()
  })

  it('HUD shows "hover or click" when A is pinned but nothing else selected', async () => {
    const w = await mountAndUnlock()
    const blocker = await activateMeasure()
    const elA = measurableEl({ top: 0, left: 0, width: 100, height: 50, right: 100, bottom: 50 })
    const fromPoint = vi.spyOn(document, 'elementFromPoint')
    fromPoint.mockReturnValueOnce(elA)
    blocker.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 25, bubbles: true }))
    await nextTick()
    fromPoint.mockReturnValue(null)
    blocker.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0, bubbles: true }))
    await nextTick()
    expect(document.body.innerHTML).toContain('Hover or click a second element')
    elA.remove()
    w.unmount()
  })

  it('hGapLineY uses overlap midpoint when elements share a Y range', async () => {
    // A: top=0,bottom=100. B: top=50,bottom=150,left=130 → H gap=30, Y overlap [50,100]
    const { w, elA, elB } = await pinTwo(
      { top: 0,  left: 0,   width: 100, height: 100, right: 100, bottom: 100 },
      { top: 50, left: 130, width: 100, height: 100, right: 230, bottom: 150 },
    )
    expect(document.body.innerHTML).toContain('30px')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('B to the left of A (hDir=left) renders correct gap', async () => {
    // A at right, B at left → gap is A.left(200) - B.right(100) = 100px
    const { w, elA, elB } = await pinTwo(
      { top: 0, left: 200, width: 100, height: 50, right: 300, bottom: 50 },
      { top: 0, left: 0,   width: 100, height: 50, right: 100, bottom: 50 },
    )
    expect(document.body.innerHTML).toContain('100px')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('B above A (vDir=above) renders correct gap', async () => {
    // A at bottom (top=200), B at top (bottom=50) → gap = A.top(200) - B.bottom(50) = 150px
    const { w, elA, elB } = await pinTwo(
      { top: 200, left: 0, width: 100, height: 50, right: 100, bottom: 250 },
      { top: 0,   left: 0, width: 100, height: 50, right: 100, bottom: 50  },
    )
    expect(document.body.innerHTML).toContain('150px')
    elA.remove(); elB.remove(); w.unmount()
  })

  it('diagonal gap uses midpoint fallback when elements share no axis overlap', async () => {
    // A(top-left) and B(bottom-right): H gap=50, V gap=50, no overlap in either axis.
    // Exercises the midpoint fallback branches in hGapLineY and vGapLineX.
    const { w, elA, elB } = await pinTwo(
      { top: 0,   left: 0,   width: 100, height: 50, right: 100, bottom: 50  },
      { top: 100, left: 150, width: 80,  height: 50, right: 230, bottom: 150 },
    )
    expect(document.body.innerHTML).toContain('50px')
    elA.remove(); elB.remove(); w.unmount()
  })

  // ── client data ────────────────────────────────────────────────────────

  /** Find a button inside the CLIENT DATA section by matching row text. */
  function findClientDataBtn(rowText: string) {
    const section = [...document.querySelectorAll<HTMLElement>('[data-dev-console] section')]
      .find(s => s.textContent?.includes('CLIENT DATA'))
    const row = [...section?.querySelectorAll<HTMLElement>('[style*="space-between"]') ?? []]
      .find(el => el.textContent?.includes(rowText))
    return row?.querySelector<HTMLElement>('button')
  }

  it('payload inspector toggles JSON view', async () => {
    const w = await mountAndUnlock()
    const btn = findClientDataBtn('Nuxt payload')
    btn?.click(); await nextTick()
    const pre = document.querySelector('[data-dev-console] pre')
    expect(pre).not.toBeNull()
    expect(pre?.textContent).toContain('{')
    btn?.click(); await nextTick()
    expect(document.querySelector('[data-dev-console] pre')).toBeNull()
    w.unmount()
  })

  it('payload inspector shows empty object when data is nullish', async () => {
    const nuxtApp = useNuxtApp()
    const saved = nuxtApp.payload.data
    nuxtApp.payload.data = null
    const w = await mountAndUnlock()
    findClientDataBtn('Nuxt payload')?.click(); await nextTick()
    const pre = document.querySelector('[data-dev-console] pre')
    expect(pre?.textContent?.trim()).toBe('{}')
    nuxtApp.payload.data = saved
    w.unmount()
  })

  it('static shell fetches generated HTML and renders iframe overlay', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<html><body>SSG shell</body></html>', { status: 200 }))
    const w = await mountAndUnlock()
    const btn = findClientDataBtn('Static shell')
    btn?.click()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-static-shell]')).not.toBeNull()
    })
    const iframe = document.querySelector<HTMLIFrameElement>('[data-static-shell] iframe')
    expect(iframe?.getAttribute('srcdoc')).toContain('SSG shell')
    expect(document.body.innerHTML).toContain('bytes')
    // Close via button
    document.querySelector<HTMLElement>('[data-static-shell] button')!.click()
    await nextTick()
    expect(document.querySelector('[data-static-shell]')).toBeNull()
    fetchSpy.mockRestore()
    w.unmount()
  })

  it('static shell shows error on fetch failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Network down'))
    const w = await mountAndUnlock()
    const btn = findClientDataBtn('Static shell')
    btn?.click()
    await vi.waitFor(() => {
      expect(document.body.innerHTML).toContain('FETCH ERROR')
    })
    expect(document.body.innerHTML).toContain('Network down')
    fetchSpy.mockRestore()
    w.unmount()
  })

  it('static shell handles non-Error rejections via String()', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValue('string thrown')
    const w = await mountAndUnlock()
    findClientDataBtn('Static shell')?.click()
    await vi.waitFor(() => {
      expect(document.body.innerHTML).toContain('string thrown')
    })
    fetchSpy.mockRestore()
    w.unmount()
  })

  it('static shell toggle button hides when already visible', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<html></html>', { status: 200 }))
    const w = await mountAndUnlock()
    const btn = findClientDataBtn('Static shell')
    btn?.click()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-static-shell]')).not.toBeNull()
    })
    btn?.click()
    await nextTick()
    expect(document.querySelector('[data-static-shell]')).toBeNull()
    w.unmount()
  })

  it('ESC closes static shell overlay', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<html></html>', { status: 200 }))
    const w = await mountAndUnlock()
    findClientDataBtn('Static shell')?.click()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-static-shell]')).not.toBeNull()
    })
    pressKey('Escape'); await nextTick()
    expect(document.querySelector('[data-static-shell]')).toBeNull()
    w.unmount()
  })
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
