import { customFetch } from '../utils'
import type { PokeApiPokemon, PokeApiSprites, PokeApiNamedAPIResource } from '../models/Pokeapi'
import { cacheService, CacheKeys } from './CacheService'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/'

/**
 * Interface for PokeAPI type data
 */
export interface PokeApiTypeData {
	id: number
	name: string
	damage_relations: {
		double_damage_from: PokeApiNamedAPIResource[]
		double_damage_to: PokeApiNamedAPIResource[]
		half_damage_from: PokeApiNamedAPIResource[]
		half_damage_to: PokeApiNamedAPIResource[]
		no_damage_from: PokeApiNamedAPIResource[]
		no_damage_to: PokeApiNamedAPIResource[]
	}
}

/**
 * Interface for the types list response
 */
export interface PokeApiTypesListResponse {
	count: number
	next: string | null
	previous: string | null
	results: PokeApiNamedAPIResource[]
}

/**
 * Simple type interface for UI components with color information
 */
export interface PokemonTypeInfo {
	id: number
	name: string
	displayName: string
	color: string
}

/**
 * Get type color based on type name
 */
export function getTypeColor(typeName: string): string {
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

/**
 * Get type icon URL from PokeAPI sprites
 */
export function getTypeIconUrl(typeName: string): string {
	const typeNameLower = typeName.toLowerCase()
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeNameLower}.png`
}

/**
 * Fetches all Pokemon types from PokeAPI with caching.
 * Returns a simplified list of types for UI components.
 */
export async function getAllPokemonTypes(): Promise<PokemonTypeInfo[]> {
	const cacheKey = 'pokemon_types_all'

	// Try cache first
	const cached = cacheService.get<PokemonTypeInfo[]>(cacheKey)
	if (cached) {
		console.log('Cache hit for all Pokemon types')
		return cached
	}

	try {
		// Get the list of all types
		const typesListResponse = await customFetch<PokeApiTypesListResponse>(
			`${POKEAPI_BASE_URL}type/?limit=50`
		)

		// Filter out special types that are not actual Pokemon types
		const validTypes = typesListResponse.results.filter(type => 
			!['unknown', 'shadow'].includes(type.name)
		)

		// Fetch detailed data for each type to get the ID
		const typePromises = validTypes.map(async (typeRef, index) => {
			try {
				const typeData = await customFetch<PokeApiTypeData>(typeRef.url)
				return {
					id: typeData.id,
					name: typeData.name,
					displayName: capitalizeFirst(typeData.name),
					color: getTypeColor(typeData.name)
				}
			} catch (error) {
				console.warn(`Failed to fetch type data for ${typeRef.name}:`, error)
				// Fallback: use index + 1 as ID (not ideal but works)
				return {
					id: index + 1,
					name: typeRef.name,
					displayName: capitalizeFirst(typeRef.name),
					color: getTypeColor(typeRef.name)
				}
			}
		})

		const types = await Promise.all(typePromises)

		// Sort by ID to ensure consistent ordering
		const sortedTypes = types.sort((a, b) => a.id - b.id)

		// Cache for 24 hours (types don't change)
		cacheService.set(cacheKey, sortedTypes, 24 * 60 * 60 * 1000)

		console.log(`Fetched ${sortedTypes.length} Pokemon types from PokeAPI`)
		return sortedTypes
	} catch (error) {
		console.error('Failed to fetch Pokemon types:', error)
		
		// Return a fallback list of common types if API fails
		const fallbackTypes: PokemonTypeInfo[] = [
			{ id: 1, name: 'normal', displayName: 'Normal', color: getTypeColor('normal') },
			{ id: 2, name: 'fighting', displayName: 'Fighting', color: getTypeColor('fighting') },
			{ id: 3, name: 'flying', displayName: 'Flying', color: getTypeColor('flying') },
			{ id: 4, name: 'poison', displayName: 'Poison', color: getTypeColor('poison') },
			{ id: 5, name: 'ground', displayName: 'Ground', color: getTypeColor('ground') },
			{ id: 6, name: 'rock', displayName: 'Rock', color: getTypeColor('rock') },
			{ id: 7, name: 'bug', displayName: 'Bug', color: getTypeColor('bug') },
			{ id: 8, name: 'ghost', displayName: 'Ghost', color: getTypeColor('ghost') },
			{ id: 9, name: 'steel', displayName: 'Steel', color: getTypeColor('steel') },
			{ id: 10, name: 'fire', displayName: 'Fire', color: getTypeColor('fire') },
			{ id: 11, name: 'water', displayName: 'Water', color: getTypeColor('water') },
			{ id: 12, name: 'grass', displayName: 'Grass', color: getTypeColor('grass') },
			{ id: 13, name: 'electric', displayName: 'Electric', color: getTypeColor('electric') },
			{ id: 14, name: 'psychic', displayName: 'Psychic', color: getTypeColor('psychic') },
			{ id: 15, name: 'ice', displayName: 'Ice', color: getTypeColor('ice') },
			{ id: 16, name: 'dragon', displayName: 'Dragon', color: getTypeColor('dragon') },
			{ id: 17, name: 'dark', displayName: 'Dark', color: getTypeColor('dark') },
			{ id: 18, name: 'fairy', displayName: 'Fairy', color: getTypeColor('fairy') }
		]

		// Cache fallback for shorter time (1 hour)
		cacheService.set(cacheKey, fallbackTypes, 60 * 60 * 1000)
		
		return fallbackTypes
	}
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Fetches Pokémon data from PokeAPI by species ID and form with caching.
 * @param speciesId Pokémon species ID (e.g. 132 for Ditto)
 * @param form Form number (0 = base form, 1+ = alternate forms)
 * @param canGigantamax Whether this Pokemon is in Gigantamax form
 */
export async function getPokeApiPokemon(
	speciesId: number,
	form: number = 0,
	canGigantamax: boolean = false
): Promise<PokeApiPokemon> {
	const cacheKey = canGigantamax ? `${speciesId}-gmax-${form}` : CacheKeys.pokemon(speciesId, form)

	// Try cache first
	const cached = cacheService.get<PokeApiPokemon>(cacheKey)
	if (cached) {
		console.log(`Cache hit for Pokemon ${speciesId} form ${form}${canGigantamax ? ' (Gigantamax)' : ''}`)
		return cached
	}

	// Special handling for Gigantamax Pokemon
	if (canGigantamax) {
		try {
			// First get the base Pokemon to know its name
			const basePokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
			const gmaxName = `${basePokemon.name}-gmax`
			
			console.log(`Attempting to fetch Gigantamax Pokemon: ${gmaxName}`)
			const gmaxPokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${gmaxName}`)
			
			// Cache for 24 hours
			cacheService.set(cacheKey, gmaxPokemon, 24 * 60 * 60 * 1000)
			console.log(`Successfully fetched Gigantamax Pokemon: ${gmaxName}`)
			return gmaxPokemon
		} catch (error) {
			console.warn(`Failed to fetch Gigantamax form for ${speciesId}, falling back to base form:`, error)
			// Fallback to base form if Gigantamax not found
			const pokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
			cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
			return pokemon
		}
	}

	// Special cases for Pokemon that have pattern variations but same PokeAPI data
	const patternOnlyPokemon = [
		664, // Scatterbug (20 different patterns)
		665, // Spewpa (20 different patterns) 
		666  // Vivillon (20 different patterns)
	]

	// For pattern-only Pokemon or form 0 (base form), use the standard pokemon endpoint
	if (form === 0 || patternOnlyPokemon.includes(speciesId)) {
		const pokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
		// Add form information to the name for pattern Pokemon
		if (patternOnlyPokemon.includes(speciesId) && form > 0) {
			pokemon.name = `${pokemon.name}-pattern-${form}`
		}
		// Cache for 24 hours
		cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
		console.log(`Fetched Pokemon ${speciesId} form ${form}:`, pokemon)
		return pokemon
	}

	// For alternate forms, we need to calculate the correct pokemon ID
	// This is more complex as different species have different form numbering
	try {
		// First try to get the species data to find forms
		const speciesCacheKey = `species_${speciesId}`
		let speciesData = cacheService.get<any>(speciesCacheKey)

		if (!speciesData) {
			speciesData = await customFetch<any>(`${POKEAPI_BASE_URL}pokemon-species/${speciesId}`)
			cacheService.set(speciesCacheKey, speciesData, 24 * 60 * 60 * 1000)
		}

		// Get all varieties (forms) of this species
		const varieties = speciesData.varieties || []
		console.log(`Species ${speciesId} varieties:`, varieties)

		// Find the variety that matches our form number
		if (form < varieties.length) {
			const varietyUrl = varieties[form].pokemon.url
			const pokemonId = varietyUrl.split('/').filter(Boolean).pop()
			const pokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${pokemonId}`)

			// Cache the result
			cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
			console.log(`Fetched Pokemon ${speciesId} form ${form} (ID ${pokemonId}):`, pokemon)
			return pokemon
		}

		// Fallback to base form if specific form not found
		console.warn(`Form ${form} not found for species ${speciesId}, using base form`)
		const pokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
		cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
		return pokemon
	} catch (error) {
		console.warn(
			`Failed to fetch form ${form} for species ${speciesId}, falling back to base form:`,
			error
		)
		// Fallback to base form
		const pokemon = await customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
		cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
		return pokemon
	}
}

/**
 * Fetches Pokéball icon from PokeAPI items endpoint using ball name with caching
 * @param ballName Pokéball name (e.g., "Poké Ball", "Beast Ball")
 */
export async function getPokeBallIcon(ballName: string): Promise<string | null> {
	const cacheKey = CacheKeys.pokeball(ballName)

	// Try cache first
	const cached = cacheService.get<string | null>(cacheKey)
	if (cached !== null) {
		console.log(`Cache hit for pokeball: ${ballName}`)
		return cached
	}

	try {
		// Convert ball name to URL-friendly format
		// "Poké Ball" -> "poke-ball", "Beast Ball" -> "beast-ball", etc.
		const urlFriendlyName = ballName
			.toLowerCase()
			.replace(/é/g, 'e') // Replace é with e
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/[^a-z0-9-]/g, '') // Remove any other non-alphanumeric characters except hyphens

		const itemData = await customFetch<any>(`${POKEAPI_BASE_URL}item/${urlFriendlyName}`)
		const iconUrl = itemData?.sprites?.default || null

		// Cache the result (cache for 7 days since pokeball icons don't change)
		cacheService.set(cacheKey, iconUrl, 7 * 24 * 60 * 60 * 1000)

		return iconUrl
	} catch (error) {
		console.warn(`Failed to fetch pokeball icon for name ${ballName}:`, error)

		// Cache the null result to avoid repeated failed requests
		cacheService.set(cacheKey, null, 60 * 60 * 1000) // Cache failures for 1 hour

		return null
	}
}

/**
 * Gets Tera type icon from external source (GitHub or similar) with caching
 * @param teraTypeName Tera type name (e.g., "Fire", "Water")
 */
export function getTeraTypeIcon(teraTypeName: string): string {
	const cacheKey = CacheKeys.teraType(teraTypeName)

	// Try cache first
	const cached = cacheService.get<string>(cacheKey)
	if (cached) {
		console.log(`Cache hit for tera type: ${teraTypeName}`)
		return cached
	}

	// Using icons from a reliable Pokemon resource
	const typeNameLower = teraTypeName.toLowerCase()
	const iconUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeNameLower}.png`

	// Cache the URL (cache for 30 days since these URLs are stable)
	cacheService.set(cacheKey, iconUrl, 30 * 24 * 60 * 60 * 1000)

	return iconUrl
}

/**
 * Gets the best available sprite URL for a Pokémon from the PokeAPI response.
 * Prioritizes official artwork, then home, then default sprite.
 */
export function getBestSpriteUrl(sprites: PokeApiSprites, shiny = false): string | undefined {
	if (sprites.other?.['official-artwork']) {
		return shiny
			? sprites.other['official-artwork'].front_shiny ||
					sprites.other['official-artwork'].front_default
			: sprites.other['official-artwork'].front_default
	}
	if (sprites.other?.home) {
		return shiny
			? sprites.other.home.front_shiny || sprites.other.home.front_default
			: sprites.other.home.front_default
	}
	return shiny ? sprites.front_shiny : sprites.front_default
}
