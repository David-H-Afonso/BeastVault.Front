import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
	clearPokemonBox,
	clearPokemonBoxSlot,
	createPokemonBox,
	deletePokemonBox,
	getPokemonBox,
	getPokemonBoxes,
	movePokemonToBoxSlot,
	updatePokemonBox,
} from '@/services/Boxes'
import {
	deletePokemonCompletely,
	downloadPokemonBackupFile,
	downloadPokemonFile,
	downloadPokemonFileFromDisk,
	getPokemonById,
	getPokemonShowdownExport,
	updatePokemon,
} from '@/services/Pokemon'
import { createTag, getAllTags } from '@/services/Tags'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type {
	PokemonBoxDetailDto,
	PokemonBoxSummaryDto,
	PokemonListItemDto,
	TagDto,
} from '@/models/api/types'
import { useUISettings } from '@/hooks/useUISettings'
import { usePokemon } from '@/hooks/usePokemon'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import { DetailShell } from '@/components/elements/DetailShell/DetailShell'
import { PokemonDetailPanel } from '@/components/elements/PokemonDetailPanel/PokemonDetailPanel'
import HomeComponent from '../components/HomeComponent'
import { useAppDispatch } from '@/store/hooks'
import { updateFilters } from '@/store/features/pokemon'

const Home = () => {
	const { spriteType, viewMode, setViewMode, browseLayout, setBrowseLayout } = useUISettings()
	const { pokemonId } = useParams<{ pokemonId?: string }>()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()

	const {
		pokemon,
		totalPokemon,
		loading,
		error,
		currentFilters,
		fetchPokemon,
		deletePokemonById,
		updatePokemonTagsById,
		clearCurrentError,
		applyFiltersAndFetch,
	} = usePokemon()

	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
	const [shouldRefetchForPagination, setShouldRefetchForPagination] = useState(false)
	const [availableTags, setAvailableTags] = useState<TagDto[]>([])
	const [tagManagerOpen, setTagManagerOpen] = useState(false)
	const [selectedPokemonForTags, setSelectedPokemonForTags] = useState<PokemonListItemDto | null>(
		null
	)
	const [detailPokemon, setDetailPokemon] = useState<PokemonListItemDto | null>(null)
	const [boxes, setBoxes] = useState<PokemonBoxSummaryDto[]>([])
	const [selectedBox, setSelectedBox] = useState<PokemonBoxDetailDto | null>(null)
	const [activeBoxId, setActiveBoxId] = useState<number | null>(null)
	const [boxLoading, setBoxLoading] = useState(false)

	const { Take: itemsPerPage = 20, Skip = 0 } = currentFilters

	const loadTags = useCallback(async () => {
		try {
			const tags = await getAllTags()
			setAvailableTags(tags)
		} catch (err) {
			console.error('Failed to load tags:', err)
		}
	}, [])

	const refreshBoxes = useCallback(
		async (preferredBoxId?: number | null) => {
			setBoxLoading(true)
			try {
				const summaries = await getPokemonBoxes()
				setBoxes(summaries)

				const targetId =
					preferredBoxId && summaries.some((box) => box.id === preferredBoxId)
						? preferredBoxId
						: activeBoxId && summaries.some((box) => box.id === activeBoxId)
							? activeBoxId
							: summaries[0]?.id

				setActiveBoxId(targetId ?? null)
				if (targetId) {
					const detail = await getPokemonBox(targetId)
					setSelectedBox(detail)
				} else {
					setSelectedBox(null)
				}
			} catch (err) {
				console.error('Failed to load boxes:', err)
			} finally {
				setBoxLoading(false)
			}
		},
		[activeBoxId]
	)

	useEffect(() => {
		fetchPokemon()
		loadTags()
		refreshBoxes()
	}, [])

	useEffect(() => {
		if (pokemonId) {
			const id = Number(pokemonId)
			const found = pokemon.find((p) => p.id === id)
			if (found) {
				setDetailPokemon(found)
				return
			}

			getPokemonById(id)
				.then((detail) => {
					const stub: PokemonListItemDto = {
						id: detail.id,
						speciesId: detail.speciesId,
						speciesName: detail.speciesName,
						nickname: detail.nickname ?? undefined,
						form: detail.form,
						formName: detail.formName ?? undefined,
						level: detail.level,
						isShiny: detail.isShiny,
						favorite: detail.favorite,
						isEgg: detail.isEgg,
						ballId: detail.ballId,
						heldItemId: detail.heldItemId,
						gender: detail.gender,
						tags: [],
						spriteKey: detail.spriteKey ?? '',
						originGeneration: detail.originGeneration,
						capturedGeneration: detail.originGeneration,
						canGigantamax: detail.displayFormName?.toLowerCase().includes('gigantamax') ?? false,
						hasMegaStone: detail.displayFormName?.toLowerCase().includes('mega') ?? false,
						type1: detail.type1,
						type2: detail.type2 ?? undefined,
						ballName: detail.ballName,
						ballSpriteUrl: detail.ballSpriteUrl,
						sprites: {
							default: `/sprites/pokemon/${detail.speciesId}.png`,
							shiny: `/sprites/pokemon/shiny/${detail.speciesId}.png`,
							official: `/sprites/pokemon/artwork/${detail.speciesId}.png`,
							officialShiny: `/sprites/pokemon/artwork/shiny/${detail.speciesId}.png`,
							home: `/sprites/pokemon/home/${detail.speciesId}.png`,
							homeShiny: `/sprites/pokemon/home/shiny/${detail.speciesId}.png`,
							showdown: `/sprites/pokemon/showdown/${detail.speciesId}.gif`,
							showdownShiny: `/sprites/pokemon/showdown/shiny/${detail.speciesId}.gif`,
							github: `/sprites/pokemon/github/${detail.speciesId}.png`,
							githubShiny: `/sprites/pokemon/github/shiny/${detail.speciesId}.png`,
						},
					}
					setDetailPokemon(stub)
				})
				.catch(() => setDetailPokemon(null))
		} else {
			setDetailPokemon(null)
		}
	}, [pokemonId, pokemon])

	useEffect(() => {
		if (shouldRefetchForPagination) {
			fetchPokemon()
			setShouldRefetchForPagination(false)
		}
	}, [currentFilters.Skip, currentFilters.Take, fetchPokemon, shouldRefetchForPagination])

	const refreshCollection = useCallback(async () => {
		await fetchPokemon()
		await loadTags()
		await refreshBoxes(activeBoxId)
	}, [activeBoxId, fetchPokemon, loadTags, refreshBoxes])

	const handlePokemonClick = useCallback(
		(pokemon: PokemonListItemDto) => {
			navigate(`/pokemon/${pokemon.id}`)
		},
		[navigate]
	)

	const handleDetailClose = useCallback(() => {
		setDetailPokemon(null)
		navigate('/', { replace: true })
	}, [navigate])

	const handleFiltersChange = async (filters: PokemonListFilterDto) => {
		await applyFiltersAndFetch(filters)
	}

	const handleDownload = useCallback(async (id: number) => {
		try {
			await downloadPokemonFile(id)
		} catch (err) {
			console.error('Download failed:', err)
		}
	}, [])

	const handleDownloadDisk = useCallback(async (id: number) => {
		try {
			await downloadPokemonFileFromDisk(id)
		} catch (err) {
			console.error('Disk download failed:', err)
		}
	}, [])

	const handleDownloadBackup = useCallback(async (id: number) => {
		try {
			await downloadPokemonBackupFile(id)
		} catch (err) {
			console.error('Backup download failed:', err)
		}
	}, [])

	const handleShowdown = useCallback(async (id: number) => {
		const text = await getPokemonShowdownExport(id)
		try {
			await navigator.clipboard.writeText(text)
		} catch {
			const textarea = document.createElement('textarea')
			textarea.value = text
			textarea.setAttribute('readonly', 'true')
			textarea.style.position = 'fixed'
			textarea.style.left = '-9999px'
			document.body.appendChild(textarea)
			textarea.select()
			const copied = document.execCommand('copy')
			document.body.removeChild(textarea)
			if (!copied) throw new Error('Clipboard copy failed')
		}
	}, [])

	const handleToggleFavorite = useCallback(
		async (pokemonToUpdate: PokemonListItemDto) => {
			const nextFavorite = !pokemonToUpdate.favorite
			await updatePokemon(pokemonToUpdate.id, { favorite: nextFavorite })
			setDetailPokemon((current) =>
				current?.id === pokemonToUpdate.id ? { ...current, favorite: nextFavorite } : current
			)
			await refreshCollection()
		},
		[refreshCollection]
	)

	const handleDelete = useCallback((id: number) => {
		setConfirmOpen(true)
		setPendingDeleteId(id)
	}, [])

	const handleConfirmDelete = useCallback(async () => {
		if (pendingDeleteId == null) return

		clearCurrentError()
		try {
			await deletePokemonById(pendingDeleteId)
			if (detailPokemon?.id === pendingDeleteId) handleDetailClose()
			await refreshCollection()
		} catch (err) {
			console.error('Delete failed:', err)
		} finally {
			setConfirmOpen(false)
			setPendingDeleteId(null)
		}
	}, [
		pendingDeleteId,
		clearCurrentError,
		deletePokemonById,
		detailPokemon?.id,
		handleDetailClose,
		refreshCollection,
	])

	const handlePermanentDelete = useCallback(
		async (id: number) => {
			if (
				!window.confirm('Delete this Pokémon, its stored file, and backup? This cannot be undone.')
			) {
				return
			}
			await deletePokemonCompletely(id)
			if (detailPokemon?.id === id) handleDetailClose()
			await refreshCollection()
		},
		[detailPokemon?.id, handleDetailClose, refreshCollection]
	)

	const handleCancelDelete = useCallback(() => {
		setConfirmOpen(false)
		setPendingDeleteId(null)
	}, [])

	const handleManageTags = useCallback((pokemonToTag: PokemonListItemDto) => {
		setSelectedPokemonForTags(pokemonToTag)
		setTagManagerOpen(true)
	}, [])

	const handleTagsUpdated = useCallback(
		async (targetPokemonId: number, newTags: TagDto[]) => {
			updatePokemonTagsById(targetPokemonId, newTags)
			setDetailPokemon((current) =>
				current?.id === targetPokemonId ? { ...current, tags: newTags } : current
			)
			await loadTags()
			await refreshBoxes(activeBoxId)
		},
		[activeBoxId, loadTags, refreshBoxes, updatePokemonTagsById]
	)

	const handleTagSystemChanged = useCallback(async () => {
		await loadTags()
		await fetchPokemon()
		await refreshBoxes(activeBoxId)
	}, [activeBoxId, fetchPokemon, loadTags, refreshBoxes])

	const handleTagManagerClose = useCallback(() => {
		setTagManagerOpen(false)
		setSelectedPokemonForTags(null)
	}, [])

	const handleCreateTagGroup = useCallback(async () => {
		const name = window.prompt('New tag group name')
		if (!name?.trim()) return

		await createTag({ name: name.trim() })
		await handleTagSystemChanged()
	}, [handleTagSystemChanged])

	const handleSelectBox = useCallback(async (id: number) => {
		setBoxLoading(true)
		try {
			setActiveBoxId(id)
			const detail = await getPokemonBox(id)
			setSelectedBox(detail)
		} finally {
			setBoxLoading(false)
		}
	}, [])

	const handleCreateBox = useCallback(async () => {
		const name = window.prompt('Box name', `Box ${boxes.length + 1}`) || `Box ${boxes.length + 1}`
		const created = await createPokemonBox({ name })
		await refreshBoxes(created.id)
	}, [boxes.length, refreshBoxes])

	const handleDeleteBox = useCallback(
		async (id: number) => {
			if (!window.confirm('Delete this empty box?')) return
			await deletePokemonBox(id)
			await refreshBoxes(null)
		},
		[refreshBoxes]
	)

	const handleMovePokemon = useCallback(
		async (targetPokemonId: number, boxId: number, slotIndex: number) => {
			const detail = await movePokemonToBoxSlot({
				pokemonId: targetPokemonId,
				targetBoxId: boxId,
				targetSlotIndex: slotIndex,
			})
			setSelectedBox(detail)
			setActiveBoxId(boxId)
			const summaries = await getPokemonBoxes()
			setBoxes(summaries)
		},
		[]
	)

	const handleClearSlot = useCallback(
		async (boxId: number, slotIndex: number) => {
			await clearPokemonBoxSlot(boxId, slotIndex)
			await refreshBoxes(boxId)
		},
		[refreshBoxes]
	)

	const handleRenameBox = useCallback(
		async (id: number, name: string) => {
			await updatePokemonBox(id, { name })
			await refreshBoxes(activeBoxId)
		},
		[activeBoxId, refreshBoxes]
	)

	const handleReorderBoxes = useCallback(async (newOrder: PokemonBoxSummaryDto[]) => {
		setBoxes(newOrder)
		await Promise.all(
			newOrder.map((box, index) =>
				box.sortOrder !== index ? updatePokemonBox(box.id, { sortOrder: index }) : Promise.resolve()
			)
		)
		const summaries = await getPokemonBoxes()
		setBoxes(summaries)
	}, [])

	const handleClearBox = useCallback(
		async (id: number) => {
			await clearPokemonBox(id)
			await refreshBoxes(id)
		},
		[refreshBoxes]
	)

	const processedPokemonData = useCallback(() => {
		return pokemon.map((p) => {
			const bestSprite = getPreferredSpriteFromDto(p.sprites, spriteType, p.isShiny) || undefined
			return {
				pokemon: p,
				sprite: bestSprite,
				type1: p.type1,
				type2: p.type2,
			}
		})
	}, [pokemon, spriteType])

	const onItemsPerPageChange = (newItemsPerPage: number) => {
		dispatch(updateFilters({ Take: newItemsPerPage, Skip: 0 }))
		setShouldRefetchForPagination(true)
	}

	const totalPages = Math.ceil(totalPokemon / itemsPerPage) || 1
	const currentPage = Math.floor(Skip / itemsPerPage) + 1

	const onPageChange = (page: number) => {
		const newSkip = (page - 1) * itemsPerPage
		dispatch(updateFilters({ Skip: newSkip }))
		setShouldRefetchForPagination(true)
	}

	const panelContent = detailPokemon ? (
		<PokemonDetailPanel
			pokemon={detailPokemon}
			onDownload={handleDownload}
			onDownloadDisk={handleDownloadDisk}
			onDownloadBackup={handleDownloadBackup}
			onShowdown={handleShowdown}
			onDelete={handleDelete}
			onDeletePermanent={handlePermanentDelete}
			onToggleFavorite={handleToggleFavorite}
			onManageTags={handleManageTags}
		/>
	) : null

	return (
		<DetailShell panel={panelContent} onClosePanel={handleDetailClose}>
			<HomeComponent
				processedPokemon={processedPokemonData()}
				totalPokemon={totalPokemon}
				loading={loading}
				error={error}
				currentFilters={currentFilters}
				availableTags={availableTags}
				viewMode={viewMode}
				setViewMode={setViewMode}
				browseLayout={browseLayout}
				setBrowseLayout={setBrowseLayout}
				boxes={boxes}
				selectedBox={selectedBox}
				activeBoxId={activeBoxId}
				boxLoading={boxLoading}
				onSelectBox={handleSelectBox}
				onCreateBox={handleCreateBox}
				onDeleteBox={handleDeleteBox}
				onMovePokemon={handleMovePokemon}
				onClearSlot={handleClearSlot}
				onRenameBox={handleRenameBox}
				onReorderBoxes={handleReorderBoxes}
				onClearBox={handleClearBox}
				confirmOpen={confirmOpen}
				tagManagerOpen={tagManagerOpen}
				selectedPokemonForTags={selectedPokemonForTags}
				handleFiltersChange={handleFiltersChange}
				handleDownload={handleDownload}
				handleConfirmDelete={handleConfirmDelete}
				handleCancelDelete={handleCancelDelete}
				handleManageTags={handleManageTags}
				handleTagsUpdated={handleTagsUpdated}
				handleTagManagerClose={handleTagManagerClose}
				handleTagSystemChanged={handleTagSystemChanged}
				handleCreateTagGroup={handleCreateTagGroup}
				itemsPerPage={itemsPerPage}
				onItemsPerPageChange={onItemsPerPageChange}
				totalPages={totalPages}
				currentPage={currentPage}
				onPageChange={onPageChange}
				onPokemonClick={handlePokemonClick}
			/>
		</DetailShell>
	)
}

export default Home
