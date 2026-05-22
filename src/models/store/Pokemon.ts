import type { PokemonListFilterDto, PokemonListItemDto } from '../Pokemon'

export interface PokemonState {
	// Pokemon data (enriched from backend - includes sprites, types, ball info)
	pokemon: PokemonListItemDto[]
	totalPokemon: number

	tagGroups: { tagName: string; pokemon: PokemonListItemDto[] }[]

	// Filters and pagination
	currentFilters: PokemonListFilterDto

	// UI State
	loading: boolean
	error: string | null

	// Import/Scan state
	importing: boolean
	scanning: boolean
	importResult: string | null

	// Last fetch timestamp for cache invalidation
	lastFetch: number | null
}

export interface FetchPokemonListResult {
	items: PokemonListItemDto[]
	total: number
}

export interface ImportResult {
	summary: {
		newlyImported: number
		alreadyImported: number
		errors: number
	}
	details?: any[]
}

export interface ScanResult {
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
}
