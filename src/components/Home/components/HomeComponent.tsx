import { useMemo, useState, useCallback, useEffect } from 'react'
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
		<span className='browse-shell__type' style={{ backgroundColor: getComputedTypeColor(type) }}>
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
						<h3>{pokemon.nickname || pokemon.speciesName}</h3>
						<p>{pokemon.speciesName}</p>
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
					</button>
					<button
						type='button'
						className='hub-card__tags'
						disabled={selectionMode}
						onClick={() => onManageTags(pokemon)}>
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

	const renderFilterDock = () => {
		if (viewMode === 'boxes') return null

		const selectedBall = pokeballs.find((ball) => String(ball.id) === pokeballId)
		const activeFilterLabels = [
			shinyFilter === 'shiny' ? 'Shiny only' : '',
			shinyFilter === 'regular' ? 'Non-shiny' : '',
			selectedBall ? selectedBall.name : '',
		].filter((label): label is string => Boolean(label))

		return (
			<section className='browse-shell__filter-dock browse-shell__filter-dock--home'>
				<div className='browse-shell__command-bar'>
					<input
						className='browse-shell__search-input'
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') applyFilters({ search: event.currentTarget.value })
						}}
						placeholder='Search species, nickname, OT, move, item, tag...'
						aria-label='Search Pokemon'
					/>
					<button
						type='button'
						className='browse-shell__search-submit'
						onClick={() => applyFilters()}>
						Search
					</button>
					<button
						type='button'
						className='browse-shell__filter-toggle'
						onClick={() => setFilterDockOpen((open) => !open)}>
						{isFilterDockOpen ? 'Hide filters' : 'Filters'}
					</button>
					<select
						className='browse-shell__sort-select'
						value={sortPreset}
						onChange={(event) => {
							const value = event.target.value as SortPreset
							setSortPreset(value)
							applyFilters({ sortPreset: value })
						}}
						aria-label='Sort Pokemon'>
						<option value='smart'>Smart sort</option>
						<option value='species'>Pokedex number</option>
						<option value='level'>Level</option>
						<option value='recent'>Recent</option>
						<option value='favorites'>Favorites</option>
					</select>
					<button
						type='button'
						className={`browse-shell__select-toggle${selectionMode ? ' is-active' : ''}`}
						onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
						title={selectionMode ? 'Cancel selection' : 'Select Pokémon'}>
						<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
							{selectionMode ? (
								<path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
							) : (
								<path d='M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z' />
							)}
						</svg>
					</button>
				</div>

				<div className='browse-shell__tag-bar'>
					<span className='browse-shell__tag-bar__count'>{totalPokemon} Pokémon</span>
					{activeFilterLabels.map((label) => (
						<span key={label} className='browse-shell__filter-chip'>
							{label}
						</span>
					))}
					<button
						type='button'
						className={noTagsFilter ? 'is-active' : ''}
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
					{availableTags.map((tag) => (
						<button
							key={tag.id}
							type='button'
							className={
								activeTagIds.has(String(tag.id))
									? 'is-active'
									: excludedTagIds.has(String(tag.id))
										? 'is-excluded'
										: ''
							}
							onClick={() => handleTagClick(String(tag.id))}>
							{tag.name}
						</button>
					))}
				</div>

				<div
					className={`browse-shell__filters${
						!isFilterDockOpen ? ' browse-shell__filters--collapsed' : ''
					}`}>
					<select
						value={generation}
						onChange={(event) => {
							setGeneration(event.target.value)
							applyFilters({ generation: event.target.value })
						}}>
						<option value='all'>All gens</option>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
							<option key={gen} value={gen}>
								Gen {gen}
							</option>
						))}
					</select>
					<select
						value={shinyFilter}
						onChange={(event) => {
							const value = event.target.value as 'all' | 'shiny' | 'regular'
							setShinyFilter(value)
							applyFilters({ shinyFilter: value })
						}}>
						<option value='all'>All (shiny)</option>
						<option value='shiny'>Shiny only</option>
						<option value='regular'>Non-shiny</option>
					</select>
					{pokeballs.length > 0 && (
						<select
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
					)}
					<button type='button' onClick={() => applyFilters()}>
						Apply
					</button>
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
				<div>
					<h1>{viewMode === 'boxes' ? 'Boxes' : 'Collection'}</h1>
				</div>
				<nav className='browse-shell__view-switch'>
					<button
						type='button'
						className={viewMode === 'browse' ? 'is-active' : ''}
						onClick={() => setViewMode('browse')}>
						Collection
					</button>
					<button
						type='button'
						className={viewMode === 'boxes' ? 'is-active' : ''}
						onClick={() => setViewMode('boxes')}>
						Boxes
					</button>
				</nav>
				{viewMode !== 'boxes' && (
					<div className='browse-shell__layout-switch'>
						<button
							type='button'
							className={browseLayout === 'list' ? 'is-active' : ''}
							onClick={() => setBrowseLayout('list')}>
							List
						</button>
						<button
							type='button'
							className={browseLayout === 'grid' ? 'is-active' : ''}
							onClick={() => setBrowseLayout('grid')}>
							Grid
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
