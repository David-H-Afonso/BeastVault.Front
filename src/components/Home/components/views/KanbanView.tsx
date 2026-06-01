import { useState, useCallback } from 'react'
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PokemonListItemDto } from '@/models/api/types'
import { assignTagsToPokemon } from '@/services/Tags'

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

interface KanbanViewProps {
	processedPokemon: ProcessedPokemon[]
	groupedPokemon: GroupedPokemon
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onDelete: (id: number) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	loading: boolean
	dragMode?: 'move' | 'copy'
	onTagsChanged?: () => void
}

const KanbanCard = ({
	pokemon,
	sprite,
	onClick,
}: {
	pokemon: PokemonListItemDto
	sprite?: string
	onClick?: (pokemon: PokemonListItemDto) => void
}) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `pokemon-${pokemon.id}`,
		data: { pokemon },
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`kanban-view__card ${isDragging ? 'kanban-view__card--dragging' : ''}`}
			onClick={() => {
				// Only fire click if not dragging
				if (!isDragging) onClick?.(pokemon)
			}}>
			<div className='kanban-view__card-sprite'>
				{sprite ? (
					<img src={sprite} alt={pokemon.nickname || pokemon.speciesName} />
				) : (
					<span style={{ fontSize: '1.2rem', opacity: 0.5 }}>?</span>
				)}
			</div>
			<div className='kanban-view__card-info'>
				<div className='kanban-view__card-name'>{pokemon.nickname || pokemon.speciesName}</div>
				<div className='kanban-view__card-meta'>
					Lv.{pokemon.level} {pokemon.isShiny ? '★' : ''}
				</div>
			</div>
		</div>
	)
}

export const KanbanView = ({
	processedPokemon,
	groupedPokemon,
	onPokemonClick,
	dragMode = 'move',
	onTagsChanged,
}: KanbanViewProps) => {
	const { grouped, untagged } = groupedPokemon
	const [saving, setSaving] = useState(false)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	)

	const columns = [
		...Object.entries(grouped).map(([tagName, pokemonList]) => ({
			id: tagName,
			title: tagName,
			pokemon: pokemonList,
		})),
		...(untagged.length > 0 ? [{ id: 'untagged', title: 'No Tags', pokemon: untagged }] : []),
	]

	// Build a map of tag name -> tag id from available pokemon tags
	const tagNameToId = new Map<string, number>()
	for (const col of columns) {
		for (const p of col.pokemon) {
			if (p.tags) {
				for (const t of p.tags) {
					tagNameToId.set(t.name, t.id)
				}
			}
		}
	}

	const findColumnForPokemon = (pokemonId: number): string | null => {
		for (const col of columns) {
			if (col.pokemon.some((p) => p.id === pokemonId)) {
				return col.id
			}
		}
		return null
	}

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			const { active, over } = event
			if (!over) return

			// Extract pokemon ID from the sortable id
			const pokemonIdStr = String(active.id).replace('pokemon-', '')
			const pokemonId = Number(pokemonIdStr)
			if (isNaN(pokemonId)) return

			// Determine source column
			const sourceCol = findColumnForPokemon(pokemonId)
			if (!sourceCol) return

			// Determine target column — could be dropping on another card or column droppable
			let targetCol: string | null = null
			const overId = String(over.id)
			if (overId.startsWith('pokemon-')) {
				// Dropped on another card — find which column it belongs to
				const targetPokemonId = Number(overId.replace('pokemon-', ''))
				targetCol = findColumnForPokemon(targetPokemonId)
			} else {
				targetCol = overId
			}

			if (!targetCol || sourceCol === targetCol) return

			// Find the pokemon to get its current tags
			const pokemon = columns.flatMap((c) => c.pokemon).find((p) => p.id === pokemonId)
			if (!pokemon) return

			// Calculate new tag IDs
			const currentTagIds = (pokemon.tags || []).map((t) => t.id)
			const sourceTagId = tagNameToId.get(sourceCol)
			const targetTagId = tagNameToId.get(targetCol)

			let newTagIds: number[]
			if (dragMode === 'move') {
				// Remove source tag, add target tag
				newTagIds = currentTagIds.filter((id) => id !== sourceTagId)
				if (targetTagId && !newTagIds.includes(targetTagId)) {
					newTagIds.push(targetTagId)
				}
			} else {
				// Copy: keep source tag, add target tag
				newTagIds = [...currentTagIds]
				if (targetTagId && !newTagIds.includes(targetTagId)) {
					newTagIds.push(targetTagId)
				}
			}

			// If target is "untagged", remove all tags
			if (targetCol === 'untagged') {
				newTagIds = []
			}

			setSaving(true)
			try {
				await assignTagsToPokemon(pokemonId, newTagIds)
				onTagsChanged?.()
			} catch (err) {
				console.error('Failed to update tags:', err)
			} finally {
				setSaving(false)
			}
		},
		[columns, tagNameToId, dragMode, onTagsChanged]
	)

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			{saving && (
				<div
					style={{
						position: 'fixed',
						top: 8,
						right: 8,
						padding: '4px 12px',
						background: 'var(--color-primary)',
						color: '#fff',
						borderRadius: 6,
						fontSize: '0.75rem',
						zIndex: 100,
					}}>
					Saving...
				</div>
			)}
			<div className='kanban-view'>
				{columns.map((column) => (
					<div key={column.id} className='kanban-view__column'>
						<div className='kanban-view__column-header'>
							<span className='kanban-view__column-title'>{column.title}</span>
							<span className='kanban-view__column-count'>{column.pokemon.length}</span>
						</div>
						<SortableContext
							items={column.pokemon.map((p) => `pokemon-${p.id}`)}
							strategy={verticalListSortingStrategy}>
							<div className='kanban-view__column-body'>
								{column.pokemon.length === 0 ? (
									<div className='kanban-view__empty'>No Pokémon</div>
								) : (
									column.pokemon.map((p) => {
										const data = processedPokemon.find((item) => item.pokemon.id === p.id)
										return (
											<KanbanCard
												key={p.id}
												pokemon={p}
												sprite={data?.sprite}
												onClick={onPokemonClick}
											/>
										)
									})
								)}
							</div>
						</SortableContext>
					</div>
				))}
			</div>
		</DndContext>
	)
}
