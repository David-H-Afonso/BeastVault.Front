import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import type { PokemonListFilterDto, PokemonDetailDto } from '@/models/Pokemon'
import {
	getPokemonListWithSprites,
	deletePokemonFromDatabase,
	importPokemonFiles,
	scanPokemonDirectory,
} from '@/services/Pokemon'
import { cacheService } from '@/services/CacheService'

// ===================================
// TYPES
// ===================================

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

// ===================================
// ASYNC THUNKS
// ===================================

export const fetchPokemonList = createAsyncThunk<
	{
		pokemon: PokemonListItemDto[]
		sprites: Record<number, PokemonSprites>
		total: number
		cache: Record<string, any>
	},
	PokemonListFilterDto,
	{ state: { pokemon: PokemonState } }
>('pokemon/fetchPokemonList', async (filters, { getState, rejectWithValue }) => {
	try {
		const state = getState().pokemon
		const pokeApiCache = { ...state.pokeApiCache }

		const result = await getPokemonListWithSprites(filters, pokeApiCache)

		return {
			pokemon: result.pokemon,
			sprites: result.sprites,
			total: result.total,
			cache: pokeApiCache, // Return updated cache
		}
	} catch (error: any) {
		return rejectWithValue(error.message || 'Failed to fetch Pokémon list')
	}
})

export const deletePokemon = createAsyncThunk<
	number, // returns the deleted pokemon ID
	number, // pokemon ID to delete
	{ rejectValue: string }
>('pokemon/deletePokemon', async (pokemonId, { rejectWithValue }) => {
	try {
		await deletePokemonFromDatabase(pokemonId)
		return pokemonId
	} catch (error: any) {
		return rejectWithValue(error.message || 'Failed to delete Pokémon')
	}
})

export const importPokemon = createAsyncThunk<
	PokemonDetailDto, // returns the imported pokemon data
	File[], // files to import
	{ rejectValue: string }
>('pokemon/importPokemon', async (files, { rejectWithValue }) => {
	try {
		const result = await importPokemonFiles(files)
		return result
	} catch (error: any) {
		return rejectWithValue(error.message || 'Failed to import Pokémon files')
	}
})

export const scanDirectory = createAsyncThunk<
	ScanResult, // returns scan result
	void, // no parameters needed
	{ rejectValue: string }
>('pokemon/scanDirectory', async (_, { rejectWithValue }) => {
	try {
		const result = await scanPokemonDirectory()
		return result
	} catch (error: any) {
		return rejectWithValue(error.message || 'Failed to scan directory')
	}
})

// ===================================
// SLICE
// ===================================

const initialState: PokemonState = {
	pokemon: [],
	sprites: {},
	totalPokemon: 0,
	pokeApiCache: {},
	currentFilters: {
		Skip: 0,
		Take: 50,
	},
	loading: false,
	error: null,
	importing: false,
	scanning: false,
	importResult: null,
	lastFetch: null,
}

