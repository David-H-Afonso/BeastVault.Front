import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedCallback } from './useDebouncedCallback'

describe('useDebouncedCallback', () => {
	beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
	afterEach(() => vi.useRealTimers())

	it('invokes the callback only after the delay elapses', () => {
		const cb = vi.fn()
		const { result } = renderHook(() => useDebouncedCallback(cb, 1500))

		act(() => result.current('a'))
		expect(cb).not.toHaveBeenCalled()

		act(() => vi.advanceTimersByTime(1499))
		expect(cb).not.toHaveBeenCalled()

		act(() => vi.advanceTimersByTime(1))
		expect(cb).toHaveBeenCalledTimes(1)
		expect(cb).toHaveBeenCalledWith('a')
	})

	it('resets the timer on every call so only the last value fires', () => {
		const cb = vi.fn()
		const { result } = renderHook(() => useDebouncedCallback(cb, 1500))

		act(() => result.current('a'))
		act(() => vi.advanceTimersByTime(1000))
		act(() => result.current('b'))
		act(() => vi.advanceTimersByTime(1000))
		expect(cb).not.toHaveBeenCalled()

		act(() => vi.advanceTimersByTime(500))
		expect(cb).toHaveBeenCalledTimes(1)
		expect(cb).toHaveBeenCalledWith('b')
	})

	it('cancel() prevents a pending invocation', () => {
		const cb = vi.fn()
		const { result } = renderHook(() => useDebouncedCallback(cb, 1500))

		act(() => result.current('a'))
		expect(result.current.pending()).toBe(true)

		act(() => result.current.cancel())
		expect(result.current.pending()).toBe(false)

		act(() => vi.advanceTimersByTime(2000))
		expect(cb).not.toHaveBeenCalled()
	})

	it('flush() runs the pending invocation immediately (used on blur/Enter)', () => {
		const cb = vi.fn()
		const { result } = renderHook(() => useDebouncedCallback(cb, 1500))

		act(() => result.current('a'))
		act(() => result.current.flush())

		expect(cb).toHaveBeenCalledTimes(1)
		expect(cb).toHaveBeenCalledWith('a')
		expect(result.current.pending()).toBe(false)
	})

	it('flush() does nothing when there is no pending invocation', () => {
		const cb = vi.fn()
		const { result } = renderHook(() => useDebouncedCallback(cb, 1500))

		act(() => result.current.flush())
		expect(cb).not.toHaveBeenCalled()
	})

	it('always invokes the latest callback reference', () => {
		const first = vi.fn()
		const second = vi.fn()
		const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 1500), {
			initialProps: { cb: first },
		})

		act(() => result.current('a'))
		rerender({ cb: second })
		act(() => vi.advanceTimersByTime(1500))

		expect(first).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledTimes(1)
		expect(second).toHaveBeenCalledWith('a')
	})

	it('cleans up the pending timer on unmount', () => {
		const cb = vi.fn()
		const { result, unmount } = renderHook(() => useDebouncedCallback(cb, 1500))

		act(() => result.current('a'))
		unmount()
		act(() => vi.advanceTimersByTime(2000))

		expect(cb).not.toHaveBeenCalled()
	})
})
