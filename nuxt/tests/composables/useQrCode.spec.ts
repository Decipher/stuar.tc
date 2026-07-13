import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useQrCode } from '~/composables/useQrCode'

const HOME = 'https://stuar.tc/'

describe('useQrCode — determinism', () => {
  it('returns byte-identical matrices for the same value (cache hit)', () => {
    const a = useQrCode(HOME)
    const b = useQrCode(HOME)
    expect(b.value).toBe(a.value) // same reference via the module cache
    expect(JSON.stringify(a.value.modules)).toBe(JSON.stringify(b.value.modules))
  })
})

describe('useQrCode — reactivity', () => {
  it('regenerates the matrix when the value changes', () => {
    const url = ref(HOME)
    const matrix = useQrCode(url)
    const before = JSON.stringify(matrix.value.modules)
    url.value = 'https://stuar.tc/about'
    const after = JSON.stringify(matrix.value.modules)
    expect(after).not.toBe(before)
  })
})

describe('useQrCode — error correction', () => {
  it('defaults to level H', () => {
    const implicit = useQrCode(HOME)
    const explicitH = useQrCode(HOME, { level: 'H' })
    expect(JSON.stringify(implicit.value.modules)).toBe(JSON.stringify(explicitH.value.modules))
  })

  it('produces a different matrix at level L than at H', () => {
    const h = useQrCode(HOME, { level: 'H' })
    const l = useQrCode(HOME, { level: 'L' })
    expect(JSON.stringify(h.value.modules)).not.toBe(JSON.stringify(l.value.modules))
  })
})

describe('useQrCode — matrix shape', () => {
  it('exposes a square boolean grid with version and size', () => {
    const matrix = useQrCode(HOME).value
    expect(matrix.size).toBeGreaterThan(0)
    expect(matrix.modules.length).toBe(matrix.size)
    expect(matrix.modules.every(row => row.length === matrix.size)).toBe(true)
    expect(matrix.version).toBeGreaterThanOrEqual(1)
    // a real QR always has both dark and light modules
    const flat = matrix.modules.flat()
    expect(flat.some(Boolean)).toBe(true)
    expect(flat.some(m => !m)).toBe(true)
  })
})
