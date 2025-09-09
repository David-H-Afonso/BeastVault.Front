import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

// ===================================
// SIMPLE SELECTORS
// ===================================

export const selectPokemon = (state: RootState) => state.pokemon.pokemon
export const selectSprites = (state: RootState) => state.pokemon.sprites
export const selectTotalPokemon = (state: RootState) => state.pokemon.totalPokemon
export const selectCurrentFilters = (state: RootState) => state.pokemon.currentFilters
export const selectLoading = (state: RootState) => state.pokemon.loading
export const selectError = (state: RootState) => state.pokemon.error
export const selectImporting = (state: RootState) => state.pokemon.importing
export const selectScanning = (state: RootState) => state.pokemon.scanning
export const selectImportResult = (state: RootState) => state.pokemon.importResult
export const selectPokeApiCache = (state: RootState) => state.pokemon.pokeApiCache
export const selectLastFetch = (state: RootState) => state.pokemon.lastFetch

// ===================================
// PARAMETERIZED SELECTORS
// ===================================

export const selectPokemonById = (pokemonId: number) => (state: RootState) =>
	state.pokemon.pokemon.find((p) => p.id === pokemonId)

export const selectSpriteById = (pokemonId: number) => (state: RootState) =>
	state.pokemon.sprites[pokemonId]

// ===================================
// MEMOIZED SELECTORS
// ===================================

export const selectFilteredPokemon = createSelector(
	[selectPokemon, selectCurrentFilters],
	(pokemon) => {
		// This could include additional client-side filtering logic if needed
		return pokemon
	}
)

export const selectPokemonStats = createSelector(
	[selectPokemon, selectTotalPokemon],
	(pokemon, totalPokemon) => ({
		loaded: pokemon.length,
		total: totalPokemon,
		hasMore: pokemon.length < totalPokemon,
	})
)

export const selectCacheStats = createSelector(
	[selectPokeApiCache, selectSprites],
	(pokeApiCache, sprites) => ({
		pokeApiCacheSize: Object.keys(pokeApiCache).length,
		spriteCacheSize: Object.keys(sprites).length,
	})
)

export const selectIsOperationInProgress = createSelector(
	[selectLoading, selectImporting, selectScanning],
	(loading, importing, scanning) => loading || importing || scanning
)
