import { environment } from '@/environments'
import type { PokemonSpritesDto } from '@/models/api/types'
import { customFetch } from '@/utils'
import { getAuthToken } from '@/utils/authToken'

export type DexHuntPriority = 0 | 1 | 2
export type DexHuntStatus = 'all' | 'open' | 'caught'
export type DexHuntSort = 'manual' | 'number' | 'name' | 'generation' | 'priority' | 'added' | 'caught'

export interface DexHuntGame {
	id: number
	name: string
	generation: number
}

export interface DexHuntListSummary {
	id: number
	name: string
	gameId: number
	gameName: string
	description: string | null
	sortOrder: number
	totalCount: number
	caughtCount: number
	createdAt: string
	updatedAt: string
}

export interface DexHuntItem {
	id: number
	speciesId: number
	speciesName: string
	generation: number
	types: string[]
	sprites: PokemonSpritesDto | null
	priority: DexHuntPriority
	isCaught: boolean
	notes: string | null
	sortOrder: number
	addedAt: string
	updatedAt: string
	caughtAt: string | null
}

export interface DexHuntListDetail {
	list: DexHuntListSummary
	items: DexHuntItem[]
}

export interface DexHuntFilters {
	search?: string
	status?: DexHuntStatus
	priority?: DexHuntPriority | null
	generation?: number | null
	type?: string
	sortBy?: DexHuntSort
	descending?: boolean
}

export interface DexHuntExport {
	schemaVersion: 1
	exportedAt?: string
	list: {
		name: string
		game: { id: number; name: string }
		description?: string | null
		items: Array<{
			speciesId: number
			speciesName?: string
			priority: DexHuntPriority
			caught: boolean
			notes?: string | null
			caughtAt?: string | null
		}>
	}
}

export function getDexHuntGames(): Promise<DexHuntGame[]> {
	return customFetch(`${environment.baseUrl}/dex-hunts/games`)
}

export function getDexHunts(): Promise<DexHuntListSummary[]> {
	return customFetch(`${environment.baseUrl}/dex-hunts`)
}

export function getDexHunt(id: number, filters: DexHuntFilters = {}): Promise<DexHuntListDetail> {
	const params: Record<string, string | number | boolean> = {}
	if (filters.search) params.search = filters.search
	if (filters.status) params.status = filters.status
	if (filters.priority != null) params.priority = filters.priority
	if (filters.generation != null) params.generation = filters.generation
	if (filters.type) params.type = filters.type
	if (filters.sortBy) params.sortBy = filters.sortBy
	if (filters.descending) params.descending = true
	return customFetch(`${environment.baseUrl}/dex-hunts/${id}`, { params })
}

export function createDexHunt(request: { name: string; gameId: number; description?: string | null }): Promise<DexHuntListSummary> {
	return customFetch(`${environment.baseUrl}/dex-hunts`, { method: 'POST', body: request })
}

export function updateDexHunt(id: number, request: { name: string; gameId: number; description: string | null }): Promise<DexHuntListSummary> {
	return customFetch(`${environment.baseUrl}/dex-hunts/${id}`, { method: 'PATCH', body: request })
}

export async function deleteDexHunt(id: number): Promise<void> {
	await customFetch(`${environment.baseUrl}/dex-hunts/${id}`, { method: 'DELETE' })
}

export async function reorderDexHunts(listIds: number[]): Promise<void> {
	await customFetch(`${environment.baseUrl}/dex-hunts/reorder`, { method: 'PUT', body: { listIds } })
}

export function addDexHuntItem(listId: number, request: { speciesId: number; priority: DexHuntPriority; notes?: string | null }): Promise<DexHuntItem> {
	return customFetch(`${environment.baseUrl}/dex-hunts/${listId}/items`, { method: 'POST', body: request })
}

export async function updateDexHuntItem(listId: number, itemId: number, request: { isCaught?: boolean; priority?: DexHuntPriority; notes?: string | null }): Promise<void> {
	await customFetch(`${environment.baseUrl}/dex-hunts/${listId}/items/${itemId}`, { method: 'PATCH', body: request })
}

export async function deleteDexHuntItem(listId: number, itemId: number): Promise<void> {
	await customFetch(`${environment.baseUrl}/dex-hunts/${listId}/items/${itemId}`, { method: 'DELETE' })
}

export async function reorderDexHuntItems(listId: number, itemIds: number[]): Promise<void> {
	await customFetch(`${environment.baseUrl}/dex-hunts/${listId}/items/reorder`, { method: 'PUT', body: { itemIds } })
}

export function importDexHunt(payload: DexHuntExport): Promise<DexHuntListSummary> {
	return customFetch(`${environment.baseUrl}/dex-hunts/import`, { method: 'POST', body: payload })
}

export async function downloadDexHunt(id: number, fallbackName: string): Promise<{ blob: Blob; filename: string }> {
	const token = getAuthToken()
	const response = await fetch(`${environment.baseUrl}/dex-hunts/${id}/export`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	})
	if (!response.ok) throw new Error(`Export failed with HTTP ${response.status}`)
	const disposition = response.headers.get('Content-Disposition') ?? ''
	const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
	const quoted = disposition.match(/filename="?([^";]+)"?/i)?.[1]
	const filename = encoded ? decodeURIComponent(encoded) : quoted ?? `dex-hunt-${fallbackName}.json`
	return { blob: await response.blob(), filename }
}
