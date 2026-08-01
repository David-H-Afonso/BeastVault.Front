import { environment } from '@/environments'
import { customFetch } from '@/utils'
import { getAuthToken } from '@/utils/authToken'

export interface SaveFileSummaryDto {
	id: number
	title: string | null
	displayTitle: string
	originalFileName: string
	format: string
	size: number
	generation: number
	originGame: number
	gameName: string
	saveType: string
	importedAt: string
	notes: string | null
	trainerName: string
	trainerGender: number
	trainerId: number
	secretId: number
	playTime: string
	badgeCount: number | null
	badgeTotal: number | null
	dexSeen: number
	dexCaught: number
	partyCount: number
	storedPokemonCount: number
	checksumsValid: boolean
}

export interface SaveTrainerDto {
	trainerName: string
	trainerId: number
	secretId: number
	gender: number
	language: string
	money: number
	playTimeHours: number
	playTimeMinutes: number
	playTimeSeconds: number
	playTime: string
	badgeCount: number | null
	dexSeen: number
	dexCaught: number
}

export interface SavePokedexEntryDto {
	speciesId: number
	speciesName: string
	seen: boolean
	caught: boolean
}

export interface SavePokemonPreviewDto {
	id: number
	location: 'party' | 'box'
	boxNumber: number | null
	slotNumber: number
	speciesId: number
	speciesName: string
	nickname: string | null
	level: number
	isShiny: boolean
	isEgg: boolean
	form: number
	gender: number
	nature: number
	natureName: string
	abilityName: string
	heldItemName: string
	moves: string[]
	pokemonHash: string
	existingPokemonId: number | null
}

export interface SaveFileDetailDto {
	summary: SaveFileSummaryDto
	trainer: SaveTrainerDto
	pokedex: SavePokedexEntryDto[]
	pokemon: SavePokemonPreviewDto[]
}

export interface SaveFileUploadResultDto {
	fileName: string
	status: 'imported' | 'duplicate' | 'error'
	saveFileId: number | null
	message: string | null
}

export interface SavePokemonImportResultDto {
	previewId: number
	status: 'imported' | 'duplicate' | 'error'
	pokemonId: number | null
	message: string | null
}

export interface UpdateSaveFileRequest {
	title: string | null
	notes: string | null
}

export async function uploadSaveFiles(files: File[]): Promise<SaveFileUploadResultDto[]> {
	const formData = new FormData()
	files.forEach((file) => formData.append('files', file))

	return customFetch<SaveFileUploadResultDto[]>(`${environment.baseUrl}/saves`, {
		method: 'POST',
		body: formData,
		headers: { Accept: 'application/json' },
	})
}

export function getSaveFiles(): Promise<SaveFileSummaryDto[]> {
	return customFetch<SaveFileSummaryDto[]>(`${environment.baseUrl}/saves`, {
		headers: { Accept: 'application/json' },
	})
}

export function getSaveFile(id: number): Promise<SaveFileDetailDto> {
	return customFetch<SaveFileDetailDto>(`${environment.baseUrl}/saves/${id}`, {
		headers: { Accept: 'application/json' },
	})
}

export async function updateSaveFile(id: number, request: UpdateSaveFileRequest): Promise<void> {
	await customFetch<void>(`${environment.baseUrl}/saves/${id}`, {
		method: 'PATCH',
		body: request,
		headers: { Accept: 'application/json' },
	})
}

export function importSavePokemon(
	id: number,
	previewIds: number[]
): Promise<SavePokemonImportResultDto[]> {
	return customFetch<SavePokemonImportResultDto[]>(`${environment.baseUrl}/saves/${id}/import`, {
		method: 'POST',
		body: { previewIds },
		headers: { Accept: 'application/json' },
	})
}

export async function downloadSaveFile(
	id: number,
	fallbackFileName: string
): Promise<{ blob: Blob; filename: string }> {
	const token = getAuthToken()
	const response = await fetch(`${environment.baseUrl}/saves/${id}/download`, {
		headers: {
			Accept: 'application/octet-stream',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to download save: ${response.status} ${response.statusText}`)
	}

	const contentDisposition = response.headers.get('Content-Disposition') ?? ''
	const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
	const plainName = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]
	const filename = encodedName ? decodeURIComponent(encodedName) : plainName || fallbackFileName

	return { blob: await response.blob(), filename }
}

export async function deleteSaveFile(id: number): Promise<void> {
	await customFetch<void>(`${environment.baseUrl}/saves/${id}`, {
		method: 'DELETE',
		headers: { Accept: 'application/json' },
	})
}
