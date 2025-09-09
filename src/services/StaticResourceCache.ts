import { cacheService } from './CacheService'

/**
 * Static Resource Cache Service
 * Handles caching of static resources like sprites, icons, and API responses
 */
/**
 * Static Resource Cache Service
 * Handles caching of static resources like sprites, icons, and API responses
 */
class StaticResourceCache {
	private readonly IMAGE_CACHE_PREFIX = 'image_'
	private readonly API_CACHE_PREFIX = 'api_'

	// Cache durations (in milliseconds)
	private readonly ONE_WEEK = 7 * 24 * 60 * 60 * 1000
	private readonly ONE_MONTH = 30 * 24 * 60 * 60 * 1000
	private readonly THREE_MONTHS = 90 * 24 * 60 * 60 * 1000

	/**
	 * Cache a static image URL as base64 data
	 */
	async cacheImage(url: string): Promise<string> {
		const cacheKey = `${this.IMAGE_CACHE_PREFIX}${this.hashUrl(url)}`

		// Check if already cached
		const cached = await cacheService.get<string>(cacheKey)
		if (cached) {
			return cached
		}

		try {
			// Fetch and convert to base64
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.statusText}`)
			}

			const blob = await response.blob()
			const base64 = await this.blobToBase64(blob)

			// Cache for 3 months (static images rarely change)
			cacheService.set(cacheKey, base64, this.THREE_MONTHS)

			return base64
		} catch (error) {
			console.warn(`Failed to cache image ${url}:`, error)
			// Return the original URL as fallback
			return url
		}
	}

	/**
	 * Get cached image or return original URL
	 */
	async getCachedImage(url: string): Promise<string> {
		const cacheKey = `${this.IMAGE_CACHE_PREFIX}${this.hashUrl(url)}`
		const cached = await cacheService.get<string>(cacheKey)
		return cached || url
	}

	/**
	 * Cache API response data
	 */
	async cacheApiResponse<T>(url: string, data: T, customExpiry?: number): Promise<void> {
		const cacheKey = `${this.API_CACHE_PREFIX}${this.hashUrl(url)}`
		const expiry = customExpiry || this.ONE_WEEK
		await cacheService.set(cacheKey, data, expiry)
	}

	/**
	 * Get cached API response
	 */
	async getCachedApiResponse<T>(url: string): Promise<T | null> {
		const cacheKey = `${this.API_CACHE_PREFIX}${this.hashUrl(url)}`
		return await cacheService.get<T>(cacheKey)
	}

	/**
	 * Enhanced fetch with automatic caching for static resources
	 */
	async fetchWithCache<T>(url: string, options?: RequestInit): Promise<T> {
		// Check cache first
		const cached = await this.getCachedApiResponse<T>(url)
		if (cached) {
			return cached
		}

		// Fetch from network
		const response = await fetch(url, options)
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const data = (await response.json()) as T

		// Cache based on URL type
		let expiry = this.ONE_WEEK
		if (this.isPokeApiUrl(url)) {
			expiry = this.ONE_MONTH // PokeAPI data is very stable
		} else if (this.isStaticSpriteUrl(url)) {
			expiry = this.THREE_MONTHS // Static sprites never change
		}

		// Cache the response
		await this.cacheApiResponse(url, data, expiry)

		return data
	}

	/**
	 * Prefetch and cache an image
	 */
	async prefetchImage(url: string): Promise<void> {
		try {
			await this.cacheImage(url)
		} catch (error) {
			console.warn(`Failed to prefetch image ${url}:`, error)
		}
	}

	/**
	 * Batch prefetch multiple images
	 */
	async prefetchImages(urls: string[]): Promise<void> {
		const promises = urls.map((url) => this.prefetchImage(url))
		await Promise.allSettled(promises)
	}

	/**
	 * Clear all static resource caches
	 */
	async clearAll(): Promise<void> {
		await cacheService.clear()
	}

	/**
	 * Get cache statistics
	 */
	async getCacheStats(): Promise<{ totalItems: number; totalSize: string }> {
		const stats = await cacheService.getStats()
		return {
			totalItems: stats.totalItems,
			totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
		}
	}

	// Private utility methods

	private hashUrl(url: string): string {
		// Simple hash function for URL
		let hash = 0
		for (let i = 0; i < url.length; i++) {
			const char = url.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36)
	}

	private async blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = reject
			reader.readAsDataURL(blob)
		})
	}

	private isPokeApiUrl(url: string): boolean {
		return url.includes('pokeapi.co')
	}

	private isStaticSpriteUrl(url: string): boolean {
		return url.includes('github.com') || url.includes('githubusercontent.com')
	}
}

// Export singleton instance
export const staticResourceCache = new StaticResourceCache()
export default staticResourceCache
