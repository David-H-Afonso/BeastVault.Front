import { useState, useEffect, useCallback } from 'react'
import { downloadPokemonFile } from '@/services/Pokemon'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import { useUISettings } from '@/hooks/useUISettings'
import { usePokemon } from '@/hooks/usePokemon'
import { getBestSpriteByType, groupPokemonByTags } from '@/utils'
import HomeComponent from '../components/HomeComponent'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateFilters } from '@/store/features/pokemon'

/**
 * Contenedor principal de la página Home
 * Maneja toda la lógica de negocio, estado y efectos secundarios
 */
const Home = () => {
	// Hooks para configuración de UI
	const { spriteType, viewMode, setViewMode } = useUISettings()

	// Redux state y acciones para Pokémon
	const {
		pokemon,
		sprites: pokeSprites,
		totalPokemon,
		tagGroups,
		loading,
		error,
		fetchPokemon,
		fetchPokemonByTagsView,
		deletePokemonById,
		updatePokemonTagsById,
		clearCurrentError,
		applyFiltersAndFetch,
	} = usePokemon()

	// Estado local para dialogs de confirmación
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
	const dispatch = useAppDispatch()

	// State para controlar re-fetch automático en grid/list views
	const [shouldRefetchForPagination, setShouldRefetchForPagination] = useState(false)

	// Selectors para filtros de paginación
	const currentFilters = useAppSelector((state) => state.pokemon.currentFilters)
	const { Take: itemsPerPage = 20, Skip = 0 } = currentFilters

	// Estado para gestión de tags
	const [tagManagerOpen, setTagManagerOpen] = useState(false)
	const [selectedPokemonForTags, setSelectedPokemonForTags] = useState<PokemonListItemDto | null>(
		null
	)
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

	const handleFiltersChange = async (filters: PokemonListFilterDto) => {
		if (viewMode === 'tags') {
			const { tagIds, tagNames, anyTagIds, anyTagNames, hasNoTags, ...cleanFilters } = filters
			const currentPage = Math.floor((filters.Skip || 0) / (filters.Take || 20)) + 1
			await fetchPokemonByTagsView(cleanFilters, currentPage, filters.Take)
		} else {
			await applyFiltersAndFetch(filters)
		}
	}

	/**
	 * Inicia el proceso de descarga de un archivo Pokémon
	 */
	const handleDownload = useCallback(async (id: number) => {
		try {
			await downloadPokemonFile(id)
		} catch (error: any) {
			console.error('Download failed:', error.message || 'Failed to download file')
		}
	}, [])

	/**
	 * Inicia el proceso de eliminación de un Pokémon
	 */
	const handleDelete = useCallback((id: number) => {
		setConfirmOpen(true)
		setPendingDeleteId(id)
	}, [])

	/**
	 * Confirma y ejecuta la eliminación del Pokémon
	 */
	const handleConfirmDelete = useCallback(async () => {
		if (pendingDeleteId == null) return

		clearCurrentError()
		try {
			await deletePokemonById(pendingDeleteId)
			// Redux automáticamente actualiza el estado
		} catch (e: any) {
			console.error('Delete failed:', e.message || 'Failed to delete Pokémon')
		} finally {
			setConfirmOpen(false)
			setPendingDeleteId(null)
		}
	}, [pendingDeleteId, deletePokemonById, clearCurrentError])

	/**
	 * Cancela el dialog de eliminación
	 */
	const handleCancelDelete = useCallback(() => {
		setConfirmOpen(false)
		setPendingDeleteId(null)
	}, [])

	/**
	 * Abre el gestor de tags para un Pokémon específico
	 */
	const handleManageTags = useCallback((pokemon: PokemonListItemDto) => {
		setSelectedPokemonForTags(pokemon)
		setTagManagerOpen(true)
	}, [])

	/**
	 * Updates pokemon tags and reloads data based on current view mode
	 */
	const handleTagsUpdated = useCallback(
		(pokemonId: number, newTags: TagDto[]) => {
			// Update the tags in Redux store
			updatePokemonTagsById(pokemonId, newTags)

			// Reload data based on current view mode to reflect tag changes
			if (viewMode === 'tags') {
				// For tags view, refetch to get updated groupings
				fetchPokemonByTagsView()
			} else {
				// For grid/list view, refetch to get updated pokemon data
				fetchPokemon()
			}
		},
		[updatePokemonTagsById, viewMode, fetchPokemonByTagsView, fetchPokemon]
	)

	/**
	 * Handles when tags are created or deleted - reloads data for tags view
	 */
	const handleTagSystemChanged = useCallback(() => {
		if (viewMode === 'tags') {
			// For tags view, refetch to get updated tag groups
			fetchPokemonByTagsView()
		}
		// For grid/list view, no need to reload since tag creation/deletion
		// doesn't affect the pokemon list display
	}, [viewMode, fetchPokemonByTagsView])

	/**
	 * Cierra el gestor de tags
	 */
	const handleTagManagerClose = useCallback(() => {
		setTagManagerOpen(false)
		setSelectedPokemonForTags(null)
	}, [])

	/**
	 * Alterna el estado colapsado de una sección en la vista de tags
	 */
	const toggleSectionCollapse = useCallback((sectionKey: string) => {
		setCollapsedSections((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(sectionKey)) {
				newSet.delete(sectionKey)
			} else {
				newSet.add(sectionKey)
			}
			return newSet
		})
	}, [])

	/**
	 * Procesa los datos de Pokémon para el renderizado
	 * Agrupa sprites con sus respectivos Pokémon y calcula el mejor sprite
	 */
	const processedPokemonData = useCallback(() => {
		return pokemon.map((p) => {
			const sprites = pokeSprites[p.id] || {}
			const bestSprite = getBestSpriteByType(sprites, spriteType, p.isShiny) || undefined
			return {
				pokemon: p,
				sprite: bestSprite,
			}
		})
	}, [pokemon, pokeSprites, spriteType])

	/**
	 * For tags view, use tagGroups from store. For other views, group locally.
	 */
	const groupedPokemonData = useCallback(() => {
		if (viewMode === 'tags' && tagGroups.length > 0) {
			// Use server-grouped data for tags view
			const grouped: { [key: string]: PokemonListItemDto[] } = {}
			let untagged: PokemonListItemDto[] = []

			tagGroups.forEach((group) => {
				if (group.tagName === 'No Tags') {
					untagged = group.pokemon
				} else {
					grouped[group.tagName] = group.pokemon
				}
			})

			return { grouped, untagged }
		} else {
			// Fallback to local grouping for other views
			return groupPokemonByTags(pokemon)
		}
	}, [viewMode, tagGroups, pokemon])

	// Load initial pokemon list - different method based on view mode
	useEffect(() => {
		if (viewMode === 'tags') {
			fetchPokemonByTagsView()
		} else {
			fetchPokemon()
		}
	}, [viewMode]) // Re-fetch when view mode changes

	// Effect para re-fetch automático cuando cambian los filtros de paginación en grid/list views
	useEffect(() => {
		if (shouldRefetchForPagination && viewMode !== 'tags') {
			fetchPokemon()
			setShouldRefetchForPagination(false)
		}
	}, [currentFilters.Take, currentFilters.Skip, shouldRefetchForPagination, viewMode, fetchPokemon])

	// Pagination handlers
	const onItemsPerPageChange = (newItemsPerPage: number) => {
		dispatch(updateFilters({ Take: newItemsPerPage, Skip: 0 }))
		// Re-fetch with new pagination for all view modes
		if (viewMode === 'tags') {
			fetchPokemonByTagsView(undefined, 1, newItemsPerPage)
		} else {
			// For grid/list views, trigger the useEffect above
			setShouldRefetchForPagination(true)
		}
	}
	const totalPages = Math.ceil(totalPokemon / itemsPerPage) || 1
	const currentPage = Math.floor(Skip / itemsPerPage) + 1

	const onPageChange = (page: number) => {
		const take = itemsPerPage
		const newSkip = (page - 1) * take
		dispatch(updateFilters({ Skip: newSkip }))

		// Re-fetch with new page for all view modes
		if (viewMode === 'tags') {
			fetchPokemonByTagsView(undefined, page, take)
		} else {
			// For grid/list views, trigger the useEffect above
			setShouldRefetchForPagination(true)
		}
	}

	return (
		<HomeComponent
			processedPokemon={processedPokemonData()}
			groupedPokemon={groupedPokemonData()}
			totalPokemon={totalPokemon}
			loading={loading}
			error={error}
			viewMode={viewMode}
			setViewMode={setViewMode}
			collapsedSections={collapsedSections}
			confirmOpen={confirmOpen}
			tagManagerOpen={tagManagerOpen}
			selectedPokemonForTags={selectedPokemonForTags}
			handleFiltersChange={handleFiltersChange}
			handleDownload={handleDownload}
			handleDelete={handleDelete}
			handleConfirmDelete={handleConfirmDelete}
			handleCancelDelete={handleCancelDelete}
			handleManageTags={handleManageTags}
			handleTagsUpdated={handleTagsUpdated}
			handleTagManagerClose={handleTagManagerClose}
			handleTagSystemChanged={handleTagSystemChanged}
			toggleSectionCollapse={toggleSectionCollapse}
			itemsPerPage={itemsPerPage}
			onItemsPerPageChange={onItemsPerPageChange}
			totalPages={totalPages}
			currentPage={currentPage}
			onPageChange={onPageChange}
		/>
	)
}

export default Home
