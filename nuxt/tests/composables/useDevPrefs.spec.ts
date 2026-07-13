import { describe, it, expect } from 'vitest'
import { isRef } from 'vue'
import { useDevPrefs } from '~/composables/useDevPrefs'

describe('useDevPrefs', () => {
  it('returns showFiltered as a ref', () => {
    const { showFiltered } = useDevPrefs()
    expect(isRef(showFiltered)).toBe(true)
  })

  it('showFiltered is shared across calls (module-level singleton)', () => {
    const a = useDevPrefs()
    const b = useDevPrefs()
    a.showFiltered.value = true
    expect(b.showFiltered.value).toBe(true)
    a.showFiltered.value = false
  })
})
