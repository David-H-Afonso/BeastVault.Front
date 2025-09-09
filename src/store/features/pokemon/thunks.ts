import { createAsyncThunk } from '@reduxjs/toolkit'
import type { PokemonListItemDto } from '@/models/api/types'
import type { PokemonListFilterDto, PokemonDetailDto } from '@/models/Pokemon'
import {
	getPokemonListWithSprites,
	deletePokemonFromDatabase,
	importPokemonFiles,
	scanPokemonDirectory,
} from '@/services/Pokemon'
import type { PokemonSprites, PokemonState, ScanResult } from '@/models/store/Pokemon'

// ===================================
// TYPES
// ===================================

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
