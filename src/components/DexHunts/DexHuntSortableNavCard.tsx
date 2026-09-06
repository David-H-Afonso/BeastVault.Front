import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DexHuntListSummary } from '@/services/DexHunts'

interface DexHuntSortableNavCardProps {
	list: DexHuntListSummary
	active: boolean
	onSelect: () => void
}

export function DexHuntSortableNavCard({ list, active, onSelect }: DexHuntSortableNavCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id })
	const percent = list.totalCount ? Math.round((list.caughtCount / list.totalCount) * 100) : 0

	return (
		<div
			ref={setNodeRef}
			className={`dex-hunt-nav-card${active ? ' is-active' : ''}${isDragging ? ' is-dragging' : ''}`}
			style={{ transform: CSS.Transform.toString(transform), transition }}>
			<button className='dex-hunt-nav-card__main' type='button' onClick={onSelect} aria-current={active ? 'page' : undefined}>
				<span className='dex-hunt-nav-card__game'>{list.gameName}</span>
				<strong>{list.name}</strong>
				<span className='dex-hunt-nav-card__stats'>{list.caughtCount}/{list.totalCount} caught · {percent}%</span>
				<i style={{ width: `${percent}%` }} />
			</button>
			<button
				className='dex-hunt-nav-card__handle'
				type='button'
				{...attributes}
				{...listeners}
				aria-label={`Drag to reorder ${list.name}`}
				title='Drag to reorder'>
				<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' aria-hidden='true'>
					<circle cx='9' cy='5' r='1' fill='currentColor' /><circle cx='15' cy='5' r='1' fill='currentColor' />
					<circle cx='9' cy='12' r='1' fill='currentColor' /><circle cx='15' cy='12' r='1' fill='currentColor' />
					<circle cx='9' cy='19' r='1' fill='currentColor' /><circle cx='15' cy='19' r='1' fill='currentColor' />
				</svg>
			</button>
		</div>
	)
}
