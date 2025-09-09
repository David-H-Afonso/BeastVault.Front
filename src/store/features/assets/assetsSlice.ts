import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { PokeApiPokemon } from '@/models/Pokeapi'

interface PokemonMemoryData {
	speciesId: number
	form: number
	type1?: string
	type2?: string
	formName?: string
	colors: {
		type1?: string
		type2?: string
	}
	pokeApiData?: PokeApiPokemon
	lastAccessed: number
}

interface AssetMemoryData {
	url: string
	lastAccessed: number
}

interface AssetsState {
	// Pokemon data storage (limited to most recent/frequently accessed)
	pokemon: Record<string, PokemonMemoryData>
	
	// Asset URLs storage (sprites, icons, etc.)
	sprites: Record<string, AssetMemoryData>
	pokeballs: Record<string, AssetMemoryData>
	typeIcons: Record<string, AssetMemoryData>
	
	// Settings
	maxPokemonStorage: number
	maxAssetStorage: number
}

const initialState: AssetsState = {
	pokemon: {},
	sprites: {},
	pokeballs: {},
	typeIcons: {},
	maxPokemonStorage: 50, // Limit Pokemon storage
	maxAssetStorage: 100,  // Limit asset storage
}

// Helper to create Pokemon key
const createPokemonKey = (speciesId: number, form: number = 0) => `${speciesId}_${form}`

// Helper to clean old entries when storage is full
const cleanOldEntries = <T extends { lastAccessed: number }>(
	storage: Record<string, T>, 
	maxEntries: number
): Record<string, T> => {
	const entries = Object.entries(storage)
	if (entries.length <= maxEntries) return storage

	// Sort by lastAccessed (oldest first) and keep only the most recent
	const sorted = entries.sort(([, a], [, b]) => b.lastAccessed - a.lastAccessed)
	const kept = sorted.slice(0, maxEntries)
	
	return Object.fromEntries(kept)
}

const assetsSlice = createSlice({
	name: 'assets',
	initialState,
	reducers: {
		// Pokemon data storage
		storePokemonData: (state, action: PayloadAction<{
			speciesId: number
			form: number
			data: Omit<PokemonMemoryData, 'speciesId' | 'form' | 'lastAccessed'>
		}>) => {
			const { speciesId, form, data } = action.payload
			const key = createPokemonKey(speciesId, form)
			
			state.pokemon[key] = {
				...data,
				speciesId,
				form,
				lastAccessed: Date.now(),
			}
			
			// Clean old entries if storage is full
			state.pokemon = cleanOldEntries(state.pokemon, state.maxPokemonStorage)
		},

		accessPokemonData: (state, action: PayloadAction<{ speciesId: number; form: number }>) => {
			const { speciesId, form } = action.payload
			const key = createPokemonKey(speciesId, form)
			
			if (state.pokemon[key]) {
				// Update last accessed time
				state.pokemon[key].lastAccessed = Date.now()
			}
		},

		// Asset URL storage
		storeSpriteUrl: (state, action: PayloadAction<{ key: string; url: string }>) => {
			const { key, url } = action.payload
			state.sprites[key] = {
				url,
				lastAccessed: Date.now(),
			}
			
			state.sprites = cleanOldEntries(state.sprites, state.maxAssetStorage)
		},

		storePokeballUrl: (state, action: PayloadAction<{ ballName: string; url: string }>) => {
			const { ballName, url } = action.payload
			state.pokeballs[ballName] = {
				url,
				lastAccessed: Date.now(),
			}
			
			state.pokeballs = cleanOldEntries(state.pokeballs, state.maxAssetStorage)
		},

		storeTypeIconUrl: (state, action: PayloadAction<{ typeName: string; url: string }>) => {
			const { typeName, url } = action.payload
			state.typeIcons[typeName] = {
				url,
				lastAccessed: Date.now(),
			}
			
			state.typeIcons = cleanOldEntries(state.typeIcons, state.maxAssetStorage)
		},

		// Maintenance actions
		clearPokemonStorage: (state) => {
			state.pokemon = {}
		},

		clearAssetStorage: (state) => {
			state.sprites = {}
			state.pokeballs = {}
			state.typeIcons = {}
		},

		clearAllStorage: (state) => {
			state.pokemon = {}
			state.sprites = {}
			state.pokeballs = {}
			state.typeIcons = {}
		},

		// Update access time for existing entries
		accessSpriteUrl: (state, action: PayloadAction<string>) => {
			const key = action.payload
			if (state.sprites[key]) {
				state.sprites[key].lastAccessed = Date.now()
			}
		},

		accessPokeballUrl: (state, action: PayloadAction<string>) => {
			const ballName = action.payload
			if (state.pokeballs[ballName]) {
				state.pokeballs[ballName].lastAccessed = Date.now()
			}
		},

		accessTypeIconUrl: (state, action: PayloadAction<string>) => {
			const typeName = action.payload
			if (state.typeIcons[typeName]) {
				state.typeIcons[typeName].lastAccessed = Date.now()
			}
		},
	},
})

export const {
	storePokemonData,
	accessPokemonData,
	storeSpriteUrl,
	storePokeballUrl,
	storeTypeIconUrl,
	clearPokemonStorage,
	clearAssetStorage,
	clearAllStorage,
	accessSpriteUrl,
	accessPokeballUrl,
	accessTypeIconUrl,
} = assetsSlice.actions

export default assetsSlice.reducer

// Selectors
export const selectPokemonData = (state: { assets: AssetsState }, speciesId: number, form: number = 0) => {
	const key = createPokemonKey(speciesId, form)
	return state.assets.pokemon[key]
}

export const selectSpriteUrl = (state: { assets: AssetsState }, key: string) => {
	return state.assets.sprites[key]?.url
}

export const selectPokeballUrl = (state: { assets: AssetsState }, ballName: string) => {
	return state.assets.pokeballs[ballName]?.url
}

export const selectTypeIconUrl = (state: { assets: AssetsState }, typeName: string) => {
	return state.assets.typeIcons[typeName]?.url
}

export const selectStorageStats = (state: { assets: AssetsState }) => ({
	pokemonCount: Object.keys(state.assets.pokemon).length,
	spriteCount: Object.keys(state.assets.sprites).length,
	pokeballCount: Object.keys(state.assets.pokeballs).length,
	typeIconCount: Object.keys(state.assets.typeIcons).length,
})
