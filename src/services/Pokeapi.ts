import { customFetch } from '../utils'
import type { PokeApiPokemon, PokeApiSprites } from '../models/Pokeapi'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/'

/**
 * Fetches Pokémon data from PokeAPI by species ID and form.
 * @param speciesId Pokémon species ID (e.g. 132 for Ditto)
 * @param form Form number (0 = base form, 1+ = alternate forms)
 */
export async function getPokeApiPokemon(
	speciesId: number,
	form: number = 0
): Promise<PokeApiPokemon> {
	// For form 0 (base form), use the standard pokemon endpoint
	if (form === 0) {
		return customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
	}

	// For alternate forms, we need to calculate the correct pokemon ID
	// This is more complex as different species have different form numbering
	try {
		// First try to get the species data to find forms
		const speciesData = await customFetch<any>(`${POKEAPI_BASE_URL}pokemon-species/${speciesId}`)

		// Get all varieties (forms) of this species
		const varieties = speciesData.varieties || []
		console.log(speciesData)

		// Find the variety that matches our form number
		if (form < varieties.length) {
			const varietyUrl = varieties[form].pokemon.url
			const pokemonId = varietyUrl.split('/').filter(Boolean).pop()
			return customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${pokemonId}`)
		}

		// Fallback to base form if specific form not found
		return customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
	} catch (error) {
		console.warn(
			`Failed to fetch form ${form} for species ${speciesId}, falling back to base form:`,
			error
		)
		// Fallback to base form
		return customFetch<PokeApiPokemon>(`${POKEAPI_BASE_URL}pokemon/${speciesId}`)
	}
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
