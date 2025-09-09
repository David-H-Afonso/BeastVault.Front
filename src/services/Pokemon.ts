import type {
	PokemonDetailDto,
	PokemonListFilterDto,
	PokemonListItemDtoPagedResult,
	PokemonMetadata,
} from '../models/Pokemon'
import type { PokemonListItemDto } from '../models/api/types'
import { mapSortByToBackend } from '../models/Pokemon'
import { customFetch } from '../utils'
import { environment } from '../environments'
import { getPokeApiPokemon } from './Pokeapi'

/**
 * Fetches metadata for pokemon filters (types, pokeballs, natures, etc.)
 *
 * @returns Promise resolving to the pokemon metadata
 */
export async function getPokemonMetadata(): Promise<PokemonMetadata> {
	return customFetch<PokemonMetadata>(`${environment.baseUrl}/pokemon/metadata`, {
		headers: {
			Accept: 'application/json',
		},
	})
}

/**
 * Uploads one or more Pokémon PKM files (.pk1 to .pk9) to the backend.
 * The backend processes the first file and returns its PokemonDetailDto.
 *
 * @param files Array of File objects (PKM files)
 * @returns Promise resolving to the PokemonDetailDto of the first file
 */
export async function importPokemonFiles(files: File[]): Promise<PokemonDetailDto> {
	const formData = new FormData()
	files.forEach((file) => {
		formData.append('files', file)
	})

	const data = await customFetch<PokemonDetailDto>(`${environment.baseUrl}/import`, {
		method: 'POST',
		body: formData,
		headers: {
			Accept: 'application/json',
		},
	})
	return data
}

/**
 * Fetches a paginated list of Pokémon with advanced filtering and their sprites from PokeAPI.
 * This combines the main Pokemon list with sprite data in a single service call.
 *
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to Pokemon list, sprites, and total count
 */
export async function getPokemonListWithSprites(
	params: PokemonListFilterDto
): Promise<{
	pokemon: PokemonListItemDto[]
	sprites: Record<
		number,
		{
			default: string
			shiny: string
			back_default: string
			back_shiny: string
			front_female: string
			front_shiny_female: string
			back_female: string
			back_shiny_female: string
			official: string
			officialShiny: string
			home: string
			homeShiny: string
			dreamWorld: string
			showdown: string
			showdownShiny: string
			versions: any
			githubRegular: string
			githubShiny: string
		}
	>
	total: number
}> {
	// Cache management is now handled by Redux memory store
	// No need for legacy cache cleanup

	// First get the Pokemon list
	const result = await getPokemonList(params)
	const pokeList = result.items || []
	const total = result.total || 0

	// Create unique combinations of speciesId, form, and canGigantamax
	const speciesFormCombos = Array.from(
		new Set(pokeList.map((p) => `${p.speciesId}-${p.form || 0}${p.canGigantamax ? '-gmax' : ''}`))
	)

	// Fetch PokeAPI data for each unique combination
	const speciesFetches = await Promise.all(
		speciesFormCombos.map(async (combo) => {
			const baseCombo = combo.replace('-gmax', '')
			const [speciesId, form] = baseCombo.split('-').map(Number)
			const isGigantamax = combo.includes('-gmax')
			const cacheKey = combo

			try {
				const pokeApi = await getPokeApiPokemon(speciesId, form, isGigantamax)
				return [cacheKey, pokeApi] as [string, any]
			} catch {
				return [cacheKey, null] as [string, any]
			}
		})
	)

	const pokeApiMap = Object.fromEntries(speciesFetches)

	// Helper function to get generation
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

	// Map each Pokémon to its sprites
	const spriteEntries = pokeList.map((p) => {
		const cacheKey = `${p.speciesId}-${p.form || 0}${p.canGigantamax ? '-gmax' : ''}`
		const pokeApi = pokeApiMap[cacheKey]

		if (!pokeApi) {
			return [
				p.id,
				{
					default: '',
					shiny: '',
					back_default: '',
					back_shiny: '',
					front_female: '',
					front_shiny_female: '',
					back_female: '',
					back_shiny_female: '',
					official: '',
					officialShiny: '',
					home: '',
					homeShiny: '',
					dreamWorld: '',
					showdown: '',
					showdownShiny: '',
					versions: {},
					githubRegular: '',
					githubShiny: '',
				},
			]
		}

		const sprites = pokeApi.sprites
		const generation = getGeneration(p.speciesId)
		const pokemonName = pokeApi.name

		// Build GitHub sprite URLs
		let githubBaseUrl: string
		if (generation <= 8) {
			githubBaseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
		} else {
			githubBaseUrl = 'https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon'
		}

		const githubRegular = `${githubBaseUrl}/regular/${pokemonName}.png`
		const githubShiny = `${githubBaseUrl}/shiny/${pokemonName}.png`

		const pokemonSprites = {
			default: sprites.front_default || '',
			shiny: sprites.front_shiny || '',
			back_default: sprites.back_default || '',
			back_shiny: sprites.back_shiny || '',
			front_female: sprites.front_female || '',
			front_shiny_female: sprites.front_shiny_female || '',
			back_female: sprites.back_female || '',
			back_shiny_female: sprites.back_shiny_female || '',
			official: sprites.other?.['official-artwork']?.front_default || '',
			officialShiny: sprites.other?.['official-artwork']?.front_shiny || '',
			home: sprites.other?.home?.front_default || '',
			homeShiny: sprites.other?.home?.front_shiny || '',
			dreamWorld: sprites.other?.dream_world?.front_default || '',
			showdown: sprites.other?.showdown?.front_default || '',
			showdownShiny: sprites.other?.showdown?.front_shiny || '',
			versions: sprites.versions || {},
			githubRegular,
			githubShiny,
		}

		return [p.id, pokemonSprites]
	})

	const sprites = Object.fromEntries(spriteEntries)

	return { pokemon: pokeList, sprites, total }
}

