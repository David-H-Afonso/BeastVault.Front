import { useState, useEffect, useCallback } from 'react'
import { useUISettings } from './useUISettings'
import { SpriteType } from '../models/enums/SpriteTypes'
import { simpleFetcher } from '../utils/simpleFetcher'

const POKEAPI = 'https://pokeapi.co/api/v2'

const getGeneration = (speciesId: number): number => {
	if (speciesId <= 151) return 1
	if (speciesId <= 251) return 2
	if (speciesId <= 386) return 3
	if (speciesId <= 493) return 4
	if (speciesId <= 649) return 5
	if (speciesId <= 721) return 6
	if (speciesId <= 809) return 7
	if (speciesId <= 898) return 8
	return 9
}

const getPokemonName = async (speciesId: number, form: number = 0): Promise<string> => {
	try {
		if (form === 0) {
			const data = await simpleFetcher.fetchWithCache<any>(`${POKEAPI}/pokemon/${speciesId}`)
			return data.name
		}

		const speciesData = await simpleFetcher.fetchWithCache<any>(
			`${POKEAPI}/pokemon-species/${speciesId}`
		)
		if (speciesData.varieties?.length > form) {
			const varietyUrl = speciesData.varieties[form].pokemon.url
			const pokemonId = varietyUrl.split('/').filter(Boolean).pop()
			const data = await simpleFetcher.fetchWithCache<any>(`${POKEAPI}/pokemon/${pokemonId}`)
			return data.name
		}

		const data = await simpleFetcher.fetchWithCache<any>(`${POKEAPI}/pokemon/${speciesId}`)
		return data.name
	} catch {
		return `pokemon-${speciesId}`
	}
}

export function useSprites() {
	const { spriteType, setSpriteType } = useUISettings()

	const getPreferredSprite = useCallback(
		(sprites: any, isShiny: boolean = false): string | null => {
			if (!sprites) return null

			switch (spriteType) {
				case SpriteType.GIFS:
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
					if (isShiny) {
						return sprites.shiny || sprites.default || sprites.homeShiny || sprites.home
					}
					return sprites.default || sprites.home

				case SpriteType.SPRITES:
				default:
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
		},
		[spriteType]
	)

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
						baseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
					} else {
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

	const getSpriteUrl = useCallback(
		async (
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
		},
		[spriteType]
	)

	const shouldLimitPagination = () => spriteType === SpriteType.GIFS

	const getMaxItemsPerPage = (defaultMax: number = 50) => {
		return shouldLimitPagination() ? 20 : defaultMax
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
