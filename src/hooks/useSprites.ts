import { useState, useEffect, useCallback } from 'react'
import { useUISettings } from './useUISettings'
import { SpriteType } from '../models/enums/SpriteTypes'

// Get generation info to determine which repository to use
const getGeneration = (speciesId: number): number => {
	if (speciesId <= 151) return 1 // Gen 1
	if (speciesId <= 251) return 2 // Gen 2
	if (speciesId <= 386) return 3 // Gen 3
	if (speciesId <= 493) return 4 // Gen 4
	if (speciesId <= 649) return 5 // Gen 5
	if (speciesId <= 721) return 6 // Gen 6
	if (speciesId <= 809) return 7 // Gen 7
	if (speciesId <= 898) return 8 // Gen 8
	return 9 // Gen 9+
}

// Get Pokemon name from PokeAPI for sprite filename
const getPokemonName = async (speciesId: number, form: number = 0): Promise<string> => {
	try {
		if (form === 0) {
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
			if (response.ok) {
				const data = await response.json()
				return data.name
			}
		} else {
			// For forms > 0, get the species data to find varieties
			const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`)
			if (speciesResponse.ok) {
				const speciesData = await speciesResponse.json()
				if (speciesData.varieties && speciesData.varieties.length > form) {
					const variety = speciesData.varieties[form]
					const pokemonResponse = await fetch(variety.pokemon.url)
					if (pokemonResponse.ok) {
						const pokemonData = await pokemonResponse.json()
						return pokemonData.name
					}
				}
			}
			// Fallback
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
			if (response.ok) {
				const data = await response.json()
				return data.name
			}
		}
		return `pokemon-${speciesId}`
	} catch (error) {
		console.warn('Error getting Pokemon name:', error)
		return `pokemon-${speciesId}`
	}
}

/**
 * Hook unificado para manejar todos los aspectos relacionados con sprites
 * Consolida useUserPreferredSprite, useBoxSprites, usePokemonBoxSprites y manejo de sprites
 */
export function useSprites() {
	const { spriteType, setSpriteType } = useUISettings()

	/**
	 * Obtiene el sprite preferido según configuración del usuario
	 */
	const getPreferredSprite = useCallback((sprites: any, isShiny: boolean = false): string | null => {
		if (!sprites) return null

		switch (spriteType) {
			case SpriteType.GIFS:
				// GIFs animados (Showdown)
				if (isShiny) {
					return (
						sprites.showdownShiny ||
						sprites.showdown ||
						sprites.homeShiny ||
						sprites.home ||
						sprites.shiny ||
						sprites.default
					)
				}
				return sprites.showdown || sprites.home || sprites.default

			case SpriteType.HOME:
				// Pokemon HOME sprites
				if (isShiny) {
					return (
						sprites.homeShiny ||
						sprites.home ||
						sprites.officialShiny ||
						sprites.official ||
						sprites.shiny ||
						sprites.default
					)
				}
				return sprites.home || sprites.official || sprites.default

			case SpriteType.OFFICIAL:
				// Official artwork
				if (isShiny) {
					return (
						sprites.officialShiny ||
						sprites.official ||
						sprites.homeShiny ||
						sprites.home ||
						sprites.shiny ||
						sprites.default
					)
				}
				return sprites.official || sprites.home || sprites.default

			case SpriteType.DEFAULT:
				// PokeAPI default sprites
				if (isShiny) {
					return sprites.shiny || sprites.default || sprites.homeShiny || sprites.home
				}
				return sprites.default || sprites.home

			case SpriteType.SPRITES:
			default:
				// GitHub sprites (gen 1-8 + gen 9)
				if (isShiny) {
					return (
						sprites.githubShiny ||
						sprites.githubRegular ||
						sprites.showdown ||
						sprites.home ||
						sprites.official ||
						sprites.default
					)
				}
				return (
					sprites.githubRegular ||
					sprites.githubShiny ||
					sprites.showdown ||
					sprites.home ||
					sprites.official ||
					sprites.default
				)
		}
	}, [spriteType])

	/**
	 * Hook para obtener sprite de box correcto
	 */
	const useBoxSprite = (speciesId: number, form: number = 0, isShiny: boolean = false) => {
		const [spriteUrl, setSpriteUrl] = useState<string | null>(null)
		const [loading, setLoading] = useState(false)

		useEffect(() => {
			const loadSprite = async () => {
				setLoading(true)
				try {
					const pokemonName = await getPokemonName(speciesId, form)
					const generation = getGeneration(speciesId)
					let baseUrl: string
					const folder = isShiny ? 'shiny' : 'regular'

					if (generation <= 8) {
						// Use pokesprite for Gen 1-8
						baseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
					} else {
						// Use pokemon-sprites for Gen 9+
						baseUrl = 'https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon'
					}

					const url = `${baseUrl}/${folder}/${pokemonName}.png`
					setSpriteUrl(url)
				} catch (error) {
					console.warn('Error loading box sprite:', error)
					setSpriteUrl(null)
				} finally {
					setLoading(false)
				}
			}

			if (speciesId > 0) {
				loadSprite()
			}
		}, [speciesId, form, isShiny])

		return { spriteUrl, loading }
	}

	/**
	 * Función para obtener sprite URLs de manera programática
	 */
	const getSpriteUrl = useCallback(async (
		speciesId: number, 
		form: number = 0, 
		isShiny: boolean = false
	): Promise<string | null> => {
		try {
			const pokemonName = await getPokemonName(speciesId, form)
			const generation = getGeneration(speciesId)
			
			let baseUrl: string
			const folder = isShiny ? 'shiny' : 'regular'

			// For box sprites, always use the GitHub repositories
			if (generation <= 8) {
				baseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
			} else {
				baseUrl = 'https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon'
			}

			return `${baseUrl}/${folder}/${pokemonName}.png`
		} catch (error) {
			console.warn('Error getting sprite URL:', error)
			return null
		}
	}, [spriteType])

	// Helpers para performance
	const shouldLimitPagination = () => {
		return spriteType === SpriteType.GIFS
	}

	const getMaxItemsPerPage = (defaultMax: number = 50) => {
		if (shouldLimitPagination()) {
			return 20 // Máximo para GIFs
		}
		return defaultMax
	}

	return {
		// Current settings
		spriteType,
		setSpriteType,
		isUsingGifs: spriteType === SpriteType.GIFS,
		
		// Sprite utilities
		getPreferredSprite,
		useBoxSprite,
		getSpriteUrl,
		
		// Performance helpers
		shouldLimitPagination,
		getMaxItemsPerPage,
	}
}
