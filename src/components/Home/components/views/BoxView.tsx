import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from '@dnd-kit/core'
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type {
	PokemonBoxDetailDto,
	PokemonBoxSummaryDto,
	PokemonListItemDto,
} from '@/models/api/types'
import { getPokemonList } from '@/services/Pokemon'
import { getPreferredSpriteFromDto, resolveSpriteUrl } from '@/utils/spriteUtils'
import { useUISettings } from '@/hooks/useUISettings'
import { environment } from '@/environments'

interface ProcessedPokemon {
	pokemon: PokemonListItemDto
	sprite: string | undefined
	type1?: string
	type2?: string
}

interface BoxViewProps {
	boxes: PokemonBoxSummaryDto[]
	selectedBox: PokemonBoxDetailDto | null
	processedPokemon: ProcessedPokemon[]
	activeBoxId: number | null
	loading: boolean
	onSelectBox: (id: number) => void
	onCreateBox: () => void
	onDeleteBox: (id: number) => void
	onMovePokemon: (pokemonId: number, boxId: number, slotIndex: number) => Promise<void>
	onClearSlot: (boxId: number, slotIndex: number) => Promise<void>
	onRenameBox: (id: number, name: string) => Promise<void>
	onReorderBoxes: (newOrder: PokemonBoxSummaryDto[]) => Promise<void>
	onClearBox: (id: number) => Promise<void>
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
}

const BOX_SIZE = 30

const BULBAPEDIA_FORM_SUFFIX: Record<string, string> = {
	alolan: 'A',
	galarian: 'G',
	hisuian: 'H',
	paldean: 'P',
}

function bulbapediaMenuUrl(
	base: string,
	speciesId: number,
	formName: string,
	shiny = false
): string {
	const paddedId = String(speciesId).padStart(4, '0')
	const suffix = BULBAPEDIA_FORM_SUFFIX[formName.toLowerCase()] ?? ''
	const shinySuffix = shiny ? 's' : ''
	return `${base}/sprites/bulbapedia/${speciesId}/68px-Menu_HOME_${paddedId}${suffix}${shinySuffix}.png`
}

/** Priority: bulbapedia menu → homeShiny/home → in-game icon → Scarlet-Violet → official → default */
function BoxSprite({ pokemon }: { pokemon: PokemonListItemDto }) {
	const [idx, setIdx] = useState(0)
	const { boxIconStyle } = useUISettings()
	const s = pokemon.sprites
	const shiny = pokemon.isShiny
	const id = pokemon.speciesId
	const base = environment.baseUrl

	const urls = useMemo(() => {
		const form = pokemon.formName ?? ''
		const chain: Array<string | null | undefined> = [
			boxIconStyle === 'bulbapedia' && shiny ? bulbapediaMenuUrl(base, id, form, true) : null,
			boxIconStyle === 'bulbapedia' ? bulbapediaMenuUrl(base, id, form, false) : null,
			shiny ? resolveSpriteUrl(s?.homeShiny) : null,
			resolveSpriteUrl(s?.home),
			shiny ? `${base}/sprites/pokemon/version/${id}/icons/shiny.png` : null,
			`${base}/sprites/pokemon/version/${id}/icons/front.png`,
			shiny ? `${base}/sprites/pokemon/version/${id}/scarlet-violet/shiny.png` : null,
			`${base}/sprites/pokemon/version/${id}/scarlet-violet/front.png`,
			shiny ? resolveSpriteUrl(s?.officialShiny) : null,
			resolveSpriteUrl(s?.official),
			resolveSpriteUrl(s?.default),
		]
		// deduplicate while preserving order
		const seen = new Set<string>()
		return chain.filter(
			(u): u is string => Boolean(u) && !seen.has(u!) && seen.add(u!) !== undefined
		)
	}, [s, shiny, id, base, boxIconStyle])

	// reset fallback index when URL list changes (e.g. setting toggled)
	useEffect(() => setIdx(0), [urls])

	if (idx >= urls.length) return <span className='box-organizer__sprite-fallback'>?</span>

	return (
		<img
			src={urls[idx]}
			alt={pokemon.nickname || pokemon.speciesName}
			onError={() => setIdx((i) => i + 1)}
		/>
	)
}

function DraggablePokemon({
	pokemonId,
	children,
}: {
	pokemonId: number
	children: React.ReactNode
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `pokemon-${pokemonId}`,
		data: { pokemonId },
	})

	return (
		<div
			ref={setNodeRef}
			style={{ opacity: isDragging ? 0 : 1 }}
			className='box-organizer__draggable'
			{...listeners}
			{...attributes}>
			{children}
		</div>
	)
}

