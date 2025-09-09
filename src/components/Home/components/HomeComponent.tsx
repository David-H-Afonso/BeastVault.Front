import { useState, useEffect, useCallback } from 'react'
import { downloadFileById, downloadPkmFileFromDisk } from '@/services/Pokemon'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import { ConfirmDialog } from '@/ConfirmDialog'
import { PokemonFilters, PokemonCard, PokemonListRow } from '@/components/elements'
import { TagManager } from '@/components/elements/TagManager/TagManager'
import { useViewMode } from '@/hooks/useViewMode'
import { useSpriteType } from '@/hooks/useSpriteType'
import { usePokemon } from '@/hooks/usePokemon'
import './HomeComponent.scss'
import { getBestSpriteByType, groupPokemonByTags } from '@/utils'

const HomeComponent = () => {
	const { spriteType } = useSpriteType()
	const { viewMode, setViewMode } = useViewMode()

	// Redux state and actions
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

	// Local UI state
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
	const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
	const [pendingDownloadId, setPendingDownloadId] = useState<number | null>(null)
	const [downloadLoading, setDownloadLoading] = useState(false)

	// Tag management state
	const [tagManagerOpen, setTagManagerOpen] = useState(false)
	const [selectedPokemonForTags, setSelectedPokemonForTags] = useState<PokemonListItemDto | null>(
		null
	)
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

	// Function to handle filter changes from the PokemonFilters component
	const handleFiltersChange = useCallback(
		(filters: PokemonListFilterDto) => {
			applyFiltersAndFetch(filters)
		},
		[applyFiltersAndFetch]
	)

	// Download logic
	const handleDownload = (id: number) => {
		setPendingDownloadId(id)
		setDownloadConfirmOpen(true)
	}

	const handleDownloadSource = async (source: 'backup' | 'database') => {
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
	}

	const handleCancelDownload = () => {
		setDownloadConfirmOpen(false)
		setPendingDownloadId(null)
	}

	// Fetch list on mount
	useEffect(() => {
		fetchPokemon()
	}, [fetchPokemon])

	const handleDelete = async (id: number) => {
		setConfirmOpen(true)
		setPendingDeleteId(id)
	}

	const handleConfirmDelete = async () => {
		if (pendingDeleteId == null) return
		clearCurrentError()
		try {
			await deletePokemonById(pendingDeleteId)
			// No need to refetch, Redux will automatically update the state
		} catch (e: any) {
			console.error('Delete failed:', e.message || 'Failed to delete Pokémon')
		} finally {
			setConfirmOpen(false)
			setPendingDeleteId(null)
		}
	}

	const handleCancelDelete = () => {
		setConfirmOpen(false)
		setPendingDeleteId(null)
	}

	// Tag management functions
	const handleManageTags = (pokemon: PokemonListItemDto) => {
		setSelectedPokemonForTags(pokemon)
		setTagManagerOpen(true)
	}

	const handleTagsUpdated = (pokemonId: number, newTags: TagDto[]) => {
		// Update the pokemon in Redux store with new tags
		updatePokemonTagsById(pokemonId, newTags)
	}

	const handleTagManagerClose = () => {
		setTagManagerOpen(false)
		setSelectedPokemonForTags(null)
	}

	// Function to toggle collapsed sections for tags view
	const toggleSectionCollapse = (sectionKey: string) => {
		setCollapsedSections((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(sectionKey)) {
				newSet.delete(sectionKey)
			} else {
				newSet.add(sectionKey)
			}
			return newSet
		})
	}

	return (
		<div className='app-container'>
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

			{/* Filters Component */}
			<PokemonFilters onFiltersChange={handleFiltersChange} loading={loading} />

			{loading && <p>Loading...</p>}
			{error && <p className='error'>{error}</p>}

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '1rem',
				}}>
				<h2>Pokémon Collection</h2>
				<div
					style={{
						color: 'rgba(255, 255, 255, 0.75)',
						fontSize: '0.9rem',
					}}>
					Showing {pokemon.length} of {totalPokemon} Pokémon
					{/* {currentFilters.Skip && currentFilters.Skip > 0 && (
						<span> (starting from #{currentFilters.Skip + 1})</span>
					)} */}
				</div>

				{/* View Mode Toggle */}
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

			{/* Pokemon Content */}
			{viewMode === 'tags' ? (
				// Tagged View - Grouped by tags
				<div className='pokemon-groups'>
					{(() => {
						const { grouped, untagged } = groupPokemonByTags(pokemon)
						return (
							<>
								{/* Tagged Pokemon Groups */}
								{Object.entries(grouped).map(([tagName, taggedPokemon]) => {
									const sectionKey = `tag-${tagName}`
									const isCollapsed = collapsedSections.has(sectionKey)
									return (
										<div key={tagName} className='pokemon-group'>
											<h3
												className='group-title clickable'
												onClick={() => toggleSectionCollapse(sectionKey)}>
												<span className={`toggle-icon ${isCollapsed ? '' : 'expanded'}`}>▶</span>
												🏷️ {tagName} ({taggedPokemon.length})
											</h3>
											{!isCollapsed && (
												<div className='pokemon-grid'>
													{taggedPokemon.map((p) => {
														const sprites = pokeSprites[p.id] || {}
														const bestSprite =
															getBestSpriteByType(sprites, spriteType, p.isShiny) || undefined
														return (
															<PokemonCard
																key={p.id}
																pokemon={p}
																sprite={bestSprite}
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
								})}

								{/* Untagged Pokemon */}
								{untagged.length > 0 && (
									<div className='pokemon-group'>
										<h3
											className='group-title clickable'
											onClick={() => toggleSectionCollapse('untagged')}>
											<span
												className={`toggle-icon ${
													collapsedSections.has('untagged') ? '' : 'expanded'
												}`}>
												▶
											</span>
											📂 OTHERS (No Tags) ({untagged.length})
										</h3>
										{!collapsedSections.has('untagged') && (
											<div className='pokemon-grid'>
												{untagged.map((p) => {
													const sprites = pokeSprites[p.id] || {}
													const bestSprite =
														getBestSpriteByType(sprites, spriteType, p.isShiny) || undefined
													return (
														<PokemonCard
															key={p.id}
															pokemon={p}
															sprite={bestSprite}
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
								)}
							</>
						)
					})()}
				</div>
			) : viewMode === 'grid' ? (
				// Grid View - Original card layout
				<div className='pokemon-grid'>
					{pokemon.length === 0 && !loading && <p>No Pokémon found.</p>}
					{pokemon.map((p) => {
						const sprites = pokeSprites[p.id] || {}
						const bestSprite = getBestSpriteByType(sprites, spriteType, p.isShiny) || undefined
						return (
							<PokemonCard
								key={p.id}
								pokemon={p}
								sprite={bestSprite}
								onDelete={handleDelete}
								onDownload={handleDownload}
								onManageTags={handleManageTags}
								loading={loading}
							/>
						)
					})}
				</div>
			) : (
				// List View - Minimal two-column layout
				<div className='pokemon-list-container'>
					{pokemon.length === 0 && !loading && <p>No Pokémon found.</p>}
					{pokemon.map((p) => {
						const sprites = pokeSprites[p.id] || {}
						const bestSprite = getBestSpriteByType(sprites, spriteType, p.isShiny) || undefined
						return (
							<PokemonListRow
								key={p.id}
								pokemon={p}
								sprite={bestSprite}
								onDelete={handleDelete}
								onDownload={handleDownload}
								onManageTags={handleManageTags}
								loading={loading}
							/>
						)
					})}
				</div>
			)}
			<ConfirmDialog
				open={confirmOpen}
				title='Delete Pokémon'
				message='Are you sure you want to delete this Pokémon from the database? This action cannot be undone.'
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
			/>
			<ConfirmDialog
				open={downloadConfirmOpen}
				title='Download Pokémon file'
				message={
					<div>
						<div>Choose the source to download the original file for this Pokémon:</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
							<button
								className='download-source-btn'
								style={{
									background: '#2563eb',
									color: 'white',
									border: 'none',
									borderRadius: 6,
									padding: '0.5em 1em',
									fontWeight: 600,
									cursor: 'pointer',
								}}
								onClick={() => handleDownloadSource('backup')}
								disabled={downloadLoading}>
								Backup
							</button>
							<button
								className='download-source-btn'
								style={{
									background: '#059669',
									color: 'white',
									border: 'none',
									borderRadius: 6,
									padding: '0.5em 1em',
									fontWeight: 600,
									cursor: 'pointer',
								}}
								onClick={() => handleDownloadSource('database')}
								disabled={downloadLoading}>
								Database
							</button>
						</div>
					</div>
				}
				onConfirm={() => {}}
				onCancel={handleCancelDownload}
				hideConfirm
			/>

			{/* Tag Manager Modal */}
			{tagManagerOpen && selectedPokemonForTags && (
				<TagManager
					pokemon={selectedPokemonForTags}
					isOpen={tagManagerOpen}
					onClose={handleTagManagerClose}
					onTagsUpdated={handleTagsUpdated}
				/>
			)}
		</div>
	)
}

export default HomeComponent