/**
 * Fetches a paginated list of Pokémon with advanced filtering using the main endpoint.
 *
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to the paginated Pokémon list
 */
export async function getPokemonList(
	params: PokemonListFilterDto
): Promise<PokemonListItemDtoPagedResult> {
	// Transform SortBy values from frontend enum numbers to backend field names
	const transformedParams = { ...params }

	if (transformedParams.SortBy !== undefined) {
		transformedParams.SortBy = mapSortByToBackend(transformedParams.SortBy as any) as any
	}

	if (transformedParams.ThenSortBy !== undefined) {
		transformedParams.ThenSortBy = mapSortByToBackend(transformedParams.ThenSortBy as any) as any
	}

	// Filter out undefined values to keep query string clean
	const cleanParams = Object.fromEntries(
		Object.entries(transformedParams).filter(([_, value]) => value !== undefined && value !== null)
	) as Record<string, string | number | boolean>

	const result = await customFetch<PokemonListItemDtoPagedResult>(
		`${environment.baseUrl}/pokemon`,
		{
			params: cleanParams,
			headers: {
				Accept: 'application/json',
			},
		}
	)

	return result
}

/**
 * Deletes a Pokémon from the database by its ID.
 * This removes the Pokémon and related data from the database, and deletes the main file. Backup is preserved.
 *
 * @param pokemonId The ID of the Pokémon to delete
 * @returns Promise resolving to a delete result object from the backend
 */
export async function deletePokemonFromDatabase(pokemonId: number): Promise<{
	deleted: boolean
	fileDeleted: boolean
	backupPreserved: boolean
}> {
	return customFetch<{
		deleted: boolean
		fileDeleted: boolean
		backupPreserved: boolean
	}>(`${environment.baseUrl}/pokemon/${pokemonId}/database`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
		},
	})
}

