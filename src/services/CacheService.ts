/**
 * Simplified cache service - Now mainly just provides key generation utilities
 * Main caching is handled by Redux store for better performance and control
 */

// Cache key generators - Still useful for consistent key generation
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

/**
 * Legacy cache service - keeping minimal interface for compatibility
 * @deprecated Use Redux cache instead for better performance
 */
class CacheService {
	/**
	 * Store data in cache with expiry
	 * @deprecated Use Redux cache instead
	 */
	async set<T>(_key: string, _data: T, _expiryMs?: number): Promise<void> {
		// No-op for compatibility
	}

	/**
	 * Get data from cache if not expired
	 * @deprecated Use Redux cache instead
	 */
	async get<T>(_key: string): Promise<T | null> {
		return null
	}

	/**
	 * Delete specific cache entry
	 * @deprecated Use Redux cache instead
	 */
	async delete(_key: string): Promise<void> {
		// No-op for compatibility
	}

	/**
	 * Clear all cache entries
	 * @deprecated Use Redux cache instead
	 */
	async clear(): Promise<void> {
		// No-op for compatibility
	}

	/**
	 * Get cache statistics
	 * @deprecated Use Redux cache instead
	 */
	async getStats(): Promise<{ totalItems: number; totalSize: number }> {
		return { totalItems: 0, totalSize: 0 }
	}

	/**
	 * Clean up expired entries
	 * @deprecated Use Redux cache instead
	 */
	async cleanup(): Promise<void> {
		// No-op for compatibility
	}
}

// Export singleton instance for compatibility
export const cacheService = new CacheService()
