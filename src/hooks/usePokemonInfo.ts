import { useState, useEffect } from 'react'
import { getPokeApiPokemon } from '../services/Pokeapi'
import type { PokeApiPokemon } from '../models/Pokeapi'

/**
 * Hook to get Pokemon information from PokeAPI cache including types and form data
 * @param speciesId - Pokemon species ID (Pokedex number)
 * @param form - Pokemon form (0 = base form)
 * @param canGigantamax - Whether this Pokemon is in Gigantamax form
 * @returns Object with types, form name, and loading state
 */
export function usePokemonInfo(speciesId?: number, form: number = 0, canGigantamax: boolean = false) {
	const [pokemonInfo, setPokemonInfo] = useState<{
		type1?: string
		type2?: string
		formName?: string
		colors: { type1?: string; type2?: string }
	}>({
		colors: {}
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Type color mapping from PokeAPI standards
	const getTypeColor = (typeName: string): string => {
		switch (typeName.toLowerCase()) {
			case 'normal': return '#A8A878'
			case 'fire': return '#F08030'
			case 'water': return '#6890F0'
			case 'electric': return '#F8D030'
			case 'grass': return '#78C850'
			case 'ice': return '#98D8D8'
			case 'fighting': return '#C03028'
			case 'poison': return '#A040A0'
			case 'ground': return '#E0C068'
			case 'flying': return '#A890F0'
			case 'psychic': return '#F85888'
			case 'bug': return '#A8B820'
			case 'rock': return '#B8A038'
			case 'ghost': return '#705898'
			case 'dragon': return '#7038F8'
			case 'dark': return '#705848'
			case 'steel': return '#B8B8D0'
			case 'fairy': return '#EE99AC'
			default: return '#68A090'
		}
	}

	useEffect(() => {
		if (!speciesId) {
			setPokemonInfo({ colors: {} })
			return
		}

		const fetchPokemonInfo = async () => {
			setLoading(true)
			setError(null)

			try {
				console.log(`Fetching Pokemon info for species ${speciesId}, form ${form}${canGigantamax ? ' (Gigantamax)' : ''}`)
				
				// Get Pokemon data from PokeAPI (with caching)
				const pokemonData: PokeApiPokemon = await getPokeApiPokemon(speciesId, form, canGigantamax)
				
				console.log(`Pokemon data received:`, pokemonData)
				
				// Extract types from PokeAPI response
				const pokemonTypes = pokemonData.types || []
				
				// Sort by slot to ensure correct primary/secondary order
				const sortedTypes = pokemonTypes.sort((a, b) => a.slot - b.slot)
				
				const type1 = sortedTypes[0]?.type?.name
				const type2 = sortedTypes[1]?.type?.name

				// Extract form information
				let formName: string | undefined
				
				console.log(`Processing form for Pokemon ${speciesId} (${pokemonData.name}), form: ${form}${canGigantamax ? ' (Gigantamax)' : ''}`)
				
				// Special handling for Gigantamax Pokemon
				if (canGigantamax) {
					formName = 'Gigantamax'
					console.log(`Gigantamax form detected: ${formName}`)
				}
				// Special handling for Scatterbug/Spewpa/Vivillon patterns (species 664, 665, 666)
				else if ([664, 665, 666].includes(speciesId) && form > 0) {
					// These Pokemon have 20 different patterns (1-20)
					const vivillonPatterns = [
						'Icy Snow', 'Polar', 'Tundra', 'Continental', 'Garden', 
						'Elegant', 'Meadow', 'Modern', 'Marine', 'Archipelago',
						'High Plains', 'Sandstorm', 'River', 'Monsoon', 'Savanna',
						'Sun', 'Ocean', 'Jungle', 'Fancy', 'Poké Ball'
					]
					
					if (form <= vivillonPatterns.length) {
						formName = `${vivillonPatterns[form - 1]} Pattern`
					} else {
						formName = `Pattern ${form}`
					}
					console.log(`Pattern Pokemon form detected: ${formName}`)
				}
				// Check if Pokemon name includes pattern information (from our service modification)
				else if (pokemonData.name && pokemonData.name.includes('-pattern-')) {
					const patternNumber = parseInt(pokemonData.name.split('-pattern-')[1])
					if (patternNumber && [664, 665, 666].includes(speciesId)) {
						const vivillonPatterns = [
							'Icy Snow', 'Polar', 'Tundra', 'Continental', 'Garden', 
							'Elegant', 'Meadow', 'Modern', 'Marine', 'Archipelago',
							'High Plains', 'Sandstorm', 'River', 'Monsoon', 'Savanna',
							'Sun', 'Ocean', 'Jungle', 'Fancy', 'Poké Ball'
						]
						
						if (patternNumber <= vivillonPatterns.length) {
							formName = `${vivillonPatterns[patternNumber - 1]} Pattern`
						} else {
							formName = `Pattern ${patternNumber}`
						}
						console.log(`Pattern Pokemon detected from name: ${formName}`)
					}
				}
				// Try to get form name from Pokemon name if it contains form info
				else if (pokemonData.name && form > 0) {
					const nameParts = pokemonData.name.split('-')
					if (nameParts.length > 1) {
						// Convert kebab-case to proper form name
						const formPart = nameParts.slice(1).join('-')
						formName = formPart
							.split('-')
							.map(word => word.charAt(0).toUpperCase() + word.slice(1))
							.join(' ')
						
						// Handle special cases for known forms
						switch (formPart) {
							case 'hisui':
							case 'hisuian':
								formName = 'Hisuian Form'
								break
							case 'alola':
							case 'alolan':
								formName = 'Alolan Form'
								break
							case 'galar':
							case 'galarian':
								formName = 'Galarian Form'
								break
							case 'paldea':
							case 'paldean':
								formName = 'Paldean Form'
								break
							case 'mega':
								formName = 'Mega Evolution'
								break
							case 'gmax':
							case 'gigantamax':
								formName = 'Gigantamax'
								break
							default:
								// Keep the formatted name for other forms
								break
						}
					}
				}
				
				// If we still don't have a form name but form > 0, create a generic one
				if (!formName && form > 0) {
					formName = `Form ${form}`
					console.log(`Generic form name assigned: ${formName}`)
				}

				setPokemonInfo({
					type1,
					type2,
					formName,
					colors: {
						type1: type1 ? getTypeColor(type1) : undefined,
						type2: type2 ? getTypeColor(type2) : undefined
					}
				})

				console.log(`Final Pokemon info:`, { type1, type2, formName })
			} catch (err) {
				console.error(`Failed to load info for Pokemon ${speciesId}:`, err)
				setError(`Failed to load Pokemon information`)
				// Keep using backend data as fallback - don't reset
			} finally {
				setLoading(false)
			}
		}

		fetchPokemonInfo()
	}, [speciesId, form, canGigantamax])

	return { pokemonInfo, loading, error }
}
