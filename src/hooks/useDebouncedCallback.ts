import { useEffect, useMemo, useRef } from 'react'

export interface DebouncedCallback<Args extends unknown[]> {
	(...args: Args): void
	/** Cancel any pending invocation without running it. */
	cancel: () => void
	/** Immediately run the pending invocation (if any) and cancel the timer. */
	flush: () => void
	/** Whether an invocation is currently scheduled. */
	pending: () => boolean
}

/**
 * Returns a debounced version of `callback` that delays invocation until
 * `delay` ms have elapsed since the last call. The timer resets on every call,
 * always invokes the latest `callback` reference, and cleans up on unmount.
 *
 * Useful for search inputs where filtering should run as the user types
 * (with a pause) instead of only on Enter.
 */
export function useDebouncedCallback<Args extends unknown[]>(
	callback: (...args: Args) => void,
	delay: number
): DebouncedCallback<Args> {
	const callbackRef = useRef(callback)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastArgsRef = useRef<Args | null>(null)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		},
		[]
	)

	return useMemo(() => {
		const clearTimer = () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
		}

		const debounced = ((...args: Args) => {
			lastArgsRef.current = args
			clearTimer()
			timerRef.current = setTimeout(() => {
				timerRef.current = null
				const pendingArgs = lastArgsRef.current
				lastArgsRef.current = null
				if (pendingArgs) callbackRef.current(...pendingArgs)
			}, delay)
		}) as DebouncedCallback<Args>

		debounced.cancel = () => {
			clearTimer()
			lastArgsRef.current = null
		}

		debounced.flush = () => {
			if (timerRef.current) {
				clearTimer()
				const pendingArgs = lastArgsRef.current
				lastArgsRef.current = null
				if (pendingArgs) callbackRef.current(...pendingArgs)
			}
		}

		debounced.pending = () => timerRef.current !== null

		return debounced
	}, [delay])
}
