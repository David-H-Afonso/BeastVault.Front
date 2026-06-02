// Export services and utilities
export { simpleFetcher } from '../utils/simpleFetcher'

// Re-export PokeAPI functions still in use
export { getPokeBallIcon } from './Pokeapi'

// Export Pokemon service functions
export {
	getPokemonMetadata,
	importPokemonFiles,
	getPokemonById,
	getPokemonList,
	deletePokemonFromDatabase,
	deletePokemonCompletely,
	downloadFileById,
	downloadPkmFileFromDisk,
	downloadPokemonBackupFile,
	downloadPokemonFile,
	downloadPokemonFileFromDisk,
	getPokemonShowdownExport,
	scanPokemonDirectory,
	updatePokemon,
} from './Pokemon'

// Export Box service functions
export * from './Boxes'

// Export TaggedPokemon service functions
export * from './TaggedPokemon'

// Export Tags service functions
export * from './Tags'

// Export Theme service functions
export * from './ThemeService'

// Export Auth service functions
export * from './Auth'
