import { useEffect, useState } from 'react'
import type { DexHuntItem, DexHuntPriority } from '@/services/DexHunts'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import type { SpriteType } from '@/models/enums/SpriteTypes'
import { formatSlugName } from '@/utils/formatSlugName'

interface DexHuntTargetRowProps {
	item: DexHuntItem
	spriteType: SpriteType
	canMove: boolean
	isFirst: boolean
	isLast: boolean
	busy: boolean
	onToggle: (item: DexHuntItem) => void
	onPriority: (item: DexHuntItem, priority: DexHuntPriority) => void
	onNotes: (item: DexHuntItem, notes: string | null) => void
	onMove: (item: DexHuntItem, direction: -1 | 1) => void
	onDelete: (item: DexHuntItem) => void
}

export function DexHuntTargetRow({ item, spriteType, canMove, isFirst, isLast, busy, onToggle, onPriority, onNotes, onMove, onDelete }: DexHuntTargetRowProps) {
	const [notes, setNotes] = useState(item.notes ?? '')
	useEffect(() => setNotes(item.notes ?? ''), [item.id, item.notes])
	const sprite = getPreferredSpriteFromDto(item.sprites, spriteType)

	return (
		<article className={`dex-hunt-target${item.isCaught ? ' is-caught' : ''}`}>
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
				<button type='button' disabled={!canMove || isFirst || busy} onClick={() => onMove(item, -1)} aria-label={`Move ${item.speciesName} up`}>↑</button>
				<button type='button' disabled={!canMove || isLast || busy} onClick={() => onMove(item, 1)} aria-label={`Move ${item.speciesName} down`}>↓</button>
				<button type='button' className='is-danger' disabled={busy} onClick={() => onDelete(item)} aria-label={`Remove ${item.speciesName}`}>×</button>
			</div>
		</article>
	)
}
