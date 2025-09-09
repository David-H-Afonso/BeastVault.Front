import { useState, useEffect } from 'react'
import type { TagDto, PokemonListItemDto } from '../../../models/api/types'
import {
	getAllTags,
	createTag,
	deleteTag,
	assignTagsToPokemon,
	uploadTagImage,
	deleteTagImage,
} from '../../../services/Tags'
import './TagManager.scss'

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
	const [loading, setLoading] = useState(false)
	const [creatingTag, setCreatingTag] = useState(false)
	const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set())

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
			const newTag = await createTag({ name: newTagName.trim() })
			setAllTags((prev) => [...prev, newTag])
			setSelectedTagIds((prev) => [...prev, newTag.id])
			setNewTagName('')
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
			alert('Error uploading image. Make sure it is a PNG file.')
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

	return (
		<div className='tag-manager-overlay' onClick={handleClose}>
			<div className='tag-manager-modal' onClick={(e) => e.stopPropagation()}>
				<div className='tag-manager-header'>
					<h3>🏷️ Manage Tags</h3>
					<p>
						<strong>{pokemon.nickname || `${pokemon.speciesId}`}</strong> - Level {pokemon.level}
						{pokemon.isShiny && <span className='shiny-indicator'>✨</span>}
					</p>
					<button className='close-button' onClick={handleClose}>
						×
					</button>
				</div>

				<div className='tag-manager-content'>
					{/* Create New Tag */}
					<div className='create-tag-section'>
						<h4>Create New Tag</h4>
						<div className='create-tag-form'>
							<input
								type='text'
								value={newTagName}
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder='Enter tag name...'
								onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
								disabled={creatingTag}
							/>
							<button
								onClick={handleCreateTag}
								disabled={!newTagName.trim() || creatingTag}
								className='create-button'>
								{creatingTag ? '⏳' : '➕'} Create
							</button>
						</div>
					</div>

					{/* Existing Tags */}
					<div className='existing-tags-section'>
						<h4>Available Tags ({allTags.length})</h4>
						{loading ? (
							<div className='loading'>Loading tags...</div>
						) : (
							<div className='tags-grid'>
								{allTags.map((tag) => (
									<div
										key={tag.id}
										className={`tag-item ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}>
										<div className='tag-content' onClick={() => handleTagToggle(tag.id)}>
											{tag.imagePath && (
												<img src={`${tag.imagePath}`} alt={tag.name} className='tag-image' />
											)}
											<span className='tag-name'>{tag.name}</span>
											{selectedTagIds.includes(tag.id) && (
												<span className='selected-indicator'>✓</span>
											)}
										</div>

										<div className='tag-actions'>
											<label className='image-upload-label'>
												📷
												<input
													type='file'
													accept='.png'
													onChange={(e) => {
														const file = e.target.files?.[0]
														if (file) handleImageUpload(tag.id, file)
													}}
													disabled={uploadingImages.has(tag.id)}
												/>
											</label>

											{tag.imagePath && (
												<button
													className='remove-image-button'
													onClick={() => handleRemoveImage(tag.id)}
													title='Remove image'>
													🗑️
												</button>
											)}

											<button
												className='delete-tag-button'
												onClick={() => handleDeleteTag(tag.id)}
												title='Delete tag'>
												❌
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className='tag-manager-footer'>
					<div className='selected-count'>
						{selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
					</div>
					<div className='footer-buttons'>
						<button onClick={handleClose} className='cancel-button'>
							Cancel
						</button>
						<button onClick={handleSave} disabled={loading} className='save-button'>
							{loading ? '⏳ Saving...' : '💾 Save Tags'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
