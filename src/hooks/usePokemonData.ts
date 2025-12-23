import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getPokeApiPokemon } from '../services/Pokeapi'
import { PokemonNameService } from '../services/PokemonNameService'
import type { PokeApiPokemon } from '../models/Pokeapi'
import { getComputedTypeColor } from '../utils/typeColors'
import { storePokemonData, selectPokemonData } from '../store/features/assets/assetsSlice'
import type { RootState } from '../store'

/**
 * Hook unificado para obtener información completa de Pokemon
 * Usa Redux cache en lugar de CacheService para mejor rendimiento
 */
export function usePokemonData(
	speciesId?: number,
	form: number = 0,
	canGigantamax: boolean = false,
	hasMegaStone: boolean = false
) {
	const dispatch = useDispatch()

	// Check Redux storage first
	const storedData = useSelector((state: RootState) =>
		speciesId ? selectPokemonData(state, speciesId, form, canGigantamax, hasMegaStone) : null
	)

	const [pokemonData, setPokemonDataLocal] = useState<{
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
			setPokemonDataLocal({ colors: {} })
			return
		}

		// If we have stored data, use it immediately
		if (storedData) {
			setPokemonDataLocal({
				type1: storedData.type1,
				type2: storedData.type2,
				colors: storedData.colors,
				formName: storedData.formName,
				fullName: undefined, // We'll still fetch this if needed
				speciesName: undefined, // We'll still fetch this if needed
				pokeApiData: storedData.pokeApiData,
			})

			// Still fetch names if not stored (they're less critical)
			fetchNamesOnly(speciesId, form)
			return
		}

		// No stored data, fetch everything
		fetchPokemonData()

		async function fetchNamesOnly(speciesId: number, form: number) {
			try {
				const [fullName, speciesName] = await Promise.all([
					PokemonNameService.getFullName(speciesId, form),
					PokemonNameService.getSpeciesName(speciesId),
				])

				setPokemonDataLocal((prev) => ({
					...prev,
					fullName,
					speciesName,
				}))
			} catch (err) {
				console.warn('Error fetching Pokemon names:', err)
			}
		}

		async function fetchPokemonData() {
			if (!speciesId) return // Early return if no speciesId

			setLoading(true)
			setError(null)

			try {
				// Get all data in parallel
				const [pokeApiData, fullName, speciesName] = await Promise.all([
					getPokeApiPokemon(speciesId, form, canGigantamax, hasMegaStone),
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

				const newData = {
					type1,
					type2,
					colors,
					formName,
					pokeApiData,
				}

				// Store in Redux memory
				dispatch(
					storePokemonData({
						speciesId,
						form,
						data: newData,
					})
				)

				setPokemonDataLocal({
					...newData,
					fullName,
					speciesName,
				})
			} catch (err) {
				console.error('Error fetching Pokemon data:', err)
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}
	}, [speciesId, form, canGigantamax, hasMegaStone, storedData, dispatch])

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
