import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { ViewMode } from '@/models/store/StylesSetting'
import type { OrganizeDensity } from '@/models/store/StylesSetting'
import { ConfirmDialog } from '@/ConfirmDialog'
import { PokemonFilters, PokemonCard, Pagination } from '@/components/elements'
import { TagManager } from '@/components/elements/TagManager/TagManager'
import { BoxView } from './views/BoxView'
import { KanbanView } from './views/KanbanView'
import './HomeComponent.scss'

/**
 * Tipos para las props del componente
 */
interface ProcessedPokemon {
	pokemon: PokemonListItemDto
	sprite: string | undefined
	type1?: string
	type2?: string
}

interface GroupedPokemon {
	grouped: { [key: string]: PokemonListItemDto[] }
	untagged: PokemonListItemDto[]
}

interface HomeComponentProps {
	// Estado de datos
	processedPokemon: ProcessedPokemon[]
	groupedPokemon: GroupedPokemon
	totalPokemon: number
	loading: boolean
	error: string | null

	// Configuración de UI
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	organizeDensity: OrganizeDensity
	setOrganizeDensity: (density: OrganizeDensity) => void
	collapsedSections: Set<string>

	// Estados de dialogs
	confirmOpen: boolean
	tagManagerOpen: boolean
	selectedPokemonForTags: PokemonListItemDto | null

	// Handlers de eventos
	handleFiltersChange: (filters: PokemonListFilterDto) => void
	handleDownload: (id: number) => void
	handleDelete: (id: number) => void
	handleConfirmDelete: () => Promise<void>
	handleCancelDelete: () => void
	handleManageTags: (pokemon: PokemonListItemDto) => void
	handleTagsUpdated: (pokemonId: number, newTags: TagDto[]) => void
	handleTagManagerClose: () => void
	handleTagSystemChanged: () => void
	toggleSectionCollapse: (sectionKey: string) => void

	// Paginación
	itemsPerPage: number
	onItemsPerPageChange: (itemsPerPage: number) => void
	totalPages: number
	currentPage: number
	onPageChange: (page: number) => void

	// Detail
	onPokemonClick?: (pokemon: PokemonListItemDto) => void

	// Kanban
	kanbanDragMode?: 'move' | 'copy'
	onKanbanTagsChanged?: () => void
}

/**
 * Componente de presentación para la página Home
 * Solo se encarga del renderizado, recibe toda la lógica como props
 */
