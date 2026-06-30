import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import type {
	PokemonBoxDetailDto,
	PokemonBoxSummaryDto,
	PokemonListItemDto,
	TagDto,
	BulkTagResult,
} from '@/models/api/types'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { PokemonBall } from '@/models/Pokemon'
import { SortBy, SortDirection } from '@/models/Pokemon'
import type { BrowseLayout, ViewMode } from '@/models/store/StylesSetting'
import { ConfirmDialog } from '@/ConfirmDialog'
import { Pagination } from '@/components/elements'
import { TagManager } from '@/components/elements/TagManager/TagManager'
import { getComputedTypeColor } from '@/utils/typeColors'
import { environment } from '@/environments'
import { BoxView } from './views/BoxView'
import './HomeComponent.scss'

interface ProcessedPokemon {
	pokemon: PokemonListItemDto
	sprite: string | undefined
	type1?: string
	type2?: string
}

interface HomeComponentProps {
	processedPokemon: ProcessedPokemon[]
	totalPokemon: number
	loading: boolean
	error: string | null
	currentFilters: PokemonListFilterDto
	availableTags: TagDto[]
	pokeballs: PokemonBall[]
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	browseLayout: BrowseLayout
	setBrowseLayout: (layout: BrowseLayout) => void
	boxes: PokemonBoxSummaryDto[]
	selectedBox: PokemonBoxDetailDto | null
	activeBoxId: number | null
	boxLoading: boolean
	onSelectBox: (id: number) => void
	onCreateBox: () => void
	onDeleteBox: (id: number) => void
	onMovePokemon: (pokemonId: number, boxId: number, slotIndex: number) => Promise<void>
	onClearSlot: (boxId: number, slotIndex: number) => Promise<void>
	onRenameBox: (id: number, name: string) => Promise<void>
	onReorderBoxes: (newOrder: PokemonBoxSummaryDto[]) => Promise<void>
	onClearBox: (id: number) => Promise<void>
	confirmOpen: boolean
	tagManagerOpen: boolean
	selectedPokemonForTags: PokemonListItemDto | null
	handleFiltersChange: (filters: PokemonListFilterDto) => void
	handleDownload: (id: number) => void
	handleConfirmDelete: () => Promise<void>
	handleCancelDelete: () => void
	handleManageTags: (pokemon: PokemonListItemDto) => void
	handleTagsUpdated: (pokemonId: number, newTags: TagDto[]) => void
	handleTagManagerClose: () => void
	handleTagSystemChanged: () => void
	handleCreateTagGroup: () => void
	itemsPerPage: number
	onItemsPerPageChange: (itemsPerPage: number) => void
	totalPages: number
	currentPage: number
	onPageChange: (page: number) => void
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onBulkTagUpdate: (
		pokemonIds: number[],
		action: 'add' | 'remove' | 'replace',
		tagIds: number[]
	) => Promise<BulkTagResult>
}

type SortPreset = 'smart' | 'species' | 'level' | 'recent' | 'favorites'

