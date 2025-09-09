import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TagDto } from '@/models/api/types'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import {
	fetchPokemonList,
	fetchPokemonByTagsGrouped,
	deletePokemon,
	importPokemon,
	scanDirectory,
} from './thunks'
import type { PokemonState } from '@/models/store/Pokemon'

const initialState: PokemonState = {
	pokemon: [],
	sprites: {},
	totalPokemon: 0,
	tagGroups: [],
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

// ===================================
// SLICE
// ===================================

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
			import('@/services/CacheService').then(({ cacheService }) => {
				cacheService.clear().catch((error) => {
					console.warn('Failed to clear Cache Storage:', error)
				})
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

			// Fetch Pokemon by Tags Grouped
			.addCase(fetchPokemonByTagsGrouped.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchPokemonByTagsGrouped.fulfilled, (state, action) => {
				state.loading = false
				state.pokemon = action.payload.pokemon
				state.sprites = { ...state.sprites, ...action.payload.sprites }
				state.totalPokemon = action.payload.total
				state.tagGroups = action.payload.tagGroups
				state.lastFetch = Date.now()
			})
			.addCase(fetchPokemonByTagsGrouped.rejected, (state, action) => {
				state.loading = false
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