const HomeComponent = ({
	// Estado de datos
	processedPokemon,
	groupedPokemon,
	totalPokemon,
	loading,
	error,

	// Configuración de UI
	viewMode,
	setViewMode,
	organizeDensity,
	setOrganizeDensity,
	collapsedSections,

	// Estados de dialogs
	confirmOpen,
	tagManagerOpen,
	selectedPokemonForTags,

	// Handlers de eventos
	handleFiltersChange,
	handleDownload,
	handleDelete,
	handleConfirmDelete,
	handleCancelDelete,
	handleManageTags,
	handleTagsUpdated,
	handleTagManagerClose,
	handleTagSystemChanged,
	toggleSectionCollapse,

	// Paginación
	itemsPerPage,
	onItemsPerPageChange,
	totalPages,
	currentPage,
	onPageChange,
	onPokemonClick,
	kanbanDragMode,
	onKanbanTagsChanged,
}: HomeComponentProps) => {
	/**
	 * Renderiza el header de la aplicación
	 */
	const renderHeader = () => (
		<header
			className='app-banner'
			style={{
				marginBottom: '1rem',
				position: 'relative',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexDirection: 'column',
			}}>
			<h1
				className='visually-hidden'
				style={{
					position: 'absolute',
					width: '1px',
					height: '1px',
					padding: 0,
					margin: '-1px',
					overflow: 'hidden',
					clip: 'rect(0 0 0 0)',
					whiteSpace: 'nowrap',
					border: 0,
				}}>
				Beast Vault
			</h1>
		</header>
	)

	/**
	 * Renderiza la barra de controles con información y selectores de vista
	 */
	const renderControlBar = () => (
		<div className='view-controls'>
			<div className='view-controls__modes'>
				{(['grid', 'organize', 'box', 'kanban'] as ViewMode[]).map((mode) => {
					const labels: Record<ViewMode, { label: string }> = {
						grid: { label: 'Grid' },
						organize: { label: 'Organize' },
						box: { label: 'Box' },
						kanban: { label: 'Kanban' },
					}
					const { label } = labels[mode]
					return (
						<button
							key={mode}
							onClick={() => setViewMode(mode)}
							className={`view-controls__btn ${viewMode === mode ? 'view-controls__btn--active' : ''}`}>
							{label}
						</button>
					)
				})}
			</div>

			{viewMode === 'organize' && (
				<div className='view-controls__options'>
					<div className='view-controls__density'>
						<button
							className={organizeDensity === 'expanded' ? 'active' : ''}
							onClick={() => setOrganizeDensity('expanded')}>
							Expanded
						</button>
						<button
							className={organizeDensity === 'compact' ? 'active' : ''}
							onClick={() => setOrganizeDensity('compact')}>
							Compact
						</button>
					</div>
				</div>
			)}
		</div>
	)

	/**
	 * Renderiza la vista de organización por tags (antes "tags view")
	 */
	const renderOrganizeView = () => {
		const { grouped, untagged } = groupedPokemon

		return (
			<div
				className={`organize-view ${organizeDensity === 'compact' ? 'organize-view--compact' : ''}`}>
				{Object.entries(grouped).map(([tagName, taggedPokemon]) => {
					const sectionKey = `tag-${tagName}`
					const isCollapsed = collapsedSections.has(sectionKey)

					return (
						<div key={tagName} className='organize-view__group'>
							<div
								className='organize-view__group-header'
								onClick={() => toggleSectionCollapse(sectionKey)}>
								<div className='organize-view__group-title'>
									<span
										className={`organize-view__group-toggle ${!isCollapsed ? 'organize-view__group-toggle--expanded' : ''}`}>
										▶
									</span>
									{tagName}
								</div>
								<span className='organize-view__group-count'>{taggedPokemon.length}</span>
							</div>
							{!isCollapsed && (
								<div className='organize-view__group-body'>
									<div className='pokemon-grid'>
										{taggedPokemon.map((p) => {
											const pokemonData = processedPokemon.find((item) => item.pokemon.id === p.id)
											return (
												<PokemonCard
													key={p.id}
													pokemon={p}
													sprite={pokemonData?.sprite}
													type1={pokemonData?.type1}
													type2={pokemonData?.type2}
													onClick={onPokemonClick}
													onDelete={handleDelete}
													onDownload={handleDownload}
													onManageTags={handleManageTags}
													loading={loading}
												/>
											)
										})}
									</div>
								</div>
							)}
						</div>
					)
				})}

				{untagged.length > 0 &&
					(() => {
						const sectionKey = 'untagged'
						const isCollapsed = collapsedSections.has(sectionKey)
						return (
							<div className='organize-view__group'>
								<div
									className='organize-view__group-header'
									onClick={() => toggleSectionCollapse(sectionKey)}>
									<div className='organize-view__group-title'>
										<span
											className={`organize-view__group-toggle ${!isCollapsed ? 'organize-view__group-toggle--expanded' : ''}`}>
											▶
										</span>
										No Tags
									</div>
									<span className='organize-view__group-count'>{untagged.length}</span>
								</div>
								{!isCollapsed && (
									<div className='organize-view__group-body'>
										<div className='pokemon-grid'>
											{untagged.map((p) => {
												const pokemonData = processedPokemon.find(
													(item) => item.pokemon.id === p.id
												)
												return (
													<PokemonCard
														key={p.id}
														pokemon={p}
														sprite={pokemonData?.sprite}
														type1={pokemonData?.type1}
														type2={pokemonData?.type2}
														onClick={onPokemonClick}
														onDelete={handleDelete}
														onDownload={handleDownload}
														onManageTags={handleManageTags}
														loading={loading}
													/>
												)
											})}
										</div>
									</div>
								)}
							</div>
						)
					})()}
			</div>
		)
	}

	/**
	 * Renderiza la vista en grid
	 */
	const renderGridView = () => (
		<div className='pokemon-grid'>
			{processedPokemon.length === 0 && !loading && <p>No Pokémon found.</p>}
			{processedPokemon.map(({ pokemon, sprite, type1, type2 }) => (
				<PokemonCard
					key={pokemon.id}
					pokemon={pokemon}
					sprite={sprite}
					type1={type1}
					type2={type2}
					onClick={onPokemonClick}
					onDelete={handleDelete}
					onDownload={handleDownload}
					onManageTags={handleManageTags}
					loading={loading}
				/>
			))}
		</div>
	)

	/**
	 * Renderiza el contenido principal según el modo de vista seleccionado
	 */
	const renderPokemonContent = () => {
		switch (viewMode) {
			case 'organize':
				return renderOrganizeView()
			case 'grid':
				return renderGridView()
			case 'box':
				return (
					<BoxView
						processedPokemon={processedPokemon}
						onPokemonClick={onPokemonClick}
						onDelete={handleDelete}
						onDownload={handleDownload}
						onManageTags={handleManageTags}
						loading={loading}
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={onPageChange}
					/>
				)
			case 'kanban':
				return (
					<KanbanView
						processedPokemon={processedPokemon}
						groupedPokemon={groupedPokemon}
						onPokemonClick={onPokemonClick}
						onDelete={handleDelete}
						onManageTags={handleManageTags}
						loading={loading}
						dragMode={kanbanDragMode}
						onTagsChanged={onKanbanTagsChanged}
					/>
				)
			default:
				return renderGridView()
		}
	}

	// Render principal del componente
	return (
		<div className='app-container'>
			{renderHeader()}

			{/* Componente de filtros */}
			<PokemonFilters onFiltersChange={handleFiltersChange} loading={loading} />

			{/* Estados de carga y error */}
			{loading && <p>Loading...</p>}
			{error && <p className='error'>{error}</p>}

			{renderControlBar()}
			{renderPokemonContent()}

			{/* Dialogs de confirmación */}
			<ConfirmDialog
				open={confirmOpen}
				title='Delete Pokémon'
				message='Are you sure you want to delete this Pokémon from the database? This action cannot be undone.'
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
			/>

			{/* Modal de gestión de tags */}
			{tagManagerOpen && selectedPokemonForTags && (
				<TagManager
					pokemon={selectedPokemonForTags}
					isOpen={tagManagerOpen}
					onClose={handleTagManagerClose}
					onTagsUpdated={handleTagsUpdated}
					onTagSystemChanged={handleTagSystemChanged}
				/>
			)}

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
		</div>
	)
}

export default HomeComponent
