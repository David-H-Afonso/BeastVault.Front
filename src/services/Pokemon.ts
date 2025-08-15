import type {
	PokemonDetailDto,
	PokemonListFilterDto,
	PokemonListItemDtoPagedResult,
} from '../models/Pokemon'
import { customFetch } from '../utils'
import { environment } from '../environments'

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
 * Fetches a paginated list of Pokémon with optional filters.
 *
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to the paginated Pokémon list
 */
export async function getPokemonList(params: PokemonListFilterDto): Promise<{
	items: PokemonListItemDtoPagedResult
}> {
	return customFetch(`${environment.baseUrl}/pokemon`, {
		params: { ...params } as Record<string, string | number | boolean>,
		headers: {
			Accept: 'application/json',
		},
	})
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
