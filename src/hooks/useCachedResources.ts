import { useState, useEffect, useCallback } from 'react'
import { staticResourceCache } from '../services/StaticResourceCache'

/**
 * Hook for caching and loading images with automatic fallback
 */
export function useCachedImage(url: string | null): {
	imageUrl: string | null
	isLoading: boolean
	error: string | null
} {
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!url) {
			setImageUrl(null)
			setIsLoading(false)
			setError(null)
			return
		}

		setIsLoading(true)
		setError(null)

		// First, check if we have a cached version
		const cached = staticResourceCache.getCachedImage(url)
		if (cached !== url) {
			// We have a cached base64 version
			setImageUrl(cached)
			setIsLoading(false)
			return
		}

		// Cache the image asynchronously
		staticResourceCache
			.cacheImage(url)
			.then((cachedUrl) => {
				setImageUrl(cachedUrl)
				setIsLoading(false)
			})
			.catch((err) => {
				console.warn('Failed to cache image:', err)
				setImageUrl(url) // Fallback to original URL
				setError(err.message)
				setIsLoading(false)
			})
	}, [url])

	return { imageUrl, isLoading, error }
}

/**
 * Hook for caching API responses with automatic revalidation
 */
export function useCachedApi<T>(
	url: string | null,
	enabled: boolean = true
): {
	data: T | null
	isLoading: boolean
	error: string | null
	refetch: () => Promise<void>
} {
	const [data, setData] = useState<T | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchData = useCallback(async () => {
		if (!url || !enabled) return

		setIsLoading(true)
		setError(null)

		try {
			const result = await staticResourceCache.fetchWithCache<T>(url)
			setData(result)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error'
			setError(errorMessage)
			console.error('API fetch error:', err)
		} finally {
			setIsLoading(false)
		}
	}, [url, enabled])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	return {
		data,
		isLoading,
		error,
		refetch: fetchData,
	}
}

/**
 * Hook for preloading multiple images
 */
export function useImagePreloader(urls: string[]): {
	loadedCount: number
	totalCount: number
	isComplete: boolean
} {
	const [loadedCount, setLoadedCount] = useState(0)
	const totalCount = urls.length

	useEffect(() => {
		if (urls.length === 0) return

		setLoadedCount(0)
		let completed = 0

		const preloadPromises = urls.map(async (url) => {
			try {
				await staticResourceCache.cacheImage(url)
				completed++
				setLoadedCount(completed)
			} catch (error) {
				console.warn(`Failed to preload image: ${url}`, error)
				completed++
				setLoadedCount(completed)
			}
		})

		Promise.allSettled(preloadPromises)
	}, [urls])

	return {
		loadedCount,
		totalCount,
		isComplete: loadedCount === totalCount && totalCount > 0,
	}
}
