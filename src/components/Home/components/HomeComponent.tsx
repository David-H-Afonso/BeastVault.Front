import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { ViewMode } from '@/models/store/StylesSetting'
import { ConfirmDialog } from '@/ConfirmDialog'
import { PokemonFilters, PokemonCard, PokemonListRow, Pagination } from '@/components/elements'
import { TagManager } from '@/components/elements/TagManager/TagManager'
import './HomeComponent.scss'

/**
 * Tipos para las props del componente
 */
interface ProcessedPokemon {
	pokemon: PokemonListItemDto
	sprite: string | undefined
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
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '1rem',
			}}>
			{/* Selector de modo de vista */}
			<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
				<button
					onClick={() => setViewMode('tags')}
					style={{
						background: viewMode === 'tags' ? '#3b82f6' : '#6b7280',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						padding: '6px 12px',
						fontSize: '0.8rem',
						cursor: 'pointer',
						transition: 'all 0.2s',
					}}>
					🏷️ Group by Tags
				</button>
				<button
					onClick={() => setViewMode('grid')}
					style={{
						background: viewMode === 'grid' ? '#3b82f6' : '#6b7280',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						padding: '6px 12px',
						fontSize: '0.8rem',
						cursor: 'pointer',
						transition: 'all 0.2s',
					}}>
					📋 Grid View
				</button>
				<button
					onClick={() => setViewMode('list')}
					style={{
						background: viewMode === 'list' ? '#3b82f6' : '#6b7280',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						padding: '6px 12px',
						fontSize: '0.8rem',
						cursor: 'pointer',
						transition: 'all 0.2s',
					}}>
					📝 List View
				</button>
			</div>
		</div>
	)

	/**
	 * Renderiza un grupo de Pokémon por tag
	 */
	const renderPokemonGroup = (
		tagName: string,
		pokemonList: PokemonListItemDto[],
		sectionKey: string
	) => {
		const isCollapsed = collapsedSections.has(sectionKey)

		return (
			<div key={tagName} className='pokemon-group'>
				<h3 className='group-title clickable' onClick={() => toggleSectionCollapse(sectionKey)}>
					<span className={`toggle-icon ${isCollapsed ? '' : 'expanded'}`}>▶</span>
					🏷️ {tagName} ({pokemonList.length})
				</h3>
				{!isCollapsed && (
					<div className='pokemon-grid'>
						{pokemonList.map((p) => {
							const pokemonData = processedPokemon.find((item) => item.pokemon.id === p.id)
							return (
								<PokemonCard
									key={p.id}
									pokemon={p}
									sprite={pokemonData?.sprite}
									onDelete={handleDelete}
									onDownload={handleDownload}
									onManageTags={handleManageTags}
									loading={loading}
								/>
							)
						})}
					</div>
				)}
			</div>
		)
	}

	/**
	 * Renderiza la vista agrupada por tags
	 */
	const renderTagsView = () => {
		const { grouped, untagged } = groupedPokemon

		return (
			<div className='pokemon-groups'>
				{/* Grupos con tags */}
				{Object.entries(grouped).map(([tagName, taggedPokemon]) =>
					renderPokemonGroup(tagName, taggedPokemon, `tag-${tagName}`)
				)}

				{/* Pokémon sin tags */}
				{untagged.length > 0 && renderPokemonGroup('OTHERS (No Tags)', untagged, 'untagged')}
			</div>
		)
	}

	/**
	 * Renderiza la vista en grid
	 */
	const renderGridView = () => (
		<div className='pokemon-grid'>
			{processedPokemon.length === 0 && !loading && <p>No Pokémon found.</p>}
			{processedPokemon.map(({ pokemon, sprite }) => (
				<PokemonCard
					key={pokemon.id}
					pokemon={pokemon}
					sprite={sprite}
					onDelete={handleDelete}
					onDownload={handleDownload}
					onManageTags={handleManageTags}
					loading={loading}
				/>
			))}
		</div>
	)

	/**
	 * Renderiza la vista en lista
	 */
	const renderListView = () => (
		<div className='pokemon-list-container'>
			{processedPokemon.length === 0 && !loading && <p>No Pokémon found.</p>}
			{processedPokemon.map(({ pokemon, sprite }) => (
				<PokemonListRow
					key={pokemon.id}
					pokemon={pokemon}
					sprite={sprite}
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
			case 'tags':
				return renderTagsView()
			case 'grid':
				return renderGridView()
			case 'list':
				return renderListView()
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
