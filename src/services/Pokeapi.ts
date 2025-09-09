import type { PokeApiPokemon, PokeApiSprites } from '../models/Pokeapi'
import { cacheService, CacheKeys } from './CacheService'
import { staticResourceCache } from './StaticResourceCache'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/'

/**
 * Fetches Pokémon data from PokeAPI by species ID and form with enhanced caching.
 * @param speciesId Pokémon species ID (e.g. 132 for Ditto)
 * @param form Form number (0 = base form, 1+ = alternate forms)
 * @param canGigantamax Whether this Pokemon can Gigantamax (affects naming)
 */
export async function getPokeApiPokemon(
	speciesId: number,
	form: number = 0,
	canGigantamax: boolean = false
): Promise<PokeApiPokemon> {
	const cacheKey = CacheKeys.pokemon(speciesId, form, canGigantamax)

	// Try cache first
	const cached = await cacheService.get<PokeApiPokemon>(cacheKey)
	if (cached) {
		return cached
	}

	// Special handling for Gigantamax Pokemon
	if (canGigantamax) {
		try {
			// First get the base Pokemon to know its name
			const baseUrl = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
			const basePokemon = await staticResourceCache.fetchWithCache<PokeApiPokemon>(baseUrl)

			// Try to fetch the Gigantamax variant
			const gmaxName = `${basePokemon.name}-gmax`

			try {
				const gmaxUrl = `${POKEAPI_BASE_URL}pokemon/${gmaxName}`
				const gmaxPokemon = await staticResourceCache.fetchWithCache<PokeApiPokemon>(gmaxUrl)

				// Cache for 24 hours
				cacheService.set(cacheKey, gmaxPokemon, 24 * 60 * 60 * 1000)
				return gmaxPokemon
			} catch (gmaxError) {
				// If Gigantamax variant doesn't exist, fall back to base form
				// But still cache with the Gigantamax key
				cacheService.set(cacheKey, basePokemon, 24 * 60 * 60 * 1000)
				return basePokemon
			}
		} catch (error) {
			throw new Error(`Failed to fetch Pokemon ${speciesId} for Gigantamax: ${error}`)
		}
	}

	// For form 0 (base form), use the standard pokemon endpoint
	if (form === 0) {
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await staticResourceCache.fetchWithCache<PokeApiPokemon>(url)
		// Cache for 24 hours
		await cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
		return pokemon
	}

	// For alternate forms, we need to calculate the correct pokemon ID
	// This is more complex as different species have different form numbering
	try {
		// First try to get the species data to find forms
		const speciesCacheKey = `species_${speciesId}`
		let speciesData = await cacheService.get<any>(speciesCacheKey)

		if (!speciesData) {
			const speciesUrl = `${POKEAPI_BASE_URL}pokemon-species/${speciesId}`
			speciesData = await staticResourceCache.fetchWithCache<any>(speciesUrl)
			await cacheService.set(speciesCacheKey, speciesData, 24 * 60 * 60 * 1000)
		}

		// Get all varieties (forms) of this species
		const varieties = speciesData.varieties || []

		// Find the variety that matches our form number
		if (form < varieties.length) {
			const varietyUrl = varieties[form].pokemon.url
			const pokemonId = varietyUrl.split('/').filter(Boolean).pop()
			const pokemonUrl = `${POKEAPI_BASE_URL}pokemon/${pokemonId}`
			const pokemon = await staticResourceCache.fetchWithCache<PokeApiPokemon>(pokemonUrl)

			// Cache the result
			await cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
			return pokemon
		}

		// Fallback to base form if specific form not found
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await staticResourceCache.fetchWithCache<PokeApiPokemon>(url)
		await cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
		return pokemon
	} catch (error) {
		console.warn(
			`Failed to fetch form ${form} for species ${speciesId}, falling back to base form:`,
			error
		)
		// Fallback to base form
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await staticResourceCache.fetchWithCache<PokeApiPokemon>(url)
		await cacheService.set(cacheKey, pokemon, 24 * 60 * 60 * 1000)
		return pokemon
	}
}

/**
 * Fetches Pokéball icon from PokeAPI items endpoint using ball name with enhanced caching
 * @param ballName Pokéball name (e.g., "Poké Ball", "Beast Ball")
 */
export async function getPokeBallIcon(ballName: string): Promise<string | null> {
	const cacheKey = CacheKeys.pokeball(ballName)

	// Try cache first
	const cached = await cacheService.get<string | null>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		console.log(ballName)
		if (!ballName) {
			console.warn('Ball name is null or undefined')
			return null
		}
		
		// Convert ball name to URL-friendly format
		// "Poké Ball" -> "poke-ball", "Beast Ball" -> "beast-ball", etc.
		const urlFriendlyName = ballName
			.toLowerCase()
			.replace(/é/g, 'e') // Replace é with e
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/[^a-z0-9-]/g, '') // Remove any other non-alphanumeric characters except hyphens

		const itemUrl = `${POKEAPI_BASE_URL}item/${urlFriendlyName}`
		const itemData = await staticResourceCache.fetchWithCache<any>(itemUrl)
		const iconUrl = itemData?.sprites?.default || null

		// Cache the result (cache for 7 days since pokeball icons don't change)
		await cacheService.set(cacheKey, iconUrl, 7 * 24 * 60 * 60 * 1000)

		return iconUrl
	} catch (error) {
		console.warn(`Failed to fetch pokeball icon for name ${ballName}:`, error)

		// Cache the null result to avoid repeated failed requests
		await cacheService.set(cacheKey, null, 60 * 60 * 1000) // Cache failures for 1 hour

		return null
	}
}

/**
 * Gets Tera type icon from external source (GitHub or similar) with caching
 * @param teraTypeName Tera type name (e.g., "Fire", "Water")
 */
export async function getTeraTypeIcon(teraTypeName: string): Promise<string | null> {
	if (!teraTypeName) {
		console.warn('Tera type name is null or undefined')
		return null
	}

	const cacheKey = CacheKeys.teraType(teraTypeName)

	// Try cache first
	const cached = await cacheService.get<string>(cacheKey)
	if (cached) {
		return cached
	}

	// Using icons from a reliable Pokemon resource
	const typeNameLower = teraTypeName.toLowerCase()
	const iconUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeNameLower}.png`

	// Cache the URL (cache for 30 days since these URLs are stable)
	await cacheService.set(cacheKey, iconUrl, 30 * 24 * 60 * 60 * 1000)

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
