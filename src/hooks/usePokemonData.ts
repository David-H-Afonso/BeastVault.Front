import { useState, useEffect } from 'react'
import { getPokeApiPokemon } from '../services/Pokeapi'
import { PokemonNameService } from '../services/PokemonNameService'
import type { PokeApiPokemon } from '../models/Pokeapi'
import { getComputedTypeColor } from '../utils/typeColors'

/**
 * Hook unificado para obtener información completa de Pokemon
 * Consolida usePokemonInfo, usePokemonFullName, usePokemonSpeciesName y usePokemonTypes
 */
export function usePokemonData(
	speciesId?: number,
	form: number = 0,
	canGigantamax: boolean = false
) {
	const [pokemonData, setPokemonData] = useState<{
		// Types
		type1?: string
		type2?: string
		colors: { type1?: string; type2?: string }
		// Names
		fullName?: string
		speciesName?: string
		formName?: string
		// PokeAPI data
		pokeApiData?: PokeApiPokemon
	}>({
		colors: {},
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!speciesId) {
			setPokemonData({ colors: {} })
			return
		}

		const fetchPokemonData = async () => {
			setLoading(true)
			setError(null)

			try {
				// Get all data in parallel
				const [pokeApiData, fullName, speciesName] = await Promise.all([
					getPokeApiPokemon(speciesId, form),
					PokemonNameService.getFullName(speciesId, form),
					PokemonNameService.getSpeciesName(speciesId),
				])

				// Extract types from PokeAPI response
				const pokemonTypes = pokeApiData.types || []
				const sortedTypes = pokemonTypes.sort((a, b) => a.slot - b.slot)

				const type1 = sortedTypes[0]?.type?.name
				const type2 = sortedTypes[1]?.type?.name

				// Calculate type colors
				const colors = {
					type1: type1 ? getComputedTypeColor(type1) : undefined,
					type2: type2 ? getComputedTypeColor(type2) : undefined,
				}

				// Extract form information
				let formName: string | undefined

				// Special handling for Gigantamax Pokemon
				if (canGigantamax) {
					formName = 'Gigantamax'
				}
				// Add other form handling logic here...

				setPokemonData({
					type1,
					type2,
					colors,
					fullName,
					speciesName,
					formName,
					pokeApiData,
				})
			} catch (err) {
				console.error('Error fetching Pokemon data:', err)
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchPokemonData()
	}, [speciesId, form, canGigantamax])

	// Helper methods
	const getTypes = () => {
		const types = []
		if (pokemonData.type1) types.push(pokemonData.type1)
		if (pokemonData.type2) types.push(pokemonData.type2)
		return types
	}

	const getTypeColors = () => {
		return pokemonData.colors
	}

	return {
		...pokemonData,
		loading,
		error,
		// Helper methods
		getTypes,
		getTypeColors,
		hasSecondaryType: !!pokemonData.type2,
	}
}