function resolveTagImg(imagePath: string | null | undefined): string | null {
	if (!imagePath) return null
	if (/^(https?:|data:|blob:)/i.test(imagePath)) return imagePath
	const normalized = imagePath.replace(/\\/g, '/').replace(/^wwwroot\//i, '/')
	return normalized.startsWith('/')
		? `${environment.baseUrl}${normalized}`
		: `${environment.baseUrl}/${normalized}`
}

const buildTagStyle = (tag: TagDto): React.CSSProperties => ({
	borderColor: tag.colorHex || 'rgba(250, 204, 21, 0.45)',
	backgroundColor: tag.colorHex ? `${tag.colorHex}22` : 'rgba(250, 204, 21, 0.1)',
	color: tag.colorHex || 'var(--tag-chip-text, #f9d84a)',
})

function TypeBadge({ type }: { type?: string }) {
	if (!type) return null
	return (
		<span
			className='browse-shell__type'
			style={{ '--chip-color': getComputedTypeColor(type) } as React.CSSProperties}>
			{type}
		</span>
	)
}

function PokemonTable({
	items,
	loading,
	onPokemonClick,
	onManageTags,
	onDownload,
	selectionMode,
	selectedIds,
	onToggleSelect,
	onEnterSelectionMode,
}: {
	items: ProcessedPokemon[]
	loading: boolean
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	onDownload: (id: number) => void
	selectionMode: boolean
	selectedIds: Set<number>
	onToggleSelect: (id: number) => void
	onEnterSelectionMode: () => void
}) {
	if (items.length === 0 && !loading) {
		return <p className='browse-shell__empty'>No Pokémon match the current filters.</p>
	}

	const handleCheckboxChange = (id: number) => {
		if (!selectionMode) onEnterSelectionMode()
		onToggleSelect(id)
	}

	return (
		<div className={`browse-table browse-table--has-checkbox`}>
			<div className='browse-table__head'>
				<span />
				<span>Pokémon</span>
				<span>Types</span>
				<span>Tags</span>
				<span>Origin</span>
				<span>Actions</span>
			</div>
			{items.map(({ pokemon, sprite, type1, type2 }) => (
				<div
					key={pokemon.id}
					className={`browse-table__row${selectedIds.has(pokemon.id) ? ' browse-table__row--selected' : ''}`}>
					<label
						className={`browse-shell__checkbox${selectionMode ? ' browse-shell__checkbox--visible' : ''}`}>
						<input
							type='checkbox'
							checked={selectedIds.has(pokemon.id)}
							onChange={() => handleCheckboxChange(pokemon.id)}
						/>
					</label>
					<button
						type='button'
						className='browse-table__identity'
						onClick={() =>
							selectionMode ? onToggleSelect(pokemon.id) : onPokemonClick?.(pokemon)
						}>
						{sprite ? (
							<img src={sprite} alt={pokemon.nickname || pokemon.speciesName} />
						) : (
							<span className='browse-shell__sprite-fallback'>?</span>
						)}
						<span>
							<strong>{pokemon.nickname || pokemon.speciesName}</strong>
							<small>#{String(pokemon.speciesId).padStart(3, '0')}</small>
						</span>
					</button>
					<div className='browse-shell__types'>
						<TypeBadge type={type1} />
						<TypeBadge type={type2} />
					</div>
					<div className='hub-card__tag-dots'>
						{pokemon.tags?.slice(0, 6).map((tag) => {
							const imgUrl = resolveTagImg(tag.imagePath)
							return (
								<span
									key={tag.id}
									className='hub-card__tag-dot'
									style={{ '--tag-color': tag.colorHex || '#facc15' } as React.CSSProperties}
									title={tag.name}>
									{imgUrl && <img src={imgUrl} alt={tag.name} />}
								</span>
							)
						})}
					</div>
					<div className='browse-table__origin'>
						Gen {pokemon.originGeneration} / Gen {pokemon.capturedGeneration}
					</div>
					<div className='browse-table__actions'>
						<button type='button' disabled={selectionMode} onClick={() => onManageTags(pokemon)}>
							Tags
						</button>
						<button type='button' disabled={selectionMode} onClick={() => onDownload(pokemon.id)}>
							Download
						</button>
					</div>
				</div>
			))}
		</div>
	)
}

function PokemonHubGrid({
	items,
	loading,
	onPokemonClick,
	onManageTags,
	selectionMode,
	selectedIds,
	onToggleSelect,
	onEnterSelectionMode,
}: {
	items: ProcessedPokemon[]
	loading: boolean
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	selectionMode: boolean
	selectedIds: Set<number>
	onToggleSelect: (id: number) => void
	onEnterSelectionMode: () => void
}) {
	if (items.length === 0 && !loading) {
		return <p className='browse-shell__empty'>No Pokémon match the current filters.</p>
	}

	const handleCheckboxChange = (id: number) => {
		if (!selectionMode) onEnterSelectionMode()
		onToggleSelect(id)
	}

	return (
		<div className='hub-grid'>
			{items.map(({ pokemon, sprite, type1, type2 }) => (
				<article
					key={pokemon.id}
					className={`hub-card${selectedIds.has(pokemon.id) ? ' hub-card--selected' : ''}`}>
					<label
						className={`hub-card__select-check${selectionMode ? ' hub-card__select-check--visible' : ''}`}>
						<input
							type='checkbox'
							checked={selectedIds.has(pokemon.id)}
							onChange={() => handleCheckboxChange(pokemon.id)}
						/>
					</label>
					<button
						type='button'
						className='hub-card__open'
						onClick={() =>
							selectionMode ? onToggleSelect(pokemon.id) : onPokemonClick?.(pokemon)
						}>
						<div className='hub-card__badges'>
							<span>Lv.{pokemon.level}</span>
							<span>#{String(pokemon.speciesId).padStart(3, '0')}</span>
						</div>
						<div className='hub-card__sprite'>
							{sprite ? (
								<img src={sprite} alt={pokemon.nickname || pokemon.speciesName} />
							) : (
								<span className='browse-shell__sprite-fallback'>?</span>
							)}
						</div>
						<div className='hub-card__meta'>
							<h3>{pokemon.nickname || pokemon.speciesName}</h3>
							{pokemon.nickname && pokemon.nickname !== pokemon.speciesName && (
								<p>{pokemon.speciesName}</p>
							)}
							<div className='browse-shell__types'>
								<TypeBadge type={type1} />
								<TypeBadge type={type2} />
							</div>
						</div>
						{pokemon.tags && pokemon.tags.length > 0 && (
							<div className='hub-card__tag-dots'>
								{pokemon.tags.slice(0, 6).map((tag) => {
									const imgUrl = resolveTagImg(tag.imagePath)
									return (
										<span
											key={tag.id}
											className='hub-card__tag-dot'
											style={
												{ '--tag-color': tag.colorHex || 'var(--accent-teal)' } as React.CSSProperties
											}
											title={tag.name}>
											{imgUrl && <img src={imgUrl} alt={tag.name} />}
										</span>
									)
								})}
							</div>
						)}
					</button>
					<button
						type='button'
						className='hub-card__tags'
						disabled={selectionMode}
						onClick={() => onManageTags(pokemon)}>
						<svg
							width='13'
							height='13'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							aria-hidden='true'>
							<path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
							<line x1='7' y1='7' x2='7.01' y2='7' />
						</svg>
						Tags
					</button>
				</article>
			))}
		</div>
	)
}

function BulkTagSelector({
	tags,
	loading,
	onSubmit,
	onCancel,
	actionLabel,
}: {
	tags: TagDto[]
	loading: boolean
	onSubmit: (tagIds: number[]) => void
	onCancel: () => void
	actionLabel: string
}) {
	const [selected, setSelected] = useState<Set<number>>(new Set())

	const toggle = (id: number) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	return (
		<div className='bulk-tag-selector'>
			<div className='bulk-tag-selector__list'>
				{tags.map((tag) => (
					<button
						key={tag.id}
						type='button'
						className={`bulk-tag-selector__chip${selected.has(tag.id) ? ' bulk-tag-selector__chip--active' : ''}`}
						style={buildTagStyle(tag)}
						onClick={() => toggle(tag.id)}>
						{tag.name}
					</button>
				))}
				{tags.length === 0 && (
					<p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tags available</p>
				)}
			</div>
			<div className='bulk-tag-selector__actions'>
				<button
					type='button'
					className='action-btn'
					disabled={selected.size === 0 || loading}
					onClick={() => onSubmit(Array.from(selected))}>
					{loading
						? 'Working…'
						: `${actionLabel} ${selected.size} tag${selected.size !== 1 ? 's' : ''}`}
				</button>
				<button type='button' className='action-btn' onClick={onCancel}>
					Cancel
				</button>
			</div>
		</div>
	)
}

const HomeComponent = ({
	processedPokemon,
	totalPokemon,
	loading,
	error,
	currentFilters,
	availableTags,
	pokeballs,
	viewMode,
	setViewMode,
	browseLayout,
	setBrowseLayout,
	boxes,
	selectedBox,
	activeBoxId,
	boxLoading,
	onSelectBox,
	onCreateBox,
	onDeleteBox,
	onMovePokemon,
	onClearSlot,
	onRenameBox,
	onReorderBoxes,
	onClearBox,
	confirmOpen,
	tagManagerOpen,
	selectedPokemonForTags,
	handleFiltersChange,
	handleDownload,
	handleConfirmDelete,
	handleCancelDelete,
	handleManageTags,
	handleTagsUpdated,
	handleTagManagerClose,
	handleTagSystemChanged,
	handleCreateTagGroup,
	itemsPerPage,
	onItemsPerPageChange,
	totalPages,
	currentPage,
	onPageChange,
	onPokemonClick,
	onBulkTagUpdate,
}: HomeComponentProps) => {
	const [search, setSearch] = useState(currentFilters.Search || '')
	const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set())
	const [excludedTagIds, setExcludedTagIds] = useState<Set<string>>(new Set())
	const [noTagsFilter, setNoTagsFilter] = useState(false)
	const [generation, setGeneration] = useState<string>('all')
	const [sortPreset, setSortPreset] = useState<SortPreset>('smart')
	const [shinyFilter, setShinyFilter] = useState<'all' | 'shiny' | 'regular'>('all')
	const [pokeballId, setPokeballId] = useState<string>('all')
	const [isFilterDockOpen, setFilterDockOpen] = useState(false)

	// Bulk selection state
	const [selectionMode, setSelectionMode] = useState(false)
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [bulkAction, setBulkAction] = useState<'add' | 'remove' | 'replace' | null>(null)
	const [bulkTagLoading, setBulkTagLoading] = useState(false)
	const [bulkError, setBulkError] = useState<string | null>(null)

	const toggleSelect = useCallback((id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}, [])

	const selectAllVisible = useCallback(() => {
		setSelectedIds(new Set(processedPokemon.map(({ pokemon }) => pokemon.id)))
	}, [processedPokemon])

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set())
	}, [])

	const exitSelectionMode = useCallback(() => {
		setSelectionMode(false)
		setSelectedIds(new Set())
		setBulkAction(null)
		setBulkError(null)
	}, [])

	const visiblePokemonIds = useMemo(
		() => new Set(processedPokemon.map(({ pokemon }) => pokemon.id)),
		[processedPokemon]
	)

	useEffect(() => {
		setSelectedIds((prev) => {
			const next = new Set([...prev].filter((id) => visiblePokemonIds.has(id)))
			return next.size === prev.size ? prev : next
		})
	}, [visiblePokemonIds])

	const handleBulkSubmit = useCallback(
		async (tagIds: number[]) => {
			if (!bulkAction || selectedIds.size === 0 || tagIds.length === 0) return
			setBulkTagLoading(true)
			setBulkError(null)
			try {
				await onBulkTagUpdate(Array.from(selectedIds), bulkAction, tagIds)
				exitSelectionMode()
			} catch {
				setBulkError('Could not update tags. Try again.')
			} finally {
				setBulkTagLoading(false)
			}
		},
		[bulkAction, exitSelectionMode, onBulkTagUpdate, selectedIds]
	)

	const applyFilters = (
		overrides: Partial<{
			search: string
			activeTagIds: Set<string>
			excludedTagIds: Set<string>
			noTagsFilter: boolean
			generation: string
			sortPreset: SortPreset
			shinyFilter: 'all' | 'shiny' | 'regular'
			pokeballId: string
		}> = {}
	) => {
		const nextSearch = overrides.search ?? search
		const nextActiveTagIds = overrides.activeTagIds ?? activeTagIds
		const nextExcludedTagIds = overrides.excludedTagIds ?? excludedTagIds
		const nextNoTagsFilter = overrides.noTagsFilter ?? noTagsFilter
		const nextGeneration = overrides.generation ?? generation
		const nextSortPreset = overrides.sortPreset ?? sortPreset
		const nextShinyFilter = overrides.shinyFilter ?? shinyFilter
		const nextPokeballId = overrides.pokeballId ?? pokeballId

		const filters: PokemonListFilterDto = {
			...currentFilters,
			Search: nextSearch.trim() || undefined,
			OriginGeneration: nextGeneration === 'all' ? undefined : Number.parseInt(nextGeneration, 10),
			IsShiny:
				nextShinyFilter === 'shiny' ? true : nextShinyFilter === 'regular' ? false : undefined,
			PokeballId: nextPokeballId === 'all' ? undefined : Number.parseInt(nextPokeballId, 10),
			Skip: 0,
			Take: currentFilters.Take || itemsPerPage,
			tagIds: undefined,
			anyTagIds: undefined,
			excludedTagIds: undefined,
			hasNoTags: undefined,
		}

		if (nextNoTagsFilter) {
			filters.hasNoTags = true
		} else {
			if (nextActiveTagIds.size > 0) {
				filters.tagIds = Array.from(nextActiveTagIds).map((id) => Number.parseInt(id, 10))
			}
			if (nextExcludedTagIds.size > 0) {
				filters.excludedTagIds = Array.from(nextExcludedTagIds).map((id) => Number.parseInt(id, 10))
			}
		}

		switch (nextSortPreset) {
			case 'species':
				filters.SortBy = SortBy.PokedexNumber
				filters.SortDirection = SortDirection.Ascending
				filters.ThenSortBy = SortBy.Form
				filters.ThenSortDirection = SortDirection.Ascending
				break
			case 'level':
				filters.SortBy = SortBy.Level
				filters.SortDirection = SortDirection.Descending
				filters.ThenSortBy = SortBy.PokedexNumber
				filters.ThenSortDirection = SortDirection.Ascending
				break
			case 'recent':
				filters.SortBy = SortBy.Id
				filters.SortDirection = SortDirection.Descending
				break
			case 'favorites':
				filters.SortBy = SortBy.Favorite
				filters.SortDirection = SortDirection.Descending
				filters.ThenSortBy = SortBy.PokedexNumber
				filters.ThenSortDirection = SortDirection.Ascending
				break
			default:
				filters.SortBy = SortBy.Favorite
				filters.SortDirection = SortDirection.Descending
				filters.ThenSortBy = SortBy.PokedexNumber
				filters.ThenSortDirection = SortDirection.Ascending
				break
		}

		handleFiltersChange(filters)
	}

	const handleTagClick = (tagId: string) => {
		let nextActive = new Set(activeTagIds)
		let nextExcluded = new Set(excludedTagIds)
		if (noTagsFilter) {
			nextActive = new Set([tagId])
			nextExcluded = new Set()
		} else if (activeTagIds.has(tagId)) {
			nextActive.delete(tagId)
			nextExcluded.add(tagId)
		} else if (excludedTagIds.has(tagId)) {
			nextExcluded.delete(tagId)
		} else {
			nextActive.add(tagId)
		}
		setActiveTagIds(nextActive)
		setExcludedTagIds(nextExcluded)
		setNoTagsFilter(false)
		applyFilters({ activeTagIds: nextActive, excludedTagIds: nextExcluded, noTagsFilter: false })
	}

	// Filters popover open/close accessibility (outside click + Escape)
	const filterPopRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!isFilterDockOpen) return
		const onPointer = (event: MouseEvent) => {
			if (filterPopRef.current && !filterPopRef.current.contains(event.target as Node)) {
				setFilterDockOpen(false)
			}
		}
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setFilterDockOpen(false)
		}
		document.addEventListener('mousedown', onPointer)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onPointer)
			document.removeEventListener('keydown', onKey)
		}
	}, [isFilterDockOpen])

	const filtersAreActive =
		shinyFilter !== 'all' ||
		pokeballId !== 'all' ||
		generation !== 'all' ||
		noTagsFilter ||
		activeTagIds.size > 0 ||
		excludedTagIds.size > 0

	const clearAllFilters = () => {
		setSearch('')
		setActiveTagIds(new Set())
		setExcludedTagIds(new Set())
		setNoTagsFilter(false)
		setGeneration('all')
		setShinyFilter('all')
		setPokeballId('all')
		applyFilters({
			search: '',
			activeTagIds: new Set(),
			excludedTagIds: new Set(),
			noTagsFilter: false,
			generation: 'all',
			shinyFilter: 'all',
			pokeballId: 'all',
		})
	}

	const renderFilterDock = () => {
		if (viewMode === 'boxes') return null

		const selectedBall = pokeballs.find((ball) => String(ball.id) === pokeballId)

		const activeChips: {
			key: string
			label: string
			tone?: 'exclude'
			onRemove: () => void
		}[] = []
		if (shinyFilter !== 'all') {
			activeChips.push({
				key: 'shiny',
				label: shinyFilter === 'shiny' ? 'Shiny only' : 'Non-shiny',
				onRemove: () => {
					setShinyFilter('all')
					applyFilters({ shinyFilter: 'all' })
				},
			})
		}
		if (pokeballId !== 'all' && selectedBall) {
			activeChips.push({
				key: 'ball',
				label: selectedBall.name,
				onRemove: () => {
					setPokeballId('all')
					applyFilters({ pokeballId: 'all' })
				},
			})
		}
		if (generation !== 'all') {
			activeChips.push({
				key: 'gen',
				label: `Gen ${generation}`,
				onRemove: () => {
					setGeneration('all')
					applyFilters({ generation: 'all' })
				},
			})
		}
		if (noTagsFilter) {
			activeChips.push({
				key: 'no-tags',
				label: 'No tags',
				onRemove: () => {
					setNoTagsFilter(false)
					applyFilters({ noTagsFilter: false })
				},
			})
		}
		for (const id of activeTagIds) {
			const tag = availableTags.find((t) => String(t.id) === id)
			activeChips.push({
				key: `tag-${id}`,
				label: tag?.name ?? `Tag ${id}`,
				onRemove: () => {
					const next = new Set(activeTagIds)
					next.delete(id)
					setActiveTagIds(next)
					applyFilters({ activeTagIds: next })
				},
			})
		}
		for (const id of excludedTagIds) {
			const tag = availableTags.find((t) => String(t.id) === id)
			activeChips.push({
				key: `exclude-${id}`,
				label: tag?.name ?? `Tag ${id}`,
				tone: 'exclude',
				onRemove: () => {
					const next = new Set(excludedTagIds)
					next.delete(id)
					setExcludedTagIds(next)
					applyFilters({ excludedTagIds: next })
				},
			})
		}

		return (
			<section className='browse-shell__filter-dock browse-shell__filter-dock--home'>
				<div className='browse-shell__command-bar'>
					<div className='browse-shell__search'>
						<svg className='browse-shell__search-icon' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
							<circle cx='11' cy='11' r='8' />
							<line x1='21' y1='21' x2='16.65' y2='16.65' />
						</svg>
						<input
							className='browse-shell__search-input'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') applyFilters({ search: event.currentTarget.value })
							}}
							placeholder='Search species, nickname, OT, move, item, tag…'
							aria-label='Search Pokémon'
						/>
						{search && (
							<button
								type='button'
								className='browse-shell__search-clear'
								aria-label='Clear search'
								onClick={() => {
									setSearch('')
									applyFilters({ search: '' })
								}}>
								<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
									<line x1='18' y1='6' x2='6' y2='18' />
									<line x1='6' y1='6' x2='18' y2='18' />
								</svg>
							</button>
						)}
					</div>

					<select
						className='browse-shell__sort-select'
						value={sortPreset}
						onChange={(event) => {
							const value = event.target.value as SortPreset
							setSortPreset(value)
							applyFilters({ sortPreset: value })
						}}
						aria-label='Sort Pokémon'>
						<option value='smart'>Smart sort</option>
						<option value='species'>Pokédex number</option>
						<option value='level'>Level</option>
						<option value='recent'>Recent</option>
						<option value='favorites'>Favorites</option>
					</select>

					<div className='browse-shell__filter-pop' ref={filterPopRef}>
						<button
							type='button'
							className={`browse-shell__filter-toggle${filtersAreActive ? ' is-active' : ''}`}
							aria-haspopup='dialog'
							aria-expanded={isFilterDockOpen}
							onClick={() => setFilterDockOpen((open) => !open)}>
							<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' />
							</svg>
							<span>Filters</span>
							{activeChips.length > 0 && (
								<span className='browse-shell__filter-count'>{activeChips.length}</span>
							)}
						</button>
						{isFilterDockOpen && (
							<div className='browse-shell__filter-popover' role='dialog' aria-label='Filters'>
								<div className='filter-pop__group'>
									<span className='filter-pop__label'>Generation</span>
									<div className='filter-pop__seg' role='group' aria-label='Generation'>
										<button
											type='button'
											className={generation === 'all' ? 'is-active' : ''}
											onClick={() => {
												setGeneration('all')
												applyFilters({ generation: 'all' })
											}}>
											All
										</button>
										{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
											<button
												key={gen}
												type='button'
												className={generation === String(gen) ? 'is-active' : ''}
												onClick={() => {
													setGeneration(String(gen))
													applyFilters({ generation: String(gen) })
												}}>
												{gen}
											</button>
										))}
									</div>
								</div>

								<div className='filter-pop__group'>
									<span className='filter-pop__label'>Shiny</span>
									<div className='filter-pop__seg' role='group' aria-label='Shiny'>
										{(
											[
												['all', 'All'],
												['shiny', 'Shiny'],
												['regular', 'Non-shiny'],
											] as const
										).map(([value, label]) => (
											<button
												key={value}
												type='button'
												className={shinyFilter === value ? 'is-active' : ''}
												onClick={() => {
													setShinyFilter(value)
													applyFilters({ shinyFilter: value })
												}}>
												{label}
											</button>
										))}
									</div>
								</div>

								{pokeballs.length > 0 && (
									<div className='filter-pop__group'>
										<span className='filter-pop__label'>Poké Ball</span>
										<select
											className='filter-pop__select'
											value={pokeballId}
											onChange={(event) => {
												setPokeballId(event.target.value)
												applyFilters({ pokeballId: event.target.value })
											}}>
											<option value='all'>All balls</option>
											{pokeballs.map((ball) => (
												<option key={ball.id} value={ball.id}>
													{ball.name}
												</option>
											))}
										</select>
									</div>
								)}

								{availableTags.length > 0 && (
									<div className='filter-pop__group'>
										<span className='filter-pop__label'>
											Tags <small>click: include → exclude → off</small>
										</span>
										<div className='filter-pop__tags'>
											<button
												type='button'
												className={`filter-pop__tag${noTagsFilter ? ' is-include' : ''}`}
												onClick={() => {
													const next = !noTagsFilter
													setNoTagsFilter(next)
													if (next) {
														setActiveTagIds(new Set())
														setExcludedTagIds(new Set())
													}
													applyFilters({
														noTagsFilter: next,
														activeTagIds: new Set(),
														excludedTagIds: new Set(),
													})
												}}>
												No tags
											</button>
											{availableTags.map((tag) => {
												const state = activeTagIds.has(String(tag.id))
													? 'include'
													: excludedTagIds.has(String(tag.id))
														? 'exclude'
														: ''
												return (
													<button
														key={tag.id}
														type='button'
														className={`filter-pop__tag${state ? ` is-${state}` : ''}`}
														onClick={() => handleTagClick(String(tag.id))}>
														{tag.name}
													</button>
												)
											})}
										</div>
									</div>
								)}

								<div className='filter-pop__footer'>
									<button
										type='button'
										className='filter-pop__clear'
										onClick={clearAllFilters}
										disabled={!filtersAreActive}>
										Clear all
									</button>
									<button
										type='button'
										className='filter-pop__done'
										onClick={() => setFilterDockOpen(false)}>
										Done
									</button>
								</div>
							</div>
						)}
					</div>

					<button
						type='button'
						className={`browse-shell__select-toggle${selectionMode ? ' is-active' : ''}`}
						onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
						aria-pressed={selectionMode}
						title={selectionMode ? 'Cancel selection' : 'Select Pokémon'}>
						<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
							{selectionMode ? (
								<path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
							) : (
								<path d='M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z' />
							)}
						</svg>
					</button>
				</div>

				<div className='browse-shell__active-bar'>
					<span className='browse-shell__active-bar__count'>{totalPokemon} Pokémon</span>
					{activeChips.map((chip) => (
						<button
							key={chip.key}
							type='button'
							className={`browse-shell__active-chip${chip.tone === 'exclude' ? ' is-exclude' : ''}`}
							onClick={chip.onRemove}
							aria-label={`Remove filter ${chip.label}`}>
							<span className='browse-shell__active-chip__label'>
								{chip.tone === 'exclude' ? `Not: ${chip.label}` : chip.label}
							</span>
							<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' aria-hidden='true'>
								<line x1='18' y1='6' x2='6' y2='18' />
								<line x1='6' y1='6' x2='18' y2='18' />
							</svg>
						</button>
					))}
					{filtersAreActive && (
						<button type='button' className='browse-shell__clear-all' onClick={clearAllFilters}>
							Clear all
						</button>
					)}
				</div>

				{selectionMode && (
					<div className='bulk-action-bar'>
						<span className='bulk-action-bar__count'>{selectedIds.size} selected</span>
						<button type='button' onClick={selectAllVisible} className='bulk-action-bar__btn'>
							Select all
						</button>
						<button
							type='button'
							onClick={clearSelection}
							className='bulk-action-bar__btn'
							disabled={selectedIds.size === 0}>
							Clear
						</button>
						<button
							type='button'
							onClick={() => setBulkAction('add')}
							className='bulk-action-bar__btn bulk-action-bar__btn--primary'
							disabled={selectedIds.size === 0}>
							Add tags
						</button>
						<button
							type='button'
							onClick={() => setBulkAction('remove')}
							className='bulk-action-bar__btn'
							disabled={selectedIds.size === 0}>
							Remove tags
						</button>
						<button
							type='button'
							onClick={() => setBulkAction('replace')}
							className='bulk-action-bar__btn bulk-action-bar__btn--danger'
							disabled={selectedIds.size === 0}>
							Replace tags
						</button>
						<button
							type='button'
							onClick={() => {
								for (const id of selectedIds) handleDownload(id)
							}}
							className='bulk-action-bar__btn'
							disabled={selectedIds.size === 0}>
							Download
						</button>
						<button type='button' onClick={exitSelectionMode} className='bulk-action-bar__btn'>
							Cancel
						</button>
					</div>
				)}
			</section>
		)
	}

	const renderSidebar = () => (
		<aside className='browse-shell__sidebar'>
			<button
				type='button'
				className={`browse-shell__tag-group ${activeTagIds.size === 0 && !noTagsFilter ? 'browse-shell__tag-group--active' : ''}`}
				onClick={() => {
					setActiveTagIds(new Set())
					setExcludedTagIds(new Set())
					setNoTagsFilter(false)
					applyFilters({ activeTagIds: new Set(), excludedTagIds: new Set(), noTagsFilter: false })
				}}>
				<span>All Pokémon</span>
				<strong>{totalPokemon}</strong>
			</button>
			{availableTags.map((tag) => (
				<button
					type='button'
					key={tag.id}
					className={`browse-shell__tag-group ${
						activeTagIds.size === 1 &&
						activeTagIds.has(String(tag.id)) &&
						excludedTagIds.size === 0 &&
						!noTagsFilter
							? 'browse-shell__tag-group--active'
							: ''
					}`}
					onClick={() => {
						const tagStr = String(tag.id)
						const isSoleActive =
							activeTagIds.size === 1 &&
							activeTagIds.has(tagStr) &&
							excludedTagIds.size === 0 &&
							!noTagsFilter
						if (isSoleActive) {
							// deselect → show all
							setActiveTagIds(new Set())
							setExcludedTagIds(new Set())
							applyFilters({
								activeTagIds: new Set(),
								excludedTagIds: new Set(),
								noTagsFilter: false,
							})
						} else {
							// exclusively select this tag
							const next = new Set([tagStr])
							setActiveTagIds(next)
							setExcludedTagIds(new Set())
							setNoTagsFilter(false)
							applyFilters({ activeTagIds: next, excludedTagIds: new Set(), noTagsFilter: false })
						}
					}}>
					<span>{tag.name}</span>
					<strong>{tag.pokemonCount}</strong>
					{tag.description && <small>{tag.description}</small>}
				</button>
			))}
			<button type='button' className='browse-shell__new-tag' onClick={handleCreateTagGroup}>
				New tag
			</button>
		</aside>
	)

	const renderBrowse = () => (
		<div className='browse-shell__content browse-shell__content--home'>
			{renderSidebar()}
			<section className='browse-shell__main'>
				{browseLayout === 'list' ? (
					<PokemonTable
						items={processedPokemon}
						loading={loading}
						onPokemonClick={selectionMode ? undefined : onPokemonClick}
						onManageTags={handleManageTags}
						onDownload={handleDownload}
						selectionMode={selectionMode}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onEnterSelectionMode={() => setSelectionMode(true)}
					/>
				) : (
					<PokemonHubGrid
						items={processedPokemon}
						loading={loading}
						onPokemonClick={selectionMode ? undefined : onPokemonClick}
						onManageTags={handleManageTags}
						selectionMode={selectionMode}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onEnterSelectionMode={() => setSelectionMode(true)}
					/>
				)}
			</section>
		</div>
	)

	return (
		<div className='app-container app-container--home'>
			<header className='browse-shell__topbar'>
				<h1>{viewMode === 'boxes' ? 'Boxes' : 'Collection'}</h1>
				<nav className='browse-shell__view-switch' aria-label='View mode'>
					<button
						type='button'
						className={viewMode === 'browse' ? 'is-active' : ''}
						onClick={() => setViewMode('browse')}>
						<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><rect x='3' y='3' width='7' height='7'/><rect x='14' y='3' width='7' height='7'/><rect x='3' y='14' width='7' height='7'/><rect x='14' y='14' width='7' height='7'/></svg>
						Collection
					</button>
					<button
						type='button'
						className={viewMode === 'boxes' ? 'is-active' : ''}
						onClick={() => setViewMode('boxes')}>
						<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'/><path d='m3.3 7 8.7 5 8.7-5'/><path d='M12 22V12'/></svg>
						Boxes
					</button>
				</nav>
				{viewMode !== 'boxes' && (
					<div className='browse-shell__layout-switch' aria-label='Layout'>
						<button
							type='button'
							className={browseLayout === 'list' ? 'is-active' : ''}
							onClick={() => setBrowseLayout('list')}
							aria-label='List view'>
							<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><line x1='8' y1='6' x2='21' y2='6'/><line x1='8' y1='12' x2='21' y2='12'/><line x1='8' y1='18' x2='21' y2='18'/><line x1='3' y1='6' x2='3.01' y2='6'/><line x1='3' y1='12' x2='3.01' y2='12'/><line x1='3' y1='18' x2='3.01' y2='18'/></svg>
						</button>
						<button
							type='button'
							className={browseLayout === 'grid' ? 'is-active' : ''}
							onClick={() => setBrowseLayout('grid')}
							aria-label='Grid view'>
							<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='3' width='7' height='7'/><rect x='14' y='3' width='7' height='7'/><rect x='3' y='14' width='7' height='7'/><rect x='14' y='14' width='7' height='7'/></svg>
						</button>
					</div>
				)}
			</header>

			{renderFilterDock()}
			{loading && <p className='browse-shell__state'>Loading...</p>}
			{error && <p className='error'>{error}</p>}

			{viewMode === 'boxes' ? (
				<BoxView
					boxes={boxes}
					selectedBox={selectedBox}
					processedPokemon={processedPokemon}
					activeBoxId={activeBoxId}
					loading={boxLoading || loading}
					onSelectBox={onSelectBox}
					onCreateBox={onCreateBox}
					onDeleteBox={onDeleteBox}
					onMovePokemon={onMovePokemon}
					onClearSlot={onClearSlot}
					onRenameBox={onRenameBox}
					onReorderBoxes={onReorderBoxes}
					onClearBox={onClearBox}
					onPokemonClick={onPokemonClick}
					onManageTags={handleManageTags}
				/>
			) : (
				renderBrowse()
			)}

			{viewMode === 'browse' && (
				<Pagination
					currentPage={currentPage}
					itemsPerPage={itemsPerPage}
					onItemsPerPageChange={onItemsPerPageChange}
					onPageChange={onPageChange}
					totalItems={totalPokemon}
					totalPages={totalPages}
					disabled={loading}
					key={totalPokemon}
					loading={loading}
				/>
			)}

			<ConfirmDialog
				open={confirmOpen}
				title='Delete Pokémon'
				message='Are you sure you want to delete this Pokémon from the database? This action cannot be undone.'
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
			/>

			{tagManagerOpen && selectedPokemonForTags && (
				<TagManager
					pokemon={selectedPokemonForTags}
					isOpen={tagManagerOpen}
					onClose={handleTagManagerClose}
					onTagsUpdated={handleTagsUpdated}
					onTagSystemChanged={handleTagSystemChanged}
				/>
			)}

			{bulkAction && (
				<div
					className='bulk-tag-modal__backdrop'
					onClick={() => {
						setBulkAction(null)
						setBulkError(null)
					}}>
					<div className='bulk-tag-modal' onClick={(e) => e.stopPropagation()}>
						<h3 className='bulk-tag-modal__title'>
							{bulkAction === 'add'
								? 'Add tags to'
								: bulkAction === 'remove'
									? 'Remove tags from'
									: 'Replace tags on'}{' '}
							{selectedIds.size} Pokémon
						</h3>
						{bulkAction === 'replace' && (
							<p className='bulk-tag-modal__warning'>
								This will remove all existing tags and replace them with the selected ones.
							</p>
						)}
						{bulkError && <p className='bulk-tag-modal__error'>{bulkError}</p>}
						<BulkTagSelector
							tags={availableTags}
							loading={bulkTagLoading}
							onSubmit={handleBulkSubmit}
							onCancel={() => {
								setBulkAction(null)
								setBulkError(null)
							}}
							actionLabel={
								bulkAction === 'add' ? 'Add' : bulkAction === 'remove' ? 'Remove' : 'Replace'
							}
						/>
					</div>
				</div>
			)}
		</div>
	)
}

export default HomeComponent
