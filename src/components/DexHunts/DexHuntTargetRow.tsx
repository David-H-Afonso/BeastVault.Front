import { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DexHuntItem, DexHuntPriority } from '@/services/DexHunts'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import type { SpriteType } from '@/models/enums/SpriteTypes'
import { formatSlugName } from '@/utils/formatSlugName'

interface DexHuntTargetRowProps {
	item: DexHuntItem
	spriteType: SpriteType
	canMove: boolean
	busy: boolean
	onToggle: (item: DexHuntItem) => void
	onPriority: (item: DexHuntItem, priority: DexHuntPriority) => void
	onNotes: (item: DexHuntItem, notes: string | null) => void
	onDelete: (item: DexHuntItem) => void
	view: 'cards' | 'rows'
}

export function DexHuntTargetRow({ item, spriteType, busy, canMove, onToggle, onPriority, onNotes, onDelete, view }: DexHuntTargetRowProps) {
	const [notes, setNotes] = useState(item.notes ?? '')
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !canMove })
	useEffect(() => setNotes(item.notes ?? ''), [item.id, item.notes])
	const sprite = getPreferredSpriteFromDto(item.sprites, spriteType)

	return (
		<article
			ref={setNodeRef}
			className={`dex-hunt-target dex-hunt-target--${view}${item.isCaught ? ' is-caught' : ''}${isDragging ? ' is-dragging' : ''}`}
			style={{ transform: CSS.Transform.toString(transform), transition }}>
			<button
				className='dex-hunt-target__drag'
				type='button'
				{...attributes}
				{...listeners}
				aria-label={`Drag to reorder ${item.speciesName}`}
				title='Drag to reorder'>
				<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' aria-hidden='true'>
					<circle cx='9' cy='5' r='1' fill='currentColor' /><circle cx='15' cy='5' r='1' fill='currentColor' />
					<circle cx='9' cy='12' r='1' fill='currentColor' /><circle cx='15' cy='12' r='1' fill='currentColor' />
					<circle cx='9' cy='19' r='1' fill='currentColor' /><circle cx='15' cy='19' r='1' fill='currentColor' />
				</svg>
			</button>
			<label className='dex-hunt-target__check'>
				<input type='checkbox' checked={item.isCaught} disabled={busy} onChange={() => onToggle(item)} />
				<span aria-hidden='true'>✓</span>
				<b className='sr-only'>{item.isCaught ? `Mark ${item.speciesName} as wanted` : `Mark ${item.speciesName} as caught`}</b>
			</label>
			<div className='dex-hunt-target__sprite'>
				{sprite ? <img src={sprite} alt='' loading='lazy' /> : <span>#{item.speciesId}</span>}
			</div>
			<div className='dex-hunt-target__identity'>
				<span className='dex-hunt-target__number'>#{String(item.speciesId).padStart(4, '0')} · Gen {item.generation}</span>
				<strong>{formatSlugName(item.speciesName)}</strong>
				<div className='dex-hunt-target__types'>{item.types.map((type) => <span key={type} className={`type-${type}`}>{formatSlugName(type)}</span>)}</div>
			</div>
			{view === 'cards' && <span className='dex-hunt-target__status'>{item.isCaught ? 'Caught' : 'Wanted'}</span>}
			<label className='dex-hunt-target__priority'>
				<span>Priority</span>
				<select value={item.priority} disabled={busy} onChange={(event) => onPriority(item, Number(event.target.value) as DexHuntPriority)} aria-label={`Priority for ${item.speciesName}`}>
					<option value={0}>Low</option>
					<option value={1}>Normal</option>
					<option value={2}>High</option>
				</select>
			</label>
			<label className='dex-hunt-target__notes'>
				<span className='sr-only'>Notes for {item.speciesName}</span>
				<input
					value={notes}
					maxLength={500}
					placeholder='Location, trade, method…'
					onChange={(event) => setNotes(event.target.value)}
					onBlur={() => notes.trim() !== (item.notes ?? '') && onNotes(item, notes.trim() || null)}
				/>
			</label>
			<div className='dex-hunt-target__actions'>
				<button type='button' className='is-danger' disabled={busy} onClick={() => onDelete(item)} aria-label={`Remove ${item.speciesName}`}>×</button>
			</div>
		</article>
	)
}
