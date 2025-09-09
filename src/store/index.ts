import { configureStore } from '@reduxjs/toolkit'
import styleSettingsReducer from './styleSettingsSlice'
import layoutReducer from './layoutSlice'
import pokemonReducer from './pokemonSlice'

export const store = configureStore({
	reducer: {
		styleSettings: styleSettingsReducer,
		layout: layoutReducer,
		pokemon: pokemonReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore these action types that contain large non-serializable data
				ignoredActions: [
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

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
