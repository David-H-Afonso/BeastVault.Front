import { useMemo, useState } from 'react'
import type {
	PokemonBoxDetailDto,
	PokemonBoxSummaryDto,
	PokemonListItemDto,
	TagDto,
} from '@/models/api/types'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import { SortBy, SortDirection } from '@/models/Pokemon'
import type { BrowseLayout, ViewMode } from '@/models/store/StylesSetting'
import { ConfirmDialog } from '@/ConfirmDialog'
import { Pagination } from '@/components/elements'
import { TagManager } from '@/components/elements/TagManager/TagManager'
import { getComputedTypeColor } from '@/utils/typeColors'
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
}

type TagMatchMode = 'any' | 'all' | 'exclude' | 'none'
type SortPreset = 'smart' | 'species' | 'level' | 'recent' | 'favorites'

const tagLabel = (tag: TagDto) => tag.name

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

function TagChip({ tag }: { tag: TagDto }) {
	return (
		<span className='browse-shell__tag' style={buildTagStyle(tag)}>
			{tagLabel(tag)}
		</span>
	)
}

function PokemonTable({
	items,
	loading,
	onPokemonClick,
	onManageTags,
	onDownload,
}: {
	items: ProcessedPokemon[]
	loading: boolean
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	onDownload: (id: number) => void
}) {
	if (items.length === 0 && !loading) {
		return <p className='browse-shell__empty'>No Pokémon match the current filters.</p>
	}

	return (
		<div className='browse-table'>
			<div className='browse-table__head'>
				<span>Pokémon</span>
				<span>Types</span>
				<span>Tags</span>
				<span>Origin</span>
				<span>Actions</span>
			</div>
			{items.map(({ pokemon, sprite, type1, type2 }) => (
				<div key={pokemon.id} className='browse-table__row'>
					<button
						type='button'
						className='browse-table__identity'
						onClick={() => onPokemonClick?.(pokemon)}>
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
					<div className='browse-shell__tags'>
						{pokemon.tags?.slice(0, 4).map((tag) => (
							<TagChip key={tag.id} tag={tag} />
						))}
					</div>
					<div className='browse-table__origin'>
						Gen {pokemon.originGeneration} / Gen {pokemon.capturedGeneration}
					</div>
					<div className='browse-table__actions'>
						<button type='button' onClick={() => onPokemonClick?.(pokemon)}>
							Open
						</button>
						<button type='button' onClick={() => onManageTags(pokemon)}>
							Tags
						</button>
						<button type='button' onClick={() => onDownload(pokemon.id)}>
							Save
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
}: {
	items: ProcessedPokemon[]
	loading: boolean
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
}) {
	if (items.length === 0 && !loading) {
		return <p className='browse-shell__empty'>No Pokémon match the current filters.</p>
	}

	return (
		<div className='hub-grid'>
			{items.map(({ pokemon, sprite, type1, type2 }) => (
				<article key={pokemon.id} className='hub-card'>
					<button
						type='button'
						className='hub-card__open'
						onClick={() => onPokemonClick?.(pokemon)}>
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
						<div className='browse-shell__tags'>
							{pokemon.tags?.slice(0, 3).map((tag) => (
								<TagChip key={tag.id} tag={tag} />
							))}
						</div>
					</button>
					<button type='button' className='hub-card__tags' onClick={() => onManageTags(pokemon)}>
						Tags
					</button>
				</article>
			))}
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
}: HomeComponentProps) => {
	const [search, setSearch] = useState(currentFilters.Search || '')
	const [selectedTagId, setSelectedTagId] = useState<string>('')
	const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>('any')
	const [generation, setGeneration] = useState<string>('all')
	const [sortPreset, setSortPreset] = useState<SortPreset>('smart')
	const [isFilterDockOpen, setFilterDockOpen] = useState(false)

	const stats = useMemo(() => {
		const uniqueTags = new Set<number>()
		let favorites = 0
		processedPokemon.forEach(({ pokemon }) => {
			if (pokemon.favorite) favorites += 1
			pokemon.tags?.forEach((tag) => uniqueTags.add(tag.id))
		})
		return {
			visible: processedPokemon.length,
			uniqueTags: uniqueTags.size,
			favorites,
			boxes: boxes.length,
		}
	}, [boxes.length, processedPokemon])

	const applyFilters = (
		overrides: Partial<{
			search: string
			selectedTagId: string
			tagMatchMode: TagMatchMode
			generation: string
			sortPreset: SortPreset
		}> = {}
	) => {
		const nextSearch = overrides.search ?? search
		const nextSelectedTagId = overrides.selectedTagId ?? selectedTagId
		const nextTagMatchMode = overrides.tagMatchMode ?? tagMatchMode
		const nextGeneration = overrides.generation ?? generation
		const nextSortPreset = overrides.sortPreset ?? sortPreset

		const filters: PokemonListFilterDto = {
			...currentFilters,
			Search: nextSearch.trim() || undefined,
			OriginGeneration: nextGeneration === 'all' ? undefined : Number.parseInt(nextGeneration, 10),
			Skip: 0,
			Take: currentFilters.Take || itemsPerPage,
			tagIds: undefined,
			anyTagIds: undefined,
			excludedTagIds: undefined,
			hasNoTags: undefined,
		}

		const tagId = nextSelectedTagId ? Number.parseInt(nextSelectedTagId, 10) : undefined
		if (nextTagMatchMode === 'none') {
			filters.hasNoTags = true
		} else if (tagId) {
			if (nextTagMatchMode === 'all') filters.tagIds = [tagId]
			if (nextTagMatchMode === 'any') filters.anyTagIds = [tagId]
			if (nextTagMatchMode === 'exclude') filters.excludedTagIds = [tagId]
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

	const selectTag = (tagId: string) => {
		setSelectedTagId(tagId)
		if (tagId) setTagMatchMode('any')
		applyFilters({ selectedTagId: tagId, tagMatchMode: tagId ? 'any' : tagMatchMode })
	}

	const renderFilterDock = () => {
		if (viewMode === 'boxes') return null

		const selectedTag = availableTags.find((tag) => String(tag.id) === selectedTagId)

		return (
			<section className='browse-shell__filter-dock browse-shell__filter-dock--home'>
				<div className='browse-shell__filter-header'>
					<div className='browse-shell__filter-header-copy'>
						<strong>Pokemon</strong>
						<span>HOME-style collection browser with quick search, sort, and tag rails</span>
					</div>
					<button
						type='button'
						className='browse-shell__filter-toggle'
						onClick={() => setFilterDockOpen((open) => !open)}>
						{isFilterDockOpen ? 'Hide search' : 'Search'}
					</button>
				</div>

				<div className='browse-shell__home-toolbar'>
					<button type='button' className='browse-shell__collection-pill'>
						<span>All Pokemon</span>
						<strong>{totalPokemon}</strong>
					</button>
					<div className='browse-shell__sort-pills'>
						{[
							{ key: 'recent', label: 'Newest 30' },
							{ key: 'species', label: 'Pokédex Number' },
							{ key: 'level', label: 'Level' },
							{ key: 'favorites', label: 'Favorites' },
						].map((option) => (
							<button
								key={option.key}
								type='button'
								className={sortPreset === option.key ? 'is-active' : ''}
								onClick={() => {
									const next = option.key as SortPreset
									setSortPreset(next)
									applyFilters({ sortPreset: next })
								}}>
								{option.label}
							</button>
						))}
					</div>
					{(selectedTag || tagMatchMode === 'none') && (
						<div className='browse-shell__active-filter-note'>
							{tagMatchMode === 'none'
								? 'Showing Pokémon without tags'
								: `Tag filter: ${selectedTag?.name}`}
						</div>
					)}
				</div>

				<div
					className={`browse-shell__filters${
						!isFilterDockOpen ? ' browse-shell__filters--collapsed' : ''
					}`}>
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') applyFilters({ search: event.currentTarget.value })
						}}
						placeholder='Search species, nickname, OT, move, item, tag...'
					/>
					<select
						value={tagMatchMode}
						onChange={(event) => {
							const value = event.target.value as TagMatchMode
							setTagMatchMode(value)
							if (value === 'none') setSelectedTagId('')
							applyFilters({
								tagMatchMode: value,
								selectedTagId: value === 'none' ? '' : selectedTagId,
							})
						}}>
						<option value='any'>Any tag</option>
						<option value='all'>Required tag</option>
						<option value='exclude'>Exclude tag</option>
						<option value='none'>No tags</option>
					</select>
					{tagMatchMode !== 'none' && (
						<select
							value={selectedTagId}
							onChange={(event) => {
								setSelectedTagId(event.target.value)
								applyFilters({ selectedTagId: event.target.value })
							}}>
							<option value=''>All tags</option>
							{availableTags.map((tag) => (
								<option key={tag.id} value={tag.id}>
									{tag.name}
								</option>
							))}
						</select>
					)}
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
						value={sortPreset}
						onChange={(event) => {
							const value = event.target.value as SortPreset
							setSortPreset(value)
							applyFilters({ sortPreset: value })
						}}>
						<option value='smart'>Sort: Smart</option>
						<option value='species'>Sort: Species</option>
						<option value='level'>Sort: Level</option>
						<option value='recent'>Sort: Recent</option>
						<option value='favorites'>Sort: Favorites</option>
					</select>
					<button type='button' onClick={() => applyFilters()}>
						Apply
					</button>
				</div>

				<div className='browse-shell__quick-tags'>
					<button
						type='button'
						className={!selectedTagId && tagMatchMode !== 'none' ? 'is-active' : ''}
						onClick={() => selectTag('')}>
						All
					</button>
					<button
						type='button'
						className={tagMatchMode === 'none' ? 'is-active' : ''}
						onClick={() => {
							setTagMatchMode('none')
							setSelectedTagId('')
							applyFilters({ tagMatchMode: 'none', selectedTagId: '' })
						}}>
						No tags
					</button>
					{availableTags.slice(0, 8).map((tag) => (
						<button
							key={tag.id}
							type='button'
							className={selectedTagId === String(tag.id) ? 'is-active' : ''}
							onClick={() => selectTag(String(tag.id))}>
							{tag.name}
						</button>
					))}
				</div>
			</section>
		)
	}

	const renderSidebar = () => (
		<aside className='browse-shell__sidebar'>
			<button
				type='button'
				className={`browse-shell__tag-group ${!selectedTagId ? 'browse-shell__tag-group--active' : ''}`}
				onClick={() => selectTag('')}>
				<span>All Pokémon</span>
				<strong>{totalPokemon}</strong>
			</button>
			{availableTags.map((tag) => (
				<button
					type='button'
					key={tag.id}
					className={`browse-shell__tag-group ${
						selectedTagId === String(tag.id) ? 'browse-shell__tag-group--active' : ''
					}`}
					onClick={() => selectTag(String(tag.id))}>
					<span>{tag.name}</span>
					<strong>{tag.pokemonCount}</strong>
					{tag.description && <small>{tag.description}</small>}
				</button>
			))}
			<button type='button' className='browse-shell__new-tag' onClick={handleCreateTagGroup}>
				+ New tag group
			</button>
		</aside>
	)

	const renderBrowse = () => (
		<div className='browse-shell__content browse-shell__content--home'>
			{renderSidebar()}
			<section className='browse-shell__main'>
				<div className='browse-shell__stats'>
					<div>
						<strong>{stats.visible}</strong>
						<span>visible Pokémon</span>
					</div>
					<div>
						<strong>{stats.uniqueTags}</strong>
						<span>unique tags</span>
					</div>
					<div>
						<strong>{stats.favorites}</strong>
						<span>favorites</span>
					</div>
					<div>
						<strong>{stats.boxes}</strong>
						<span>boxes</span>
					</div>
				</div>
				{browseLayout === 'list' ? (
					<PokemonTable
						items={processedPokemon}
						loading={loading}
						onPokemonClick={onPokemonClick}
						onManageTags={handleManageTags}
						onDownload={handleDownload}
					/>
				) : (
					<PokemonHubGrid
						items={processedPokemon}
						loading={loading}
						onPokemonClick={onPokemonClick}
						onManageTags={handleManageTags}
					/>
				)}
			</section>
		</div>
	)

	return (
		<div className='app-container app-container--home'>
			<header className='browse-shell__topbar'>
				<div>
					<h1>Beast Vault</h1>
					<p>
						{viewMode === 'boxes'
							? 'Pokemon HOME-inspired box organizer'
							: 'Pokemon HOME-inspired collection browser'}
					</p>
				</div>
				<nav className='browse-shell__view-switch'>
					<button
						type='button'
						className={viewMode === 'browse' ? 'is-active' : ''}
						onClick={() => setViewMode('browse')}>
						Pokemon
					</button>
					<button
						type='button'
						className={viewMode === 'boxes' ? 'is-active' : ''}
						onClick={() => setViewMode('boxes')}>
						Your Room
					</button>
				</nav>
				{viewMode !== 'boxes' && (
					<div className='browse-shell__layout-switch'>
						<button
							type='button'
							className={browseLayout === 'list' ? 'is-active' : ''}
							onClick={() => setBrowseLayout('list')}>
							List View
						</button>
						<button
							type='button'
							className={browseLayout === 'grid' ? 'is-active' : ''}
							onClick={() => setBrowseLayout('grid')}>
							Grid View
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
		</div>
	)
}

export default HomeComponent
