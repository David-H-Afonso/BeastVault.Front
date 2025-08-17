/**
 * Cache service for storing API responses in localStorage
 */

interface CacheItem<T> {
	data: T
	timestamp: number
	expiry: number
}

class CacheService {
	private readonly CACHE_PREFIX = 'beastvault_cache_'
	private readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

	/**
	 * Store data in cache with expiry
	 */
	set<T>(key: string, data: T, expiryMs?: number): void {
		try {
			const expiry = expiryMs || this.DEFAULT_EXPIRY
			const cacheItem: CacheItem<T> = {
				data,
				timestamp: Date.now(),
				expiry,
			}

			localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cacheItem))
		} catch (error) {
			console.warn('Failed to store item in cache:', error)
		}
	}

	/**
	 * Get data from cache if not expired
	 */
	get<T>(key: string): T | null {
		try {
			const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`)
			if (!cached) return null

			const cacheItem: CacheItem<T> = JSON.parse(cached)
			const now = Date.now()

			// Check if expired
			if (now - cacheItem.timestamp > cacheItem.expiry) {
				this.delete(key)
				return null
			}

			return cacheItem.data
		} catch (error) {
			console.warn('Failed to retrieve item from cache:', error)
			this.delete(key) // Clean up corrupted cache entry
			return null
		}
	}

	/**
	 * Delete specific cache entry
	 */
	delete(key: string): void {
		try {
			localStorage.removeItem(`${this.CACHE_PREFIX}${key}`)
		} catch (error) {
			console.warn('Failed to delete cache item:', error)
		}
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		try {
			const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.CACHE_PREFIX))
			keys.forEach((key) => localStorage.removeItem(key))
		} catch (error) {
			console.warn('Failed to clear cache:', error)
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats(): { totalItems: number; totalSize: number } {
		try {
			const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.CACHE_PREFIX))

			let totalSize = 0
			keys.forEach((key) => {
				const value = localStorage.getItem(key)
				if (value) {
					totalSize += new Blob([value]).size
				}
			})

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
	cleanup(): void {
		try {
			const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.CACHE_PREFIX))

			const now = Date.now()
			keys.forEach((key) => {
				try {
					const cached = localStorage.getItem(key)
					if (cached) {
						const cacheItem: CacheItem<any> = JSON.parse(cached)
						if (now - cacheItem.timestamp > cacheItem.expiry) {
							localStorage.removeItem(key)
						}
					}
				} catch {
					// Remove corrupted entries
					localStorage.removeItem(key)
				}
			})
		} catch (error) {
			console.warn('Failed to cleanup cache:', error)
		}
	}
}

// Export singleton instance
export const cacheService = new CacheService()

// Cache key generators
export const CacheKeys = {
	pokeball: (ballName: string) => `pokeball_${ballName.toLowerCase().replace(/\s+/g, '_')}`,
	pokemon: (speciesId: number, form: number = 0) => `pokemon_${speciesId}_${form}`,
	teraType: (typeName: string) => `tera_type_${typeName.toLowerCase()}`,
	sprite: (spriteKey: string) => `sprite_${spriteKey}`,
} as const

// Initialize cleanup on service load
cacheService.cleanup()
