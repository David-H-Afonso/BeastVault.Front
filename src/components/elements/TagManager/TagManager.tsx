import { useState, useEffect, type SyntheticEvent } from 'react'
import type { TagDto, PokemonListItemDto, TagCategory } from '../../../models/api/types'
import {
	getAllTags,
	createTag,
	deleteTag,
	assignTagsToPokemon,
	uploadTagImage,
	setTagImageUrl,
	deleteTagImage,
} from '../../../services/Tags'
import { environment } from '@/environments'
import './TagManager.scss'

type TagImageMode = 'upload' | 'url'

function resolveTagImageUrl(path: string | null | undefined): string | null {
	if (!path) return null
	if (/^(https?:|data:|blob:)/i.test(path)) return path

	const normalized = path.replace(/\\/g, '/').replace(/^wwwroot\//i, '/')
	if (normalized.startsWith('/')) return `${environment.baseUrl}${normalized}`
	return `${environment.baseUrl}/${normalized}`
}

interface TagManagerProps {
	pokemon: PokemonListItemDto
	isOpen: boolean
	onClose: () => void
	onTagsUpdated: (pokemonId: number, newTags: TagDto[]) => void
	onTagSystemChanged?: () => void
}

export function TagManager({
	pokemon,
	isOpen,
	onClose,
	onTagsUpdated,
	onTagSystemChanged,
}: TagManagerProps) {
	const [allTags, setAllTags] = useState<TagDto[]>([])
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
	const [newTagName, setNewTagName] = useState('')
	const [newTagCategory, setNewTagCategory] = useState<TagCategory>('Uncategorized')
	const [newTagColor, setNewTagColor] = useState('#6b7280')
	const [loading, setLoading] = useState(false)
	const [creatingTag, setCreatingTag] = useState(false)
	const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set())
	const [imageModes, setImageModes] = useState<Record<number, TagImageMode>>({})
	const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
	const [editingImageTagId, setEditingImageTagId] = useState<number | null>(null)

	// Initialize selected tags from pokemon.tags
	useEffect(() => {
		if (pokemon.tags) {
			setSelectedTagIds(pokemon.tags.map((tag) => tag.id))
		}
	}, [pokemon.tags])

	// Load all available tags
	useEffect(() => {
		if (isOpen) {
			loadAllTags()
		}
	}, [isOpen])

	const loadAllTags = async () => {
		try {
			setLoading(true)
			const tags = await getAllTags()
			setAllTags(tags)
		} catch (error) {
			console.error('Error loading tags:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleCreateTag = async () => {
		if (!newTagName.trim()) return

		try {
			setCreatingTag(true)
			const newTag = await createTag({
				name: newTagName.trim(),
				category: newTagCategory !== 'Uncategorized' ? newTagCategory : undefined,
				colorHex: newTagColor !== '#6b7280' ? newTagColor : undefined,
			})
			setAllTags((prev) => [...prev, newTag])
			setSelectedTagIds((prev) => [...prev, newTag.id])
			setNewTagName('')
			setNewTagCategory('Uncategorized')
			setNewTagColor('#6b7280')
			onTagSystemChanged?.()
		} catch (error) {
			console.error('Error creating tag:', error)
			alert('Error creating tag. Make sure the name is unique.')
		} finally {
			setCreatingTag(false)
		}
	}

	const handleDeleteTag = async (tagId: number) => {
		if (
			!confirm('Are you sure you want to delete this tag? This will remove it from all Pokemon.')
		) {
			return
		}

		try {
			await deleteTag(tagId)
			setAllTags((prev) => prev.filter((tag) => tag.id !== tagId))
			setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
			onTagSystemChanged?.()
		} catch (error) {
			console.error('Error deleting tag:', error)
			alert('Error deleting tag.')
		}
	}

	const handleTagToggle = (tagId: number) => {
		setSelectedTagIds((prev) =>
			prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
		)
	}

	const handleImageUpload = async (tagId: number, file: File) => {
		try {
			setUploadingImages((prev) => new Set(prev).add(tagId))
			const updatedTag = await uploadTagImage(tagId, file)
			setAllTags((prev) => prev.map((tag) => (tag.id === tagId ? updatedTag : tag)))
		} catch (error) {
			console.error('Error uploading image:', error)
			alert('Error uploading image. Use PNG, JPG, WebP, or GIF.')
		} finally {
			setUploadingImages((prev) => {
				const newSet = new Set(prev)
				newSet.delete(tagId)
				return newSet
			})
		}
	}

	const handleImageUrlSave = async (tagId: number) => {
		const imageUrl = imageUrls[tagId]?.trim()
		if (!imageUrl) return

		try {
			setUploadingImages((prev) => new Set(prev).add(tagId))
			const updatedTag = await setTagImageUrl(tagId, imageUrl)
			setAllTags((prev) => prev.map((tag) => (tag.id === tagId ? updatedTag : tag)))
			setImageUrls((prev) => ({ ...prev, [tagId]: '' }))
		} catch (error) {
			console.error('Error setting image URL:', error)
			alert('Error setting image URL. Use a complete http:// or https:// URL.')
		} finally {
			setUploadingImages((prev) => {
				const newSet = new Set(prev)
				newSet.delete(tagId)
				return newSet
			})
		}
	}

	const handleRemoveImage = async (tagId: number) => {
		try {
			const updatedTag = await deleteTagImage(tagId)
			setAllTags((prev) => prev.map((tag) => (tag.id === tagId ? updatedTag : tag)))
			setEditingImageTagId(null)
		} catch (error) {
			console.error('Error removing image:', error)
			alert('Error removing image.')
		}
	}

	const handleSave = async () => {
		try {
			setLoading(true)
			await assignTagsToPokemon(pokemon.id, selectedTagIds)

			// Update the pokemon with new tags
			const newTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))
			onTagsUpdated(pokemon.id, newTags)
			onClose()
		} catch (error) {
			console.error('Error saving tags:', error)
			alert('Error saving tags.')
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		onTagSystemChanged?.()
		onClose()
	}

	if (!isOpen) return null

	const selectedCount = selectedTagIds.length
	const pokemonName = pokemon.nickname || pokemon.speciesName || `#${pokemon.speciesId}`
	const hideBrokenImage = (event: SyntheticEvent<HTMLImageElement>) => {
		event.currentTarget.style.display = 'none'
	}

	return (
		<div className='tag-manager-overlay' onClick={handleClose}>
			<div className='tag-manager-modal' onClick={(e) => e.stopPropagation()}>
				<div className='tag-manager-header'>
					<div>
						<h3>Tags</h3>
						<p>
							<strong>{pokemonName}</strong>
							<span>Lv. {pokemon.level}</span>
							{pokemon.isShiny && <span>Shiny</span>}
						</p>
					</div>
					<button className='close-button' onClick={handleClose} aria-label='Close tag manager'>
						×
					</button>
				</div>

				<div className='tag-manager-content'>
					<div className='create-tag-section'>
						<h4>New tag</h4>
						<div className='create-tag-form'>
							<input
								type='text'
								value={newTagName}
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder='Tag name'
								onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
								disabled={creatingTag}
							/>
							<select
								value={newTagCategory}
								onChange={(e) => setNewTagCategory(e.target.value as TagCategory)}
								disabled={creatingTag}>
								<option value='Uncategorized'>Category...</option>
								<option value='Run'>Run</option>
								<option value='Team'>Team</option>
								<option value='Collection'>Collection</option>
								<option value='Personal'>Personal</option>
								<option value='Utility'>Utility</option>
							</select>
							<input
								type='color'
								value={newTagColor}
								onChange={(e) => setNewTagColor(e.target.value)}
								disabled={creatingTag}
								title='Tag color'
							/>
							<button
								onClick={handleCreateTag}
								disabled={!newTagName.trim() || creatingTag}
								className='create-button'>
								{creatingTag ? 'Creating...' : 'Create tag'}
							</button>
						</div>
					</div>

					<div className='existing-tags-section'>
						<div className='tag-section-heading'>
							<h4>Available tags</h4>
							<span>{allTags.length}</span>
						</div>
						{loading ? (
							<div className='loading'>Loading tags...</div>
						) : (
							<div className='tags-grid'>
								{allTags.map((tag) => {
									const selected = selectedTagIds.includes(tag.id)
									const imageEditorOpen = editingImageTagId === tag.id

									return (
										<div
											key={tag.id}
											className={`tag-item ${selected ? 'selected' : ''}`}>
											<button
												type='button'
												className='tag-select-card'
												aria-pressed={selected}
												onClick={() => handleTagToggle(tag.id)}>
												<span className='tag-check'>{selected ? '✓' : ''}</span>
												<span className='tag-visual' style={{ background: tag.colorHex ?? undefined }}>
													{tag.imagePath && (
														<img
															src={resolveTagImageUrl(tag.imagePath) ?? ''}
															alt={tag.name}
															onError={hideBrokenImage}
														/>
													)}
												</span>
												<span className='tag-copy'>
													<span className='tag-name'>{tag.name}</span>
													{tag.category && tag.category !== 'Uncategorized' && (
														<span className='tag-category-badge'>{tag.category}</span>
													)}
												</span>
											</button>

											<div className='tag-card-actions'>
												<button
													type='button'
													className='tag-tool-button'
													aria-expanded={imageEditorOpen}
													onClick={() => setEditingImageTagId(imageEditorOpen ? null : tag.id)}>
													{tag.imagePath ? 'Image' : 'Add image'}
												</button>
												<button
													type='button'
													className='tag-tool-button tag-tool-button--danger'
													onClick={() => handleDeleteTag(tag.id)}
													title='Delete tag'>
													Delete
												</button>
											</div>

											{imageEditorOpen && (
												<div className='tag-image-editor'>
													<div className='tag-image-mode'>
														<button
															type='button'
															className={imageModes[tag.id] !== 'url' ? 'active' : ''}
															onClick={() =>
																setImageModes((prev) => ({ ...prev, [tag.id]: 'upload' }))
															}>
															Upload
														</button>
														<button
															type='button'
															className={imageModes[tag.id] === 'url' ? 'active' : ''}
															onClick={() =>
																setImageModes((prev) => ({ ...prev, [tag.id]: 'url' }))
															}>
															URL
														</button>
													</div>
													{imageModes[tag.id] === 'url' ? (
														<div className='tag-image-url-row'>
															<input
																type='url'
																value={imageUrls[tag.id] ?? ''}
																onChange={(e) =>
																	setImageUrls((prev) => ({ ...prev, [tag.id]: e.target.value }))
																}
																placeholder='https://...'
																disabled={uploadingImages.has(tag.id)}
															/>
															<button
																type='button'
																onClick={() => handleImageUrlSave(tag.id)}
																disabled={uploadingImages.has(tag.id) || !imageUrls[tag.id]?.trim()}>
																Set
															</button>
														</div>
													) : (
														<label className='image-upload-label' title='Upload image'>
															{uploadingImages.has(tag.id) ? 'Uploading...' : 'Choose image'}
															<input
																type='file'
																accept='image/png,image/jpeg,image/webp,image/gif'
																onChange={(e) => {
																	const file = e.target.files?.[0]
																	if (file) handleImageUpload(tag.id, file)
																}}
																disabled={uploadingImages.has(tag.id)}
															/>
														</label>
													)}
													{tag.imagePath && (
														<button
															type='button'
															className='remove-image-button'
															onClick={() => handleRemoveImage(tag.id)}>
															Remove image
														</button>
													)}
												</div>
											)}
										</div>
									)
								})}
							</div>
						)}
					</div>
				</div>

				<div className='tag-manager-footer'>
					<div className='selected-count'>
						{selectedCount === 0
							? 'No tags selected'
							: `${selectedCount} tag${selectedCount !== 1 ? 's' : ''} selected`}
					</div>
					<div className='footer-buttons'>
						<button onClick={handleClose} className='cancel-button'>
							Cancel
						</button>
						<button onClick={handleSave} disabled={loading} className='save-button'>
							{loading ? 'Saving...' : 'Save tags'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