function Slot({
	index,
	pokemon,
	activeBoxId,
	onPokemonClick,
	onManageTags,
	onClearSlot,
}: {
	index: number
	pokemon?: PokemonListItemDto
	activeBoxId: number
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	onClearSlot: (boxId: number, slotIndex: number) => Promise<void>
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `slot-${index}`,
		data: { slotIndex: index },
	})

	return (
		<div
			ref={setNodeRef}
			className={`box-organizer__slot ${isOver ? 'box-organizer__slot--over' : ''} ${
				pokemon ? 'box-organizer__slot--filled' : 'box-organizer__slot--empty'
			}`}>
			<span className='box-organizer__slot-number'>{index + 1}</span>
			{pokemon && (
				<DraggablePokemon pokemonId={pokemon.id}>
					<button
						type='button'
						className='box-organizer__slot-card'
						onClick={() => onPokemonClick?.(pokemon)}
						title={pokemon.nickname || pokemon.speciesName}>
						<BoxSprite key={pokemon.id} pokemon={pokemon} />
						<span className='box-organizer__slot-name'>
							{pokemon.nickname || pokemon.speciesName}
						</span>
					</button>
					<div className='box-organizer__slot-actions'>
						<button type='button' onClick={() => onManageTags(pokemon)}>
							Tags
						</button>
						<button type='button' onClick={() => onClearSlot(activeBoxId, index)}>
							Clear
						</button>
					</div>
				</DraggablePokemon>
			)}
		</div>
	)
}

function PoolPokemon({
	pokemon,
	sprite,
	onPokemonClick,
	onManageTags,
}: {
	pokemon: PokemonListItemDto
	sprite: string | undefined
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
}) {
	return (
		<DraggablePokemon pokemonId={pokemon.id}>
			<div className='box-organizer__pool-row'>
				<button type='button' onClick={() => onPokemonClick?.(pokemon)}>
					{sprite ? (
						<img src={sprite} alt={pokemon.nickname || pokemon.speciesName} />
					) : (
						<span className='box-organizer__sprite-fallback'>?</span>
					)}
					<span>
						<strong>
							{!pokemon.isBoxed && (
								<span className='box-organizer__unboxed-badge' title='Not in any box'>
									●
								</span>
							)}
							{pokemon.nickname || pokemon.speciesName}
						</strong>
						<small>
							#{String(pokemon.speciesId).padStart(3, '0')} · Lv.{pokemon.level}
						</small>
					</span>
				</button>
				<button type='button' onClick={() => onManageTags(pokemon)}>
					Tags
				</button>
			</div>
		</DraggablePokemon>
	)
}

function SortableBoxItem({
	box,
	isActive,
	isExpanded,
	editName,
	onSelect,
	onToggle,
	onEditNameChange,
	onSubmitRename,
	onCancelExpand,
}: {
	box: PokemonBoxSummaryDto
	isActive: boolean
	isExpanded: boolean
	editName: string
	onSelect: () => void
	onToggle: () => void
	onEditNameChange: (v: string) => void
	onSubmitRename: () => void
	onCancelExpand: () => void
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: box.id,
	})
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	}
	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`box-organizer__box-item${isExpanded ? ' box-organizer__box-item--expanded' : ''}`}>
			<div className={`box-organizer__box-tab${isActive ? ' box-organizer__box-tab--active' : ''}`}>
				<button
					type='button'
					className='box-organizer__box-drag'
					{...listeners}
					{...attributes}
					tabIndex={-1}
					title='Drag to reorder'>
					⠿
				</button>
				<button type='button' className='box-organizer__box-select' onClick={onSelect}>
					<span>{box.name}</span>
					<small>{box.pokemonCount}/30</small>
				</button>
				<button
					type='button'
					className='box-organizer__box-chevron'
					onClick={onToggle}
					title={isExpanded ? 'Collapse' : 'Expand'}>
					{isExpanded ? '▲' : '▼'}
				</button>
			</div>
			{isExpanded && (
				<div className='box-organizer__box-expanded'>
					<input
						className='box-organizer__box-rename'
						value={editName}
						autoFocus
						placeholder='Box name…'
						onChange={(e) => onEditNameChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') onSubmitRename()
							if (e.key === 'Escape') onCancelExpand()
						}}
					/>
					<button type='button' className='box-organizer__box-rename-save' onClick={onSubmitRename}>
						Save
					</button>
				</div>
			)}
		</div>
	)
}

