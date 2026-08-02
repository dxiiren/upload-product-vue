import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { watch, nextTick } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'

// useDebouncedRef backs the 500 ms search box in ProductIndex: assignments are
// held back until the caller stops typing, so a burst of keystrokes results in
// exactly one fetch. These specs pin the trailing-edge semantics directly, with
// no component in the way.

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebouncedRef', () => {
  it('exposes the initial value synchronously', () => {
    const debounced = useDebouncedRef('initial', 500)

    expect(debounced.value).toBe('initial')
  })

  it('holds a new value back until the delay has fully elapsed (trailing edge)', () => {
    const debounced = useDebouncedRef('', 500)

    debounced.value = 'samsung'
    expect(debounced.value).toBe('')

    // One tick short of the delay: still the old value.
    vi.advanceTimersByTime(499)
    expect(debounced.value).toBe('')

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('samsung')
  })

  it('restarts the timer on every set, so only the last value of a burst lands', () => {
    const debounced = useDebouncedRef('', 500)

    debounced.value = 's'
    vi.advanceTimersByTime(400)
    debounced.value = 'sa'
    vi.advanceTimersByTime(400)
    debounced.value = 'sam'
    vi.advanceTimersByTime(400)

    // 1200 ms of wall clock have passed, but no 500 ms gap between keystrokes.
    expect(debounced.value).toBe('')

    vi.advanceTimersByTime(100)
    expect(debounced.value).toBe('sam')
  })

  it('notifies watchers exactly once per settled burst', async () => {
    const debounced = useDebouncedRef('', 500)
    const onChange = vi.fn()
    watch(debounced, onChange)

    debounced.value = 's'
    debounced.value = 'sa'
    debounced.value = 'sam'
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toBe('sam')
  })

  it('notifies watchers again for a separate burst after the first has settled', async () => {
    const debounced = useDebouncedRef('', 500)
    const onChange = vi.fn()
    watch(debounced, onChange)

    debounced.value = 'sam'
    vi.advanceTimersByTime(500)
    await nextTick()

    debounced.value = 'lenovo'
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(debounced.value).toBe('lenovo')
  })

  it('honours a custom delay', () => {
    const debounced = useDebouncedRef('', 1000)

    debounced.value = 'slow'
    vi.advanceTimersByTime(999)
    expect(debounced.value).toBe('')

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('slow')
  })

  it('defaults to a 300 ms delay when none is given', () => {
    const debounced = useDebouncedRef('')

    debounced.value = 'default'
    vi.advanceTimersByTime(299)
    expect(debounced.value).toBe('')

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('default')
  })

  it('debounces non-string values the same way', () => {
    const debounced = useDebouncedRef(0, 500)

    debounced.value = 42
    expect(debounced.value).toBe(0)

    vi.advanceTimersByTime(500)
    expect(debounced.value).toBe(42)
  })
})
