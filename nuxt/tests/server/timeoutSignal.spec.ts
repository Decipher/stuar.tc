import { describe, it, expect, vi, afterEach } from 'vitest'
import { timeoutSignal } from '../../server/utils/timeoutSignal'

describe('timeoutSignal', () => {
  afterEach(() => { vi.useRealTimers() })

  it('aborts with a TimeoutError after the given time', () => {
    vi.useFakeTimers()
    const { signal } = timeoutSignal(1000)
    vi.advanceTimersByTime(999)
    expect(signal.aborted).toBe(false)
    vi.advanceTimersByTime(1)
    expect(signal.aborted).toBe(true)
    expect((signal.reason as DOMException).name).toBe('TimeoutError')
  })

  it('never aborts once cleared', () => {
    vi.useFakeTimers()
    const { signal, clear } = timeoutSignal(1000)
    clear()
    vi.advanceTimersByTime(5000)
    expect(signal.aborted).toBe(false)
  })

  it('keeps the process alive while pending, unlike AbortSignal.timeout', () => {
    const { clear } = timeoutSignal(60_000)
    // A ref'd Node timer is an active handle the event loop waits on.
    const handles = (process as unknown as { getActiveResourcesInfo: () => string[] }).getActiveResourcesInfo()
    expect(handles).toContain('Timeout')
    clear()
  })
})