const pokemonSlice = createSlice({
	name: 'pokemon',
	initialState,
	reducers: {
		// Filter management
		setFilters: (state, action: PayloadAction<PokemonListFilterDto>) => {
			state.currentFilters = action.payload
		},
		updateFilters: (state, action: PayloadAction<Partial<PokemonListFilterDto>>) => {
			state.currentFilters = { ...state.currentFilters, ...action.payload }
		},
		resetFilters: (state) => {
			state.currentFilters = {
				Skip: 0,
				Take: 50,
			}
		},

		// Clear error
		clearError: (state) => {
			state.error = null
		},

		// Clear cache
		clearCache: (state) => {
			state.pokeApiCache = {}
			state.lastFetch = null
		},

		// Clear cache and Cache Storage
		clearAllCache: (state) => {
			state.pokeApiCache = {}
			state.lastFetch = null
			// Clear Cache Storage as well
			cacheService.clear().catch((error) => {
				console.warn('Failed to clear Cache Storage:', error)
			})
		},

		// Update pokemon tags locally (optimistic update)
		updatePokemonTags: (state, action: PayloadAction<{ pokemonId: number; tags: TagDto[] }>) => {
			const { pokemonId, tags } = action.payload
			const pokemonIndex = state.pokemon.findIndex((p) => p.id === pokemonId)
			if (pokemonIndex !== -1) {
				state.pokemon[pokemonIndex].tags = tags
			}
		},

		// Clear import result
		clearImportResult: (state) => {
			state.importResult = null
		},

		// Clear all data (useful for logout, etc.)
		clearAllData: (state) => {
			state.pokemon = []
			state.sprites = {}
			state.totalPokemon = 0
			state.pokeApiCache = {}
			state.currentFilters = {
				Skip: 0,
				Take: 50,
			}
			state.loading = false
			state.error = null
			state.importing = false
			state.scanning = false
			state.importResult = null
			state.lastFetch = null
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Pokemon List
			.addCase(fetchPokemonList.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchPokemonList.fulfilled, (state, action) => {
				state.loading = false
				state.pokemon = action.payload.pokemon
				state.sprites = { ...state.sprites, ...action.payload.sprites }
				state.totalPokemon = action.payload.total
				state.pokeApiCache = action.payload.cache // Update cache
				state.lastFetch = Date.now()
			})
			.addCase(fetchPokemonList.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Delete Pokemon
			.addCase(deletePokemon.pending, (state) => {
				state.error = null
			})
			.addCase(deletePokemon.fulfilled, (state, action) => {
				const pokemonId = action.payload
				state.pokemon = state.pokemon.filter((p) => p.id !== pokemonId)
				delete state.sprites[pokemonId]
				state.totalPokemon = Math.max(0, state.totalPokemon - 1)
			})
			.addCase(deletePokemon.rejected, (state, action) => {
				state.error = action.payload as string
			})

			// Import Pokemon
			.addCase(importPokemon.pending, (state) => {
				state.importing = true
				state.error = null
				state.importResult = null
			})
			.addCase(importPokemon.fulfilled, (state) => {
				state.importing = false
				state.importResult = 'File imported successfully!'
			})
			.addCase(importPokemon.rejected, (state, action) => {
				state.importing = false
				state.error = action.payload as string
			})

			// Scan Directory
			.addCase(scanDirectory.pending, (state) => {
				state.scanning = true
				state.error = null
				state.importResult = null
			})
			.addCase(scanDirectory.fulfilled, (state, action) => {
				state.scanning = false
				const result = action.payload
				state.importResult = `Scan completed: ${result.summary.newlyImported} new, ${result.summary.alreadyImported} existing, ${result.summary.errors} errors`
			})
			.addCase(scanDirectory.rejected, (state, action) => {
				state.scanning = false
				state.error = action.payload as string
			})
	},
})

// ===================================
// EXPORTS
// ===================================

export const {
	setFilters,
	updateFilters,
	resetFilters,
	clearError,
	clearCache,
	clearAllCache,
	updatePokemonTags,
	clearImportResult,
	clearAllData,
} = pokemonSlice.actions

export default pokemonSlice.reducer

// Selectors
export const selectPokemon = (state: { pokemon: PokemonState }) => state.pokemon.pokemon
export const selectSprites = (state: { pokemon: PokemonState }) => state.pokemon.sprites
export const selectTotalPokemon = (state: { pokemon: PokemonState }) => state.pokemon.totalPokemon
export const selectCurrentFilters = (state: { pokemon: PokemonState }) =>
	state.pokemon.currentFilters
export const selectLoading = (state: { pokemon: PokemonState }) => state.pokemon.loading
export const selectError = (state: { pokemon: PokemonState }) => state.pokemon.error
export const selectImporting = (state: { pokemon: PokemonState }) => state.pokemon.importing
export const selectScanning = (state: { pokemon: PokemonState }) => state.pokemon.scanning
export const selectImportResult = (state: { pokemon: PokemonState }) => state.pokemon.importResult
export const selectPokeApiCache = (state: { pokemon: PokemonState }) => state.pokemon.pokeApiCache
export const selectLastFetch = (state: { pokemon: PokemonState }) => state.pokemon.lastFetch

// Memoized selectors for better performance
export const selectPokemonById = (pokemonId: number) => (state: { pokemon: PokemonState }) =>
	state.pokemon.pokemon.find((p) => p.id === pokemonId)

export const selectSpriteById = (pokemonId: number) => (state: { pokemon: PokemonState }) =>
	state.pokemon.sprites[pokemonId]
