import { useEffect, useState } from 'react'
import { staticResourceCache } from '../services/StaticResourceCache'

/**
 * URLs of commonly used static resources that should be preloaded
 */
const COMMON_STATIC_RESOURCES = [
	// Type icons (most common types)
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/normal.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/fire.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/water.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/electric.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/grass.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/ice.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/fighting.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/poison.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/ground.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/flying.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/psychic.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/bug.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/rock.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/ghost.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/dragon.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/dark.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/steel.png',
	'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/fairy.png',

	// Common Pokeball sprites
	'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/poke.png',
	'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/great.png',
	'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/ultra.png',
	'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/master.png',
	'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/premier.png',
	'https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/luxury.png',
]

/**
 * Preload priority levels for different types of resources
 */
export const PreloadPriority = {
	CRITICAL: 0, // Load immediately
	HIGH: 1, // Load after critical
	MEDIUM: 2, // Load when idle
	LOW: 3, // Load in background
} as const

export type PreloadPriorityType = (typeof PreloadPriority)[keyof typeof PreloadPriority]

/**
 * Hook for preloading static resources with priority-based loading
 */
export function useStaticResourcePreloader() {
	const [preloadStats, setPreloadStats] = useState({
		total: 0,
		loaded: 0,
		failed: 0,
		isComplete: false,
	})

	useEffect(() => {
		let isCancelled = false

		const preloadResources = async () => {
			const totalResources = COMMON_STATIC_RESOURCES.length
			setPreloadStats((prev) => ({ ...prev, total: totalResources }))

			let loaded = 0
			let failed = 0

			// Preload resources in small batches to avoid overwhelming the browser
			const batchSize = 5
			for (let i = 0; i < COMMON_STATIC_RESOURCES.length; i += batchSize) {
				if (isCancelled) break

				const batch = COMMON_STATIC_RESOURCES.slice(i, i + batchSize)
				const promises = batch.map(async (url) => {
					try {
						await staticResourceCache.cacheImage(url)
						return { success: true, url }
					} catch (error) {
						console.warn(`Failed to preload resource: ${url}`, error)
						return { success: false, url }
					}
				})

				const results = await Promise.allSettled(promises)

				results.forEach((result) => {
					if (result.status === 'fulfilled') {
						if (result.value.success) {
							loaded++
						} else {
							failed++
						}
					} else {
						failed++
					}
				})

				if (!isCancelled) {
					setPreloadStats({
						total: totalResources,
						loaded,
						failed,
						isComplete: loaded + failed >= totalResources,
					})
				}

				// Small delay between batches to not block UI
				await new Promise((resolve) => setTimeout(resolve, 100))
			}
		}

		// Start preloading after a short delay to not interfere with initial app loading
		const timeoutId = setTimeout(() => {
			preloadResources()
		}, 2000)

		return () => {
			isCancelled = true
			clearTimeout(timeoutId)
		}
	}, [])

	return preloadStats
}

/**
 * Hook for preloading Pokemon-specific resources
 */
export function usePokemonResourcePreloader(pokemonIds: number[]) {
	const [preloadStats, setPreloadStats] = useState({
		total: 0,
		loaded: 0,
		isComplete: false,
	})

	useEffect(() => {
		if (pokemonIds.length === 0) return

		let isCancelled = false

		const preloadPokemonSprites = async () => {
			const spriteUrls: string[] = []

			// Generate sprite URLs for the given Pokemon IDs
			pokemonIds.forEach((id) => {
				// Official artwork sprites (most commonly used)
				spriteUrls.push(
					`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
				)
				// Home sprites as backup
				spriteUrls.push(
					`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
				)
				// Small sprites for list views
				spriteUrls.push(
					`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
				)
			})

			setPreloadStats((prev) => ({ ...prev, total: spriteUrls.length }))

			let loaded = 0
			const batchSize = 3

			for (let i = 0; i < spriteUrls.length; i += batchSize) {
				if (isCancelled) break

				const batch = spriteUrls.slice(i, i + batchSize)
				await Promise.allSettled(batch.map((url) => staticResourceCache.prefetchImage(url)))

				loaded += batch.length

				if (!isCancelled) {
					setPreloadStats({
						total: spriteUrls.length,
						loaded,
						isComplete: loaded >= spriteUrls.length,
					})
				}

				// Small delay between batches
				await new Promise((resolve) => setTimeout(resolve, 50))
			}
		}

		preloadPokemonSprites()

		return () => {
			isCancelled = true
		}
	}, [pokemonIds])

	return preloadStats
}

/**
 * Get cache statistics for monitoring
 */
export function useCacheStats() {
	const [stats, setStats] = useState({ totalItems: 0, totalSize: '0 KB' })

	useEffect(() => {
		const updateStats = () => {
			const cacheStats = staticResourceCache.getCacheStats()
			setStats(cacheStats)
		}

		// Update stats immediately
		updateStats()

		// Update stats every 10 seconds
		const interval = setInterval(updateStats, 10000)

		return () => clearInterval(interval)
	}, [])

	return stats
}
