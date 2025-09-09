import { useState, useEffect } from 'react'
import { cacheService, CacheKeys } from '../services/CacheService'
import { getPokeApiPokemon, getBestSpriteUrl } from '../services/Pokeapi'

/**
 * Custom hook for fetching and caching Pokemon sprites
 */
export function usePokemonSprite(speciesId: number, form: number = 0, isShiny: boolean = false) {
	const [sprite, setSprite] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchSprite() {
			setLoading(true)
			setError(null)

			try {
				const spriteKey = `${speciesId}_${form}_${isShiny ? 'shiny' : 'normal'}`
				const cacheKey = CacheKeys.sprite(spriteKey)

				// Try cache first
				const cached = await cacheService.get<string>(cacheKey)
				if (cached) {
					setSprite(cached)
					setLoading(false)
					return
				} // Fetch from API
				const pokemonData = await getPokeApiPokemon(speciesId, form)
				const spriteUrl = getBestSpriteUrl(pokemonData.sprites, isShiny)

				if (spriteUrl) {
					// Cache the sprite URL (cache for 7 days)
					await cacheService.set(cacheKey, spriteUrl, 7 * 24 * 60 * 60 * 1000)
					setSprite(spriteUrl)
				} else {
					setSprite(null)
					setError('No sprite available')
				}
			} catch (err) {
				console.error('Failed to fetch Pokemon sprite:', err)
				setError(err instanceof Error ? err.message : 'Failed to load sprite')
				setSprite(null)
			} finally {
				setLoading(false)
			}
		}

		if (speciesId > 0) {
			fetchSprite()
		} else {
			setLoading(false)
		}
	}, [speciesId, form, isShiny])

	return { sprite, loading, error }
}

/**
 * Custom hook for fetching and caching Pokeball icons
 */
export function usePokeBallIcon(ballName: string) {
	const [icon, setIcon] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchIcon() {
			if (!ballName) {
				setLoading(false)
				return
			}

			setLoading(true)
			setError(null)

			try {
				const cacheKey = CacheKeys.pokeball(ballName)

				// Try cache first
				const cached = await cacheService.get<string | null>(cacheKey)
				if (cached !== null) {
					setIcon(cached)
					setLoading(false)
					return
				} // If not in cache, we need to import the function dynamically
				// to avoid circular dependencies
				const { getPokeBallIcon } = await import('../services/Pokeapi')
				const iconUrl = await getPokeBallIcon(ballName)

				setIcon(iconUrl)
			} catch (err) {
				console.error('Failed to fetch pokeball icon:', err)
				setError(err instanceof Error ? err.message : 'Failed to load pokeball icon')
				setIcon(null)
			} finally {
				setLoading(false)
			}
		}

		fetchIcon()
	}, [ballName])

	return { icon, loading, error }
}
