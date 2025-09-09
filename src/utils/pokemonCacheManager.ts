import { cacheService } from '@/services/CacheService'

/**
 * Cache management utilities for Pokemon data
 * Helps prevent cache quota exceeded errors and performance issues
 */

export class PokemonCacheManager {
	// Reduce cache size in development for better performance during debugging
	private static readonly MAX_CACHE_SIZE = import.meta.env.DEV ? 25 : 50
	private static readonly CACHE_PREFIX = 'beastvault_cache_pokemon_'

	/**
	 * Manages cache size to prevent QuotaExceededError
	 * Removes oldest entries when cache exceeds limit
	 */
	static manageCache(cache: Record<string, any>): Record<string, any> {
		const entries = Object.entries(cache)

		if (entries.length <= this.MAX_CACHE_SIZE) {
			return cache
		}

		// Sort by timestamp if available, otherwise keep first N entries
		const managedEntries = entries.slice(0, this.MAX_CACHE_SIZE)

		console.log(`Cache size reduced from ${entries.length} to ${managedEntries.length} entries`)

		return Object.fromEntries(managedEntries)
	}

	/**
	 * Clear old cache entries from Cache Storage
	 */
	static async clearOldCacheStorage(): Promise<void> {
		try {
			await cacheService.clear()
			console.log('Cleared all cache entries from Cache Storage')
		} catch (error) {
			console.warn('Failed to clear Cache Storage:', error)
		}
	}

	/**
	 * Clear old cache entries from localStorage (legacy cleanup)
	 */
	static clearOldLocalStorageCache(): void {
		const keysToRemove: string[] = []

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key && key.startsWith(this.CACHE_PREFIX)) {
				keysToRemove.push(key)
			}
		}

		keysToRemove.forEach((key) => {
			try {
				localStorage.removeItem(key)
			} catch (error) {
				console.warn(`Failed to remove cache key: ${key}`, error)
			}
		})

		if (keysToRemove.length > 0) {
			console.log(`Cleared ${keysToRemove.length} old cache entries from localStorage`)
		}
	}

	/**
	 * Get current cache size from Cache Storage
	 */
	static async getCacheStorageSize(): Promise<{ totalItems: number; totalSize: number }> {
		try {
			return await cacheService.getStats()
		} catch (error) {
			console.warn('Failed to get cache storage stats:', error)
			return { totalItems: 0, totalSize: 0 }
		}
	}

	/**
	 * Get current cache size
	 */
	static getCacheSize(cache: Record<string, any>): number {
		return Object.keys(cache).length
	}

	/**
	 * Check if cache is near limit
	 */
	static isCacheNearLimit(cache: Record<string, any>): boolean {
		return this.getCacheSize(cache) > this.MAX_CACHE_SIZE * 0.8 // 80% of limit
	}

	/**
	 * Clean up expired entries and manage size
	 */
	static async cleanupCacheStorage(): Promise<void> {
		try {
			await cacheService.cleanup()
		} catch (error) {
			console.warn('Failed to cleanup Cache Storage:', error)
		}
	}
}
