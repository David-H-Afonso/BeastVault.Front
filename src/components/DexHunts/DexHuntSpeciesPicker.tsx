import { useDeferredValue, useEffect, useState } from 'react'
import { getDexGrid, type DexGridEntry } from '@/services/DexService'
import type { DexHuntPriority } from '@/services/DexHunts'
import type { SpriteType } from '@/models/enums/SpriteTypes'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import { formatSlugName } from '@/utils/formatSlugName'
import { DexHuntDialog } from './DexHuntDialog'

interface DexHuntSpeciesPickerProps {
	existingSpeciesIds: number[]
	spriteType: SpriteType
	onClose: () => void
	onAdd: (species: DexGridEntry, priority: DexHuntPriority, notes: string | null) => Promise<boolean>
}

const PAGE_SIZE = 60

export function DexHuntSpeciesPicker({ existingSpeciesIds, spriteType, onClose, onAdd }: DexHuntSpeciesPickerProps) {
	const [search, setSearch] = useState('')
	const deferredSearch = useDeferredValue(search)
	const [generation, setGeneration] = useState<number | null>(null)
	const [page, setPage] = useState(1)
	const [entries, setEntries] = useState<DexGridEntry[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [priority, setPriority] = useState<DexHuntPriority>(1)
	const [notes, setNotes] = useState('')
	const [addingId, setAddingId] = useState<number | null>(null)
	const [added, setAdded] = useState(() => new Set(existingSpeciesIds))

	useEffect(() => setPage(1), [deferredSearch, generation])
	useEffect(() => {
		let active = true
		setLoading(true)
		setError(null)
		getDexGrid({ page, pageSize: PAGE_SIZE, search: deferredSearch.trim(), generation, unlockedOnly: false })
			.then((response) => {
				if (!active) return
				setEntries(response.items)
				setTotal(response.total)
			})
			.catch((reason) => active && setError(reason instanceof Error ? reason.message : 'Could not load Pokédex species.'))
			.finally(() => active && setLoading(false))
		return () => { active = false }
	}, [deferredSearch, generation, page])

	const add = async (species: DexGridEntry) => {
		setAddingId(species.speciesId)
		const success = await onAdd(species, priority, notes.trim() || null)
		if (success) {
			setAdded((current) => new Set(current).add(species.speciesId))
			setNotes('')
		}
		setAddingId(null)
	}

	return (
		<DexHuntDialog title='Add Pokédex targets' description='Search the full cached Pokédex. Ownership in your vault is intentionally ignored.' onClose={onClose} wide>
			<div className='dex-hunt-picker'>
				<div className='dex-hunt-picker__toolbar'>
					<label className='dex-hunt-picker__search'>
						<span className='sr-only'>Search Pokédex</span>
						<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Name or Pokédex number…' />
					</label>
					<select value={generation ?? ''} onChange={(event) => setGeneration(event.target.value ? Number(event.target.value) : null)} aria-label='Filter species by generation'>
						<option value=''>All generations</option>
						{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>Generation {index + 1}</option>)}
					</select>
					<select value={priority} onChange={(event) => setPriority(Number(event.target.value) as DexHuntPriority)} aria-label='Priority for new targets'>
						<option value={0}>Low priority</option>
						<option value={1}>Normal priority</option>
						<option value={2}>High priority</option>
					</select>
					<input className='dex-hunt-picker__notes' value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder='Shared note for next target…' aria-label='Note for next target' />
				</div>

				{error && <p className='dex-hunt-form__error' role='alert'>{error}</p>}
				{loading ? <div className='dex-hunt-picker__state'>Searching the Pokédex…</div> : entries.length === 0 ? <div className='dex-hunt-picker__state'>No species match this search.</div> : (
					<div className='dex-hunt-picker__grid'>
						{entries.map((species) => {
							const exists = added.has(species.speciesId)
							const sprite = getPreferredSpriteFromDto(species.sprites, spriteType)
							return (
								<article key={species.speciesId} className={`dex-hunt-picker-card${exists ? ' is-added' : ''}`}>
									<div className='dex-hunt-picker-card__sprite'>{sprite ? <img src={sprite} alt='' loading='lazy' /> : '?'}</div>
									<div className='dex-hunt-picker-card__copy'>
										<span>#{String(species.speciesId).padStart(4, '0')} · Gen {species.generation}</span>
										<strong>{formatSlugName(species.name)}</strong>
									</div>
									<button type='button' disabled={exists || addingId !== null} onClick={() => add(species)}>{exists ? 'Added' : addingId === species.speciesId ? 'Adding…' : 'Add'}</button>
								</article>
							)
						})}
					</div>
				)}
				{Math.ceil(total / PAGE_SIZE) > 1 && (
					<footer className='dex-hunt-picker__pagination'>
						<button type='button' disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
						<span>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
						<button type='button' disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((value) => value + 1)}>Next</button>
					</footer>
				)}
			</div>
		</DexHuntDialog>
	)
}
