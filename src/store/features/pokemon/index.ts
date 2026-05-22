// ===================================
// REDUCER
// ===================================
export { default as pokemonReducer } from './pokemonSlice'

// ===================================
// ACTIONS
// ===================================
export {
	setFilters,
	updateFilters,
	resetFilters,
	clearError,
	updatePokemonTags,
	clearImportResult,
	clearAllData,
} from './pokemonSlice'

// ===================================
// THUNKS
// ===================================
export {
	fetchPokemonList,
	fetchPokemonByTagsGrouped,
	deletePokemon,
	importPokemon,
	scanDirectory,
} from './thunks'

// ===================================
// SELECTORS
// ===================================
export {
	selectPokemon,
	selectTotalPokemon,
	selectTagGroups,
	selectCurrentFilters,
	selectLoading,
	selectError,
	selectImporting,
	selectScanning,
	selectImportResult,
	selectLastFetch,
	selectPokemonById,
	selectFilteredPokemon,
	selectPokemonStats,
	selectIsOperationInProgress,
} from './selectors'
