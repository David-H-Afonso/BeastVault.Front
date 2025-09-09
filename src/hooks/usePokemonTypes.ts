import { useState, useEffect } from 'react'
import { getPokeApiPokemon } from '../services/Pokeapi'
import type { PokeApiPokemon } from '../models/Pokeapi'
import { getComputedTypeColor } from '../utils/typeColors'

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
						type1: type1 ? getComputedTypeColor(type1) : undefined,
						type2: type2 ? getComputedTypeColor(type2) : undefined,
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
