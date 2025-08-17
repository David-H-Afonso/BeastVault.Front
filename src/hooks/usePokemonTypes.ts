import { useState, useEffect } from 'react'
import { getPokeApiPokemon } from '../services/Pokeapi'
import type { PokeApiPokemon } from '../models/Pokeapi'

/**
 * Hook to get Pokemon type information from PokeAPI cache
 * @param speciesId - Pokemon species ID (Pokedex number)
 * @param form - Pokemon form (0 = base form)
 * @returns Object with types and loading state
 */
export function usePokemonTypes(speciesId?: number, form: number = 0) {
	const [types, setTypes] = useState<{
		type1?: string
		type2?: string
		colors: { type1?: string; type2?: string }
	}>({
		colors: {},
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Type color mapping from PokeAPI standards
	const getTypeColor = (typeName: string): string => {
		switch (typeName.toLowerCase()) {
			case 'normal':
				return '#A8A878'
			case 'fire':
				return '#F08030'
			case 'water':
				return '#6890F0'
			case 'electric':
				return '#F8D030'
			case 'grass':
				return '#78C850'
			case 'ice':
				return '#98D8D8'
			case 'fighting':
				return '#C03028'
			case 'poison':
				return '#A040A0'
			case 'ground':
				return '#E0C068'
			case 'flying':
				return '#A890F0'
			case 'psychic':
				return '#F85888'
			case 'bug':
				return '#A8B820'
			case 'rock':
				return '#B8A038'
			case 'ghost':
				return '#705898'
			case 'dragon':
				return '#7038F8'
			case 'dark':
				return '#705848'
			case 'steel':
				return '#B8B8D0'
			case 'fairy':
				return '#EE99AC'
			default:
				return '#68A090'
		}
	}

	useEffect(() => {
		if (!speciesId) {
			setTypes({ colors: {} })
			return
		}

		const fetchPokemonTypes = async () => {
			setLoading(true)
			setError(null)

			try {
				// Get Pokemon data from PokeAPI (with caching)
				const pokemonData: PokeApiPokemon = await getPokeApiPokemon(speciesId, form)

				// Extract types from PokeAPI response
				const pokemonTypes = pokemonData.types || []

				// Sort by slot to ensure correct primary/secondary order
				const sortedTypes = pokemonTypes.sort((a, b) => a.slot - b.slot)

				const type1 = sortedTypes[0]?.type?.name
				const type2 = sortedTypes[1]?.type?.name

				setTypes({
					type1,
					type2,
					colors: {
						type1: type1 ? getTypeColor(type1) : undefined,
						type2: type2 ? getTypeColor(type2) : undefined,
					},
				})
			} catch (err) {
				console.error(`Failed to load types for Pokemon ${speciesId}:`, err)
				setError(`Failed to load Pokemon types`)
				// Keep using backend types as fallback - don't reset
			} finally {
				setLoading(false)
			}
		}

		fetchPokemonTypes()
	}, [speciesId, form])

	return { types, loading, error }
}
