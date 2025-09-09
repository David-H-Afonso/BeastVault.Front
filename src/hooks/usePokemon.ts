import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks'
import {
	fetchPokemonList,
	deletePokemon,
	importPokemon,
	scanDirectory,
	setFilters,
	updateFilters,
	resetFilters,
	clearError,
	clearCache,
	updatePokemonTags,
	clearImportResult,
	clearAllData,
	selectPokemon,
	selectSprites,
	selectTotalPokemon,
	selectCurrentFilters,
	selectLoading,
	selectError,
	selectImporting,
	selectScanning,
	selectImportResult,
	selectPokeApiCache,
	selectLastFetch,
	selectPokemonById,
	selectSpriteById,
} from '@/store/features/pokemon'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { TagDto } from '@/models/api/types'
import { PokemonCacheManager } from '@/utils'

/**
 * Custom hook for managing Pokemon data through Redux
 * Provides a clean interface for Pokemon-related operations
 */
export const usePokemon = () => {
	const dispatch = useAppDispatch()

	// Selectors
	const pokemon = useAppSelector(selectPokemon)
	const sprites = useAppSelector(selectSprites)
	const totalPokemon = useAppSelector(selectTotalPokemon)
	const currentFilters = useAppSelector(selectCurrentFilters)
	const loading = useAppSelector(selectLoading)
	const error = useAppSelector(selectError)
	const importing = useAppSelector(selectImporting)
	const scanning = useAppSelector(selectScanning)
	const importResult = useAppSelector(selectImportResult)
	const pokeApiCache = useAppSelector(selectPokeApiCache)
	const lastFetch = useAppSelector(selectLastFetch)

	// Actions
	const fetchPokemon = useCallback(
		(filters?: PokemonListFilterDto) => {
			const filterParams = filters || currentFilters
			return dispatch(fetchPokemonList(filterParams))
		},
		[dispatch, currentFilters]
	)

	const deletePokemonById = useCallback(
		(pokemonId: number) => {
			return dispatch(deletePokemon(pokemonId))
		},
		[dispatch]
	)

	const updateCurrentFilters = useCallback(
		(filters: Partial<PokemonListFilterDto>) => {
			dispatch(updateFilters(filters))
		},
		[dispatch]
	)

	const setCurrentFilters = useCallback(
		(filters: PokemonListFilterDto) => {
			dispatch(setFilters(filters))
		},
		[dispatch]
	)

	const resetCurrentFilters = useCallback(() => {
		dispatch(resetFilters())
	}, [dispatch])

	const clearCurrentError = useCallback(() => {
		dispatch(clearError())
	}, [dispatch])

	const clearPokeApiCache = useCallback(() => {
		dispatch(clearCache())
	}, [dispatch])

	const clearAllPokeApiCache = useCallback(async () => {
		// Clear Redux cache
		dispatch(clearCache())
		// Clear Cache Storage
		await PokemonCacheManager.clearOldCacheStorage()
		// Clear legacy localStorage cache
		PokemonCacheManager.clearOldLocalStorageCache()
	}, [dispatch])

	const clearCurrentImportResult = useCallback(() => {
		dispatch(clearImportResult())
	}, [dispatch])

	const importFiles = useCallback(
		(files: File[]) => {
			return dispatch(importPokemon(files))
		},
		[dispatch]
	)

	const scanPokemonDirectory = useCallback(() => {
		return dispatch(scanDirectory())
	}, [dispatch])

	const updatePokemonTagsById = useCallback(
		(pokemonId: number, tags: TagDto[]) => {
			dispatch(updatePokemonTags({ pokemonId, tags }))
		},
		[dispatch]
	)

	const clearAll = useCallback(() => {
		dispatch(clearAllData())
	}, [dispatch])

	// Utility functions
	const getPokemonById = useCallback(
		(pokemonId: number) => {
			return pokemon.find((p) => p.id === pokemonId)
		},
		[pokemon]
	)

	const getSpriteById = useCallback(
		(pokemonId: number) => {
			return sprites[pokemonId]
		},
		[sprites]
	)

	// Refresh data (re-fetch with current filters)
	const refreshPokemon = useCallback(() => {
		return dispatch(fetchPokemonList(currentFilters))
	}, [dispatch, currentFilters])

	// Apply new filters and fetch
	const applyFiltersAndFetch = useCallback(
		(filters: PokemonListFilterDto) => {
			dispatch(setFilters(filters))
			return dispatch(fetchPokemonList(filters))
		},
		[dispatch]
	)

	// Check if data is stale (older than 5 minutes)
	const isDataStale = useCallback(() => {
		if (!lastFetch) return true
		const fiveMinutes = 5 * 60 * 1000
		return Date.now() - lastFetch > fiveMinutes
	}, [lastFetch])

	return {
		// State
		pokemon,
		sprites,
		totalPokemon,
		currentFilters,
		loading,
		error,
		importing,
		scanning,
		importResult,
		pokeApiCache,
		lastFetch,

		// Actions
		fetchPokemon,
		deletePokemonById,
		updateCurrentFilters,
		setCurrentFilters,
		resetCurrentFilters,
		clearCurrentError,
		clearPokeApiCache,
		clearAllPokeApiCache,
		clearCurrentImportResult,
		updatePokemonTagsById,
		clearAll,
		importFiles,
		scanPokemonDirectory,

		// Utilities
		getPokemonById,
		getSpriteById,
		refreshPokemon,
		applyFiltersAndFetch,
		isDataStale,
	}
}

/**
 * Hook to get a specific Pokemon by ID
 */
export const usePokemonById = (pokemonId: number) => {
	return useAppSelector(selectPokemonById(pokemonId))
}

/**
 * Hook to get sprites for a specific Pokemon by ID
 */
export const usePokemonSprites = (pokemonId: number) => {
	return useAppSelector(selectSpriteById(pokemonId))
}
