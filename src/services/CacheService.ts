/**
 * Cache service for storing API responses in Cache Storage
 */

interface CacheItem<T> {
	data: T
	timestamp: number
	expiry: number
}

class CacheService {
	private readonly CACHE_NAME = 'beastvault_cache'
	private readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

	/**
	 * Check if Cache API is available
	 */
	private isCacheAvailable(): boolean {
		return typeof caches !== 'undefined' && caches !== null
	}

	/**
	 * Store data in cache with expiry
	 */
	async set<T>(key: string, data: T, expiryMs?: number): Promise<void> {
		if (!this.isCacheAvailable()) {
			console.warn('Cache API not available, skipping cache set')
			return
		}

		try {
			const cache = await caches.open(this.CACHE_NAME)
			const expiry = expiryMs || this.DEFAULT_EXPIRY
			const cacheItem: CacheItem<T> = {
				data,
				timestamp: Date.now(),
				expiry,
			}
			const response = new Response(JSON.stringify(cacheItem), {
				headers: { 'Content-Type': 'application/json' },
			})
			await cache.put(key, response)
		} catch (error) {
			console.warn('Failed to store item in cache:', error)
		}
	}

	/**
	 * Get data from cache if not expired
	 */
	async get<T>(key: string): Promise<T | null> {
		if (!this.isCacheAvailable()) {
			console.warn('Cache API not available, skipping cache get')
			return null
		}

		try {
			const cache = await caches.open(this.CACHE_NAME)
			const response = await cache.match(key)
			if (!response) return null

			const cacheItem: CacheItem<T> = await response.json()
			const now = Date.now()

			// Check if expired
			if (now - cacheItem.timestamp > cacheItem.expiry) {
				await this.delete(key)
				return null
			}

			return cacheItem.data
		} catch (error) {
			console.warn('Failed to retrieve item from cache:', error)
			await this.delete(key) // Clean up corrupted cache entry
			return null
		}
	}

	/**
	 * Delete specific cache entry
	 */
	async delete(key: string): Promise<void> {
		if (!this.isCacheAvailable()) {
			console.warn('Cache API not available, skipping cache delete')
			return
		}

		try {
			const cache = await caches.open(this.CACHE_NAME)
			await cache.delete(key)
		} catch (error) {
			console.warn('Failed to delete cache item:', error)
		}
	}

	/**
	 * Clear all cache entries
	 */
	async clear(): Promise<void> {
		if (!this.isCacheAvailable()) {
			console.warn('Cache API not available, skipping cache clear')
			return
		}

		try {
			await caches.delete(this.CACHE_NAME)
		} catch (error) {
			console.warn('Failed to clear cache:', error)
		}
	}

	/**
	 * Get cache statistics
	 */
	async getStats(): Promise<{ totalItems: number; totalSize: number }> {
		if (!this.isCacheAvailable()) {
			console.warn('Cache API not available, returning empty stats')
			return { totalItems: 0, totalSize: 0 }
		}

		try {
			const cache = await caches.open(this.CACHE_NAME)
			const keys = await cache.keys()

			let totalSize = 0
			for (const request of keys) {
				const response = await cache.match(request)
				if (response) {
					const clonedResponse = response.clone()
					const text = await clonedResponse.text()
					totalSize += new Blob([text]).size
				}
			}

			return {
				totalItems: keys.length,
				totalSize,
			}
		} catch (error) {
			console.warn('Failed to get cache stats:', error)
			return { totalItems: 0, totalSize: 0 }
		}
	}

	/**
	 * Clean up expired entries
	 */
	async cleanup(): Promise<void> {
		try {
			const cache = await caches.open(this.CACHE_NAME)
			const keys = await cache.keys()

			const now = Date.now()
			for (const request of keys) {
				try {
					const response = await cache.match(request)
					if (response) {
						const cacheItem: CacheItem<any> = await response.json()
						if (now - cacheItem.timestamp > cacheItem.expiry) {
							await cache.delete(request)
						}
					}
				} catch {
					// Remove corrupted entries
					await cache.delete(request)
				}
			}
		} catch (error) {
			console.warn('Failed to cleanup cache:', error)
		}
	}
}

// Export singleton instance
export const cacheService = new CacheService()

// Cache key generators
export const CacheKeys = {
	pokeball: (ballName: string) => {
		if (!ballName) return 'pokeball_unknown'
		return `pokeball_${ballName.toLowerCase().replace(/\s+/g, '_')}`
	},
	pokemon: (speciesId: number, form: number = 0, canGigantamax: boolean = false) =>
		`pokemon_${speciesId}_${form}${canGigantamax ? '_gmax' : ''}`,
	teraType: (typeName: string) => {
		if (!typeName) return 'tera_type_unknown'
		return `tera_type_${typeName.toLowerCase()}`
	},
	sprite: (spriteKey: string) => `sprite_${spriteKey}`,
} as const

// Initialize cleanup on service load
cacheService.cleanup()
