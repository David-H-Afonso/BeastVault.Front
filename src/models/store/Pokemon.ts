import type { PokemonListFilterDto, PokemonListItemDto } from '../Pokemon'

export interface PokemonSprites {
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

export interface PokemonState {
	// Pokemon data
	pokemon: PokemonListItemDto[]
	sprites: Record<number, PokemonSprites>
	totalPokemon: number

	// API cache for PokeAPI data
	pokeApiCache: Record<string, any>

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
