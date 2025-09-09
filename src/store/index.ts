import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { combineReducers } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'
import pokemonReducer from './features/pokemon/pokemonSlice'
import { layoutReducer } from './features/layout'
import styleSettingsReducer from './features/styleSettings/styleSettingsSlice'

/**
 * CENTRALIZED PERSISTENCE CONFIGURATION
 * 
 * This store uses centralized persistence managed at the root level.
 * All individual feature persistence has been removed and consolidated here.
 * 
 * Benefits:
 * - Single point of persistence configuration
 * - Consistent persistence behavior across all features
 * - Easier to manage and debug persistence issues
 * - Better performance (single persistence operation)
 */

// Root persist config - Centralized persistence for the entire store
const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['pokemon', 'styleSettings', 'layout'], // Persist all main features
	// Note: We can add blacklist here for any specific parts we don't want to persist
	// Transform configurations can be added here for complex data transformations
}

// Combine reducers - All using plain reducers, persistence handled at root level
const rootReducer = combineReducers({
	pokemon: pokemonReducer,
	layout: layoutReducer,
	styleSettings: styleSettingsReducer,
})

// Create persisted reducer - Single point of persistence configuration
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore redux-persist actions
				ignoredActions: [
					'persist/FLUSH',
					'persist/REHYDRATE',
					'persist/PAUSE',
					'persist/PERSIST',
					'persist/PURGE',
					'persist/REGISTER',
					// Ignore these action types that contain large non-serializable data
					'pokemon/fetchPokemonList/fulfilled',
					'pokemon/fetchPokemonList/pending',
					'pokemon/importPokemon/fulfilled',
					'pokemon/scanDirectory/fulfilled',
				],
				// Ignore these field paths in all actions
				ignoredActionsPaths: ['payload.cache', 'payload.sprites', 'meta.arg.pokeApiCache'],
				// Ignore these paths in the state for large objects
				ignoredPaths: ['pokemon.pokeApiCache', 'pokemon.sprites'],
				// Increase the warning threshold for development
				warnAfter: 128, // Increase from default 32ms to 128ms
			},
			immutableCheck: {
				// Ignore these paths in the state for immutability checks on large objects
				ignoredPaths: ['pokemon.pokeApiCache', 'pokemon.sprites'],
				warnAfter: 128, // Increase from default 32ms to 128ms
			},
		}),
	// Enable DevTools only in development
	devTools: import.meta.env.DEV,
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppStore = typeof store