export const BoxView = ({
	boxes,
	selectedBox,
	activeBoxId,
	loading,
	onSelectBox,
	onCreateBox,
	onDeleteBox,
	onMovePokemon,
	onClearSlot,
	onRenameBox,
	onReorderBoxes,
	onClearBox,
	onPokemonClick,
	onManageTags,
}: BoxViewProps) => {
	const { spriteType, boxIconStyle } = useUISettings()
	const [movingPokemonId, setMovingPokemonId] = useState<number | null>(null)
	const [showPool, setShowPool] = useState(false)
	const [activeDragId, setActiveDragId] = useState<number | null>(null)
	const [poolSearch, setPoolSearch] = useState('')
	const [poolResults, setPoolResults] = useState<PokemonListItemDto[]>([])
	const [poolLoading, setPoolLoading] = useState(false)
	const [expandedBoxId, setExpandedBoxId] = useState<number | null>(null)
	const [editName, setEditName] = useState('')
	const [showUnboxedOnly, setShowUnboxedOnly] = useState(false)
	const [isClearingBox, setIsClearingBox] = useState(false)
	const [isAddingAll, setIsAddingAll] = useState(false)
	const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set())
	const gridSensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
	)
	const sortSensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
	)

	const fetchPool = useCallback(async () => {
		setPoolLoading(true)
		try {
			const result = await getPokemonList({ Take: 500, Skip: 0 })
			setPoolResults(result.items ?? [])
		} catch (err) {
			console.error('Failed to load pool:', err)
		} finally {
			setPoolLoading(false)
		}
	}, [])

	useEffect(() => {
		if (showPool) fetchPool()
	}, [showPool])

	const slotsByIndex = useMemo(() => {
		const map = new Map<number, PokemonListItemDto>()
		selectedBox?.slots.forEach((slot) => map.set(slot.slotIndex, slot.pokemon))
		return map
	}, [selectedBox])

	const boxPokemonIds = useMemo(() => {
		const ids = new Set<number>()
		selectedBox?.slots.forEach((slot) => ids.add(slot.pokemon.id))
		return ids
	}, [selectedBox])

	const filteredPoolResults = useMemo(() => {
		const q = poolSearch.trim().toLowerCase()
		return poolResults.filter((p) => {
			if (boxPokemonIds.has(p.id)) return false
			if (showUnboxedOnly && p.isBoxed) return false
			if (selectedTagIds.size > 0 && !p.tags?.some((t) => selectedTagIds.has(t.id))) return false
			if (!q) return true
			if (p.speciesName.toLowerCase().includes(q)) return true
			if (p.nickname && p.nickname.toLowerCase().includes(q)) return true
			if (p.tags?.some((t) => t.name.toLowerCase().includes(q))) return true
			return false
		})
	}, [poolResults, boxPokemonIds, poolSearch, showUnboxedOnly, selectedTagIds])

	const availableTags = useMemo(() => {
		const map = new Map<number, { id: number; name: string; colorHex?: string | null }>()
		poolResults.forEach((p) => p.tags?.forEach((t) => map.set(t.id, t)))
		return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
	}, [poolResults])

	const toggleTag = useCallback((id: number) => {
		setSelectedTagIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}, [])

	const spritesByPokemonId = useMemo(() => {
		const map = new Map<number, string | undefined>()
		selectedBox?.slots.forEach((slot) => {
			const p = slot.pokemon
			let url: string | undefined
			if (boxIconStyle === 'bulbapedia') {
				url = bulbapediaMenuUrl(environment.baseUrl, p.speciesId, p.formName ?? '', p.isShiny)
			} else {
				url =
					(p.isShiny
						? resolveSpriteUrl(p.sprites?.homeShiny)
						: resolveSpriteUrl(p.sprites?.home)) ?? undefined
			}
			map.set(p.id, url)
		})
		return map
	}, [selectedBox, boxIconStyle])

	const toggleExpand = useCallback(
		(id: number) => {
			if (expandedBoxId === id) {
				setExpandedBoxId(null)
			} else {
				const box = boxes.find((b) => b.id === id)
				setEditName(box?.name ?? '')
				setExpandedBoxId(id)
			}
		},
		[expandedBoxId, boxes]
	)

	const submitRename = useCallback(async () => {
		if (expandedBoxId === null) return
		const trimmed = editName.trim()
		const box = boxes.find((b) => b.id === expandedBoxId)
		setExpandedBoxId(null)
		if (!trimmed || !box || trimmed === box.name) return
		await onRenameBox(expandedBoxId, trimmed)
	}, [expandedBoxId, editName, boxes, onRenameBox])

	const handleSidebarDragEnd = useCallback(
		async (event: DragEndEvent) => {
			const { active, over } = event
			if (!over || active.id === over.id) return
			const oldIndex = boxes.findIndex((b) => b.id === active.id)
			const newIndex = boxes.findIndex((b) => b.id === over.id)
			if (oldIndex === -1 || newIndex === -1) return
			await onReorderBoxes(arrayMove(boxes, oldIndex, newIndex))
		},
		[boxes, onReorderBoxes]
	)

	const handleClearBox = useCallback(async () => {
		if (!selectedBox || isClearingBox) return
		setIsClearingBox(true)
		try {
			await onClearBox(selectedBox.id)
		} finally {
			setIsClearingBox(false)
		}
	}, [selectedBox, isClearingBox, onClearBox])

	const handleAddAll = useCallback(async () => {
		if (!selectedBox || isAddingAll) return
		const emptySlots: number[] = []
		for (let i = 0; i < BOX_SIZE; i++) {
			if (!slotsByIndex.has(i)) emptySlots.push(i)
		}
		if (emptySlots.length === 0) return
		const toAdd = filteredPoolResults.slice(0, emptySlots.length)
		setIsAddingAll(true)
		try {
			for (let i = 0; i < toAdd.length; i++) {
				await onMovePokemon(toAdd[i].id, selectedBox.id, emptySlots[i])
			}
		} finally {
			setIsAddingAll(false)
		}
	}, [selectedBox, isAddingAll, slotsByIndex, filteredPoolResults, onMovePokemon])

	const handleDragStart = (event: DragStartEvent) => {
		const pokemonId = event.active.data.current?.pokemonId as number | undefined
		if (pokemonId != null) setActiveDragId(pokemonId)
	}

	const handleDragEnd = async (event: DragEndEvent) => {
		setActiveDragId(null)
		const pokemonId = event.active.data.current?.pokemonId as number | undefined
		const slotIndex = event.over?.data.current?.slotIndex as number | undefined
		if (!pokemonId || slotIndex == null || !selectedBox) return

		setMovingPokemonId(pokemonId)
		try {
			await onMovePokemon(pokemonId, selectedBox.id, slotIndex)
		} finally {
			setMovingPokemonId(null)
		}
	}

	const handleDragCancel = () => setActiveDragId(null)

	const selectedCanBeDeleted = Boolean(
		selectedBox && selectedBox.pokemonCount === 0 && boxes.length > 1
	)

	const activeDragSprite = useMemo(() => {
		if (activeDragId == null) return undefined
		const fromSlot = spritesByPokemonId.get(activeDragId)
		if (fromSlot) return fromSlot
		const fromPool = filteredPoolResults.find((p) => p.id === activeDragId)
		if (fromPool)
			return getPreferredSpriteFromDto(fromPool.sprites, spriteType, fromPool.isShiny) || undefined
		return undefined
	}, [activeDragId, spritesByPokemonId, filteredPoolResults, spriteType])

	return (
		<div className='box-organizer'>
			<DndContext sensors={sortSensors} onDragEnd={handleSidebarDragEnd}>
				<SortableContext items={boxes.map((b) => b.id)} strategy={verticalListSortingStrategy}>
					<aside className='box-organizer__sidebar'>
						<div className='box-organizer__sidebar-header'>
							<span>Boxes</span>
							<button type='button' onClick={onCreateBox}>
								+ Box
							</button>
						</div>
						<div className='box-organizer__box-list'>
							{boxes.map((box) => (
								<SortableBoxItem
									key={box.id}
									box={box}
									isActive={box.id === activeBoxId}
									isExpanded={expandedBoxId === box.id}
									editName={editName}
									onSelect={() => onSelectBox(box.id)}
									onToggle={() => toggleExpand(box.id)}
									onEditNameChange={setEditName}
									onSubmitRename={submitRename}
									onCancelExpand={() => setExpandedBoxId(null)}
								/>
							))}
						</div>
						{selectedBox && (
							<button
								type='button'
								className='box-organizer__delete-box'
								disabled={!selectedCanBeDeleted}
								onClick={() => onDeleteBox(selectedBox.id)}>
								Delete empty box
							</button>
						)}
					</aside>
				</SortableContext>
			</DndContext>

			<main className='box-organizer__board'>
				<div className='box-organizer__board-header'>
					<div>
						<h2>{selectedBox?.name || 'Boxes'}</h2>
						{selectedBox && (
							<p className='box-organizer__board-meta'>
								{selectedBox.pokemonCount}/30 · {boxes.length} box{boxes.length !== 1 ? 'es' : ''}
							</p>
						)}
					</div>
					<div className='box-organizer__board-actions'>
						{movingPokemonId && <span className='box-organizer__status'>Moving...</span>}
						{selectedBox && selectedBox.pokemonCount > 0 && (
							<button
								type='button'
								className='box-organizer__pool-toggle'
								disabled={isClearingBox}
								onClick={handleClearBox}>
								{isClearingBox ? 'Clearing…' : 'Clear box'}
							</button>
						)}
						<button
							type='button'
							className={`box-organizer__pool-toggle${showPool ? ' box-organizer__pool-toggle--active' : ''}`}
							onClick={() => setShowPool((v) => !v)}>
							{showPool ? 'Hide pool' : 'Show pool'}
						</button>
					</div>
				</div>

				<DndContext
					sensors={gridSensors}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onDragCancel={handleDragCancel}>
					<div className='box-organizer__grid' aria-busy={loading}>
						{loading
							? Array.from({ length: BOX_SIZE }, (_, i) => (
									<div key={i} className='box-organizer__slot box-organizer__slot--skeleton' />
								))
							: Array.from({ length: BOX_SIZE }, (_, index) => {
									const pokemon = slotsByIndex.get(index)
									return (
										<Slot
											key={index}
											index={index}
											activeBoxId={selectedBox?.id || 0}
											pokemon={pokemon}
											onPokemonClick={onPokemonClick}
											onManageTags={onManageTags}
											onClearSlot={onClearSlot}
										/>
									)
								})}
					</div>

					{showPool && (
						<section className='box-organizer__pool'>
							<div className='box-organizer__pool-header'>
								<span>Pokémon pool</span>
								<div className='box-organizer__pool-header-actions'>
									<button
										type='button'
										className={`box-organizer__pool-toggle${showUnboxedOnly ? ' box-organizer__pool-toggle--active' : ''}`}
										onClick={() => setShowUnboxedOnly((v) => !v)}>
										{showUnboxedOnly ? '● Unboxed only' : 'Unboxed only'}
									</button>
									<button
										type='button'
										className='box-organizer__pool-toggle'
										disabled={isAddingAll || !selectedBox || filteredPoolResults.length === 0}
										onClick={handleAddAll}>
										{isAddingAll ? 'Adding…' : 'Add all'}
									</button>
								</div>
							</div>
							<div className='box-organizer__pool-search'>
								<input
									type='search'
									placeholder='Search by name, nickname…'
									value={poolSearch}
									onChange={(e) => setPoolSearch(e.target.value)}
								/>
								{poolLoading && <span className='box-organizer__pool-loading'>Loading…</span>}
							</div>
							{availableTags.length > 0 && (
								<div className='box-organizer__tag-chips'>
									{availableTags.map((tag) => (
										<button
											type='button'
											key={tag.id}
											className={`box-organizer__tag-chip${selectedTagIds.has(tag.id) ? ' box-organizer__tag-chip--active' : ''}`}
											onClick={() => toggleTag(tag.id)}>
											{tag.colorHex && (
												<span
													className='box-organizer__tag-chip-dot'
													style={{ background: tag.colorHex }}
												/>
											)}
											{tag.name}
										</button>
									))}
								</div>
							)}
							<div className='box-organizer__pool-list'>
								{!poolLoading && filteredPoolResults.length === 0 && (
									<p className='box-organizer__empty'>No Pokémon match the search.</p>
								)}
								{filteredPoolResults.map((p) => (
									<PoolPokemon
										key={p.id}
										pokemon={p}
										sprite={
											getPreferredSpriteFromDto(p.sprites, spriteType, p.isShiny) || undefined
										}
										onPokemonClick={onPokemonClick}
										onManageTags={onManageTags}
									/>
								))}
							</div>
						</section>
					)}

					<DragOverlay>
						{activeDragId != null && (
							<div className='box-organizer__drag-overlay'>
								{activeDragSprite ? (
									<img src={activeDragSprite} alt='' />
								) : (
									<span className='box-organizer__sprite-fallback'>?</span>
								)}
							</div>
						)}
					</DragOverlay>
				</DndContext>
			</main>
		</div>
	)
}
