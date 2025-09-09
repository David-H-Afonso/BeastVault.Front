import { useState, useEffect, useCallback } from 'react'
import { downloadFileById, downloadPkmFileFromDisk } from '@/services/Pokemon'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import { useViewMode } from '@/hooks/useViewMode'
import { useSpriteType } from '@/hooks/useSpriteType'
import { usePokemon } from '@/hooks/usePokemon'
import { getBestSpriteByType, groupPokemonByTags } from '@/utils'
import HomeComponent from '../components/HomeComponent'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateFilters } from '@/store/features/pokemon'
import NewHomeComponent from '../components/NewHomeComponent'

/**
 * Contenedor principal de la página Home
 * Maneja toda la lógica de negocio, estado y efectos secundarios
 */
const Home = () => {
	// Hooks para configuración de UI
	const { spriteType } = useSpriteType()
	const { viewMode, setViewMode } = useViewMode()

	// Redux state y acciones para Pokémon
	const {
		pokemon,
		sprites: pokeSprites,
		totalPokemon,
		loading,
		error,
		fetchPokemon,
		deletePokemonById,
		updatePokemonTagsById,
		clearCurrentError,
		applyFiltersAndFetch,
	} = usePokemon()

	// Estado local para dialogs de confirmación
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
	const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
	const [pendingDownloadId, setPendingDownloadId] = useState<number | null>(null)
	const [downloadLoading, setDownloadLoading] = useState(false)
	const dispatch = useAppDispatch()

	// Estado para gestión de tags
	const [tagManagerOpen, setTagManagerOpen] = useState(false)
	const [selectedPokemonForTags, setSelectedPokemonForTags] = useState<PokemonListItemDto | null>(
		null
	)
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

	/**
	 * Maneja el cambio de filtros desde el componente PokemonFilters
	 */
	const handleFiltersChange = useCallback(
		(filters: PokemonListFilterDto) => {
			applyFiltersAndFetch(filters)
		},
		[applyFiltersAndFetch]
	)

	/**
	 * Inicia el proceso de descarga de un archivo Pokémon
	 */
	const handleDownload = useCallback((id: number) => {
		setPendingDownloadId(id)
		setDownloadConfirmOpen(true)
	}, [])

	/**
	 * Ejecuta la descarga desde la fuente especificada (backup o database)
	 */
	const handleDownloadSource = useCallback(
		async (source: 'backup' | 'database') => {
			if (pendingDownloadId == null) return

			setDownloadLoading(true)
			clearCurrentError()

			try {
				let result: { blob: Blob; filename: string }
				if (source === 'backup') {
					result = await downloadFileById(pendingDownloadId)
				} else {
					result = await downloadPkmFileFromDisk(pendingDownloadId)
				}

				const { blob, filename } = result
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = filename
				document.body.appendChild(a)
				a.click()

				// Limpieza después de la descarga
				setTimeout(() => {
					window.URL.revokeObjectURL(url)
					document.body.removeChild(a)
				}, 100)
			} catch (e: any) {
				console.error('Download failed:', e.message || 'Failed to download file')
			} finally {
				setDownloadLoading(false)
				setDownloadConfirmOpen(false)
				setPendingDownloadId(null)
			}
		},
		[pendingDownloadId, clearCurrentError]
	)

	/**
	 * Cancela el dialog de descarga
	 */
	const handleCancelDownload = useCallback(() => {
		setDownloadConfirmOpen(false)
		setPendingDownloadId(null)
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
	 * Actualiza los tags de un Pokémon en el store de Redux
	 */
	const handleTagsUpdated = useCallback(
		(pokemonId: number, newTags: TagDto[]) => {
			updatePokemonTagsById(pokemonId, newTags)
		},
		[updatePokemonTagsById]
	)

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
	 * Agrupa los Pokémon por tags para la vista correspondiente
	 */
	const groupedPokemonData = useCallback(() => {
		return groupPokemonByTags(pokemon)
	}, [pokemon])

	// Efecto para cargar la lista inicial de Pokémon
	useEffect(() => {
		fetchPokemon()
	}, [fetchPokemon])

	// Pagination
	const itemsPerPage = useAppSelector((state) => state.pokemon.currentFilters.Take) || 20
	const onItemsPerPageChange = (itemsPerPage: number) => {
		console.log(itemsPerPage)
		dispatch(updateFilters({ Take: itemsPerPage, Skip: 0 }))
	}
	const totalPages = Math.ceil(totalPokemon / itemsPerPage) || 1

	const currentPage = Math.floor(
		(useAppSelector((state) => state.pokemon.currentFilters.Skip) || 0) / itemsPerPage + 1
	)

	const onPageChange = (page: number) => {
		const take = itemsPerPage
		const newSkip = (page - 1) * take
		dispatch(updateFilters({ Skip: newSkip }))
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
			downloadConfirmOpen={downloadConfirmOpen}
			downloadLoading={downloadLoading}
			tagManagerOpen={tagManagerOpen}
			selectedPokemonForTags={selectedPokemonForTags}
			handleFiltersChange={handleFiltersChange}
			handleDownload={handleDownload}
			handleDownloadSource={handleDownloadSource}
			handleCancelDownload={handleCancelDownload}
			handleDelete={handleDelete}
			handleConfirmDelete={handleConfirmDelete}
			handleCancelDelete={handleCancelDelete}
			handleManageTags={handleManageTags}
			handleTagsUpdated={handleTagsUpdated}
			handleTagManagerClose={handleTagManagerClose}
			toggleSectionCollapse={toggleSectionCollapse}
			itemsPerPage={itemsPerPage}
			onItemsPerPageChange={onItemsPerPageChange}
			totalPages={totalPages}
			currentPage={currentPage}
			onPageChange={onPageChange}
		/>
	)

	return <NewHomeComponent loading={loading} processedPokemon={processedPokemonData()} />
}

export default Home
