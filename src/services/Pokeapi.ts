import type { PokeApiPokemon, PokeApiSprites } from '../models/Pokeapi'
import { simpleFetcher } from '../utils/simpleFetcher'

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
	// Special handling for Gigantamax Pokemon
	if (canGigantamax) {
		try {
			// First get the base Pokemon to know its name
			const baseUrl = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
			const basePokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(baseUrl)

			// Try to fetch the Gigantamax variant
			const gmaxName = `${basePokemon.name}-gmax`

			try {
				const gmaxUrl = `${POKEAPI_BASE_URL}pokemon/${gmaxName}`
				const gmaxPokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(gmaxUrl)
				return gmaxPokemon
			} catch (gmaxError) {
				// If Gigantamax variant doesn't exist, fall back to base form
				return basePokemon
			}
		} catch (error) {
			throw new Error(`Failed to fetch Pokemon ${speciesId} for Gigantamax: ${error}`)
		}
	}

	// For form 0 (base form), use the standard pokemon endpoint
	if (form === 0) {
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(url)
		return pokemon
	}

	// For alternate forms, we need to calculate the correct pokemon ID
	// This is more complex as different species have different form numbering
	try {
		// First try to get the species data to find forms
		const speciesUrl = `${POKEAPI_BASE_URL}pokemon-species/${speciesId}`
		const speciesData = await simpleFetcher.fetchWithCache<any>(speciesUrl)

		// Get all varieties (forms) of this species
		const varieties = speciesData.varieties || []

		// Find the variety that matches our form number
		if (form < varieties.length) {
			const varietyUrl = varieties[form].pokemon.url
			const pokemonId = varietyUrl.split('/').filter(Boolean).pop()
			const pokemonUrl = `${POKEAPI_BASE_URL}pokemon/${pokemonId}`
			const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(pokemonUrl)
			return pokemon
		}

		// Fallback to base form if specific form not found
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(url)
		return pokemon
	} catch (error) {
		console.warn(
			`Failed to fetch form ${form} for species ${speciesId}, falling back to base form:`,
			error
		)
		// Fallback to base form
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(url)
		return pokemon
	}
}

/**
 * Fetches Pokéball icon from PokeAPI items endpoint
 *  * @param ballName Pokéball name (e.g., "Poké Ball", "Beast Ball")
 */
export async function getPokeBallIcon(ballName: string): Promise<string | null> {
	try {
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
		const itemData = await simpleFetcher.fetchWithCache<any>(itemUrl)
		const iconUrl = itemData?.sprites?.default || null

		return iconUrl
	} catch (error) {
		console.warn(`Failed to fetch pokeball icon for name ${ballName}:`, error)
		return null
	}
}

/**
 * Gets Tera type icon from external source (GitHub)
 * @param teraTypeName Tera type name (e.g., "Fire", "Water")
 */
export async function getTeraTypeIcon(teraTypeName: string): Promise<string | null> {
	if (!teraTypeName) {
		console.warn('Tera type name is null or undefined')
		return null
	}

	// Using icons from a reliable Pokemon resource
	const typeNameLower = teraTypeName.toLowerCase()
	const iconUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeNameLower}.png`

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