/**
 * Deletes a Pokémon completely (database + physical file + backup).
 * This removes the Pokémon from the database AND deletes both the main file and backup from disk.
 * This is an irreversible operation.
 *
 * @param pokemonId The ID of the Pokémon to delete completely
 * @returns Promise resolving to a delete result object from the backend
 */
export async function deletePokemonCompletely(pokemonId: number): Promise<{
	deleted: boolean
	fileDeleted: boolean
	backupDeleted: boolean
	fileName?: string
}> {
	return customFetch<{
		deleted: boolean
		fileDeleted: boolean
		backupDeleted: boolean
		fileName?: string
	}>(`${environment.baseUrl}/pokemon/${pokemonId}/backup`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/json',
		},
	})
}

/**
 * Downloads a stored file by its internal ID.
 *
 * @param id The internal file ID
 * @returns Promise resolving to an object with the blob and filename
 */
export async function downloadFileById(id: number): Promise<{ blob: Blob; filename: string }> {
	const response = await fetch(`${environment.baseUrl}/files/${id}`, {
		method: 'GET',
		headers: {
			Accept: 'application/octet-stream',
		},
	})
	if (!response.ok) {
		throw new Error(`Failed to download file with id ${id}: ${response.statusText}`)
	}

	// Extract filename from Content-Disposition header
	const contentDisposition = response.headers.get('Content-Disposition')
	let filename = `pokemon_${id}.pk9`

	if (contentDisposition) {
		// Try to extract filename from Content-Disposition header
		const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
		if (filenameMatch && filenameMatch[1]) {
			filename = filenameMatch[1].replace(/['"]/g, '')
		}
		// Also try filename* format (RFC 5987)
		const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
		if (filenameStarMatch && filenameStarMatch[1]) {
			filename = decodeURIComponent(filenameStarMatch[1])
		}
	}

	const blob = await response.blob()
	return { blob, filename }
}

/**
 * Downloads the PKM file stored on disk for the specified Pokémon.
 * Useful for comparing the database backup vs. the file on disk.
 *
 * @param pokemonId The ID of the Pokémon whose PKM file to download
 * @returns Promise resolving to an object with the blob and filename
 */
export async function downloadPkmFileFromDisk(
	pokemonId: number
): Promise<{ blob: Blob; filename: string }> {
	const response = await fetch(`${environment.baseUrl}/export/database/${pokemonId}`, {
		method: 'GET',
		headers: {
			Accept: 'application/octet-stream',
		},
	})
	if (!response.ok) {
		throw new Error(
			`Failed to download PKM file for Pokémon ID ${pokemonId}: ${response.statusText}`
		)
	}

	// Extract filename from Content-Disposition header
	const contentDisposition = response.headers.get('Content-Disposition')
	let filename = `pokemon_${pokemonId}.pk9`

	if (contentDisposition) {
		// Try to extract filename from Content-Disposition header
		const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
		if (filenameMatch && filenameMatch[1]) {
			filename = filenameMatch[1].replace(/['"]/g, '')
		}
		// Also try filename* format (RFC 5987)
		const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
		if (filenameStarMatch && filenameStarMatch[1]) {
			filename = decodeURIComponent(filenameStarMatch[1])
		}
	}

	const blob = await response.blob()
	return { blob, filename }
}

/**
 * Scans the user's Documents/BeastVault/storage directory for new Pokémon files and imports them.
 * Files already in the database (based on SHA256 hash) will be skipped.
 *
 * @returns Promise resolving to the scan result summary and details
 */
export async function scanPokemonDirectory(): Promise<{
	success: boolean
	summary: {
		totalProcessed: number
		newlyImported: number
		alreadyImported: number
		deleted: number
		errors: number
	}
	details: {
		newlyImported: string[]
		alreadyImported: string[]
		deleted: string[]
		errors: string[]
	}
}> {
	return customFetch(`${environment.baseUrl}/scan/directory`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
		},
	})
}
