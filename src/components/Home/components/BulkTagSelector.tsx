import { useState } from 'react'
import type { TagDto } from '@/models/api/types'

const buildTagStyle = (tag: TagDto): React.CSSProperties => ({
	borderColor: tag.colorHex || 'rgba(250, 204, 21, 0.45)',
	backgroundColor: tag.colorHex ? `${tag.colorHex}22` : 'rgba(250, 204, 21, 0.1)',
	color: tag.colorHex || 'var(--tag-chip-text, #f9d84a)',
})

interface BulkTagSelectorProps {
	tags: TagDto[]
	loading: boolean
	onSubmit: (tagIds: number[]) => void
	onCancel: () => void
	actionLabel: string
	/** Create a new tag and return it so it can be auto-selected. */
	onCreateTag: (name: string) => Promise<TagDto>
	/** Whether the inline "create tag" row is shown (hidden for the remove action). */
	allowCreate: boolean
}

export function BulkTagSelector({
	tags,
	loading,
	onSubmit,
	onCancel,
	actionLabel,
	onCreateTag,
	allowCreate,
}: BulkTagSelectorProps) {
	const [selected, setSelected] = useState<Set<number>>(new Set())
	const [newTagName, setNewTagName] = useState('')
	const [creating, setCreating] = useState(false)
	const [createError, setCreateError] = useState<string | null>(null)

	const toggle = (id: number) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const handleCreate = async () => {
		const name = newTagName.trim()
		if (!name || creating) return
		setCreating(true)
		setCreateError(null)
		try {
			const created = await onCreateTag(name)
			setSelected((prev) => new Set(prev).add(created.id))
			setNewTagName('')
		} catch {
			setCreateError('Could not create tag. The name may already exist.')
		} finally {
			setCreating(false)
		}
	}

	return (
		<div className='bulk-tag-selector'>
			{allowCreate && (
				<div className='bulk-tag-selector__create'>
					<input
						type='text'
						value={newTagName}
						onChange={(event) => setNewTagName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								handleCreate()
							}
						}}
						placeholder='Create new tag…'
						aria-label='New tag name'
						disabled={creating}
					/>
					<button
						type='button'
						className='action-btn'
						onClick={handleCreate}
						disabled={!newTagName.trim() || creating}>
						{creating ? 'Creating…' : 'Create'}
					</button>
				</div>
			)}
			{createError && <p className='bulk-tag-selector__error'>{createError}</p>}
			<div className='bulk-tag-selector__list'>
				{tags.map((tag) => (
					<button
						key={tag.id}
						type='button'
						className={`bulk-tag-selector__chip${selected.has(tag.id) ? ' bulk-tag-selector__chip--active' : ''}`}
						style={buildTagStyle(tag)}
						onClick={() => toggle(tag.id)}>
						{tag.name}
					</button>
				))}
				{tags.length === 0 && (
					<p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tags available</p>
				)}
			</div>
			<div className='bulk-tag-selector__actions'>
				<button
					type='button'
					className='action-btn'
					disabled={selected.size === 0 || loading}
					onClick={() => onSubmit(Array.from(selected))}>
					{loading
						? 'Working…'
						: `${actionLabel} ${selected.size} tag${selected.size !== 1 ? 's' : ''}`}
				</button>
				<button type='button' className='action-btn' onClick={onCancel}>
					Cancel
				</button>
			</div>
		</div>
	)
}
