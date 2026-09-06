import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
	addDexHuntItem,
	createDexHunt,
	deleteDexHunt,
	deleteDexHuntItem,
	downloadDexHunt,
	getDexHunt,
	getDexHuntGames,
	getDexHunts,
	importDexHunt,
	reorderDexHuntItems,
	reorderDexHunts,
	updateDexHunt,
	updateDexHuntItem,
	type DexHuntExport,
	type DexHuntFilters,
	type DexHuntGame,
	type DexHuntItem,
	type DexHuntListDetail,
	type DexHuntListSummary,
	type DexHuntPriority,
	type DexHuntSort,
	type DexHuntStatus,
} from '@/services/DexHunts'
import type { DexGridEntry } from '@/services/DexService'
import { useUISettings } from '@/hooks/useUISettings'
import { DexHuntFormDialog } from './DexHuntFormDialog'
import { DexHuntSpeciesPicker } from './DexHuntSpeciesPicker'
import { DexHuntTargetRow } from './DexHuntTargetRow'
import { DexHuntSortableNavCard } from './DexHuntSortableNavCard'
import './DexHuntsPage.scss'

const TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']

export function DexHuntsPage() {
	const navigate = useNavigate()
	const { listId } = useParams<{ listId: string }>()
	const [searchParams, setSearchParams] = useSearchParams()
	const { spriteType } = useUISettings()
	const importInput = useRef<HTMLInputElement>(null)
	const [lists, setLists] = useState<DexHuntListSummary[]>([])
	const [games, setGames] = useState<DexHuntGame[]>([])
	const [detail, setDetail] = useState<DexHuntListDetail | null>(null)
	const [loadingLists, setLoadingLists] = useState(true)
	const [loadingDetail, setLoadingDetail] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
	const [showPicker, setShowPicker] = useState(false)
	const [pickerSpeciesIds, setPickerSpeciesIds] = useState<number[]>([])
	const [formBusy, setFormBusy] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [busyItemId, setBusyItemId] = useState<number | null>(null)
	const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
	const deferredSearch = useDeferredValue(search)
	const [status, setStatus] = useState<DexHuntStatus>(() => parseStatus(searchParams.get('status')))
	const [priority, setPriority] = useState<DexHuntPriority | null>(() => parsePriority(searchParams.get('priority')))
	const [generation, setGeneration] = useState<number | null>(() => parseNumber(searchParams.get('generation')))
	const [type, setType] = useState(() => searchParams.get('type') ?? '')
	const [sortBy, setSortBy] = useState<DexHuntSort>(() => parseSort(searchParams.get('sort')))
	const [descending, setDescending] = useState(() => searchParams.get('direction') === 'desc')
	const [view, setView] = useState<'cards' | 'rows'>(() => searchParams.get('view') === 'rows' ? 'rows' : 'cards')
	const selectedId = Number(listId) || null
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	)

	const filters: DexHuntFilters = { search: deferredSearch.trim(), status, priority, generation, type, sortBy, descending }
	const isManualView = !deferredSearch.trim() && status === 'all' && priority === null && generation === null && !type && sortBy === 'manual' && !descending

	useEffect(() => {
		const next = new URLSearchParams(searchParams)
		const values: Record<string, string | null> = {
			q: search.trim() || null,
			status: status === 'all' ? null : status,
			priority: priority === null ? null : String(priority),
			generation: generation === null ? null : String(generation),
			type: type || null,
			sort: sortBy === 'manual' ? null : sortBy,
			direction: descending ? 'desc' : null,
			view: view === 'cards' ? null : view,
		}
		Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
		if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
	}, [search, status, priority, generation, type, sortBy, descending, view, searchParams, setSearchParams])

	const huntUrl = (id: number) => {
		const query = searchParams.toString()
		return `/hunts/${id}${query ? `?${query}` : ''}`
	}

	const loadLists = async (preferredId?: number) => {
		const loaded = await getDexHunts()
		setLists(loaded)
		const targetId = preferredId ?? selectedId
		if (targetId && loaded.some((list) => list.id === targetId)) return
		if (loaded.length > 0) navigate(huntUrl(loaded[0].id), { replace: true })
		else if (listId) navigate('/hunts', { replace: true })
	}

	useEffect(() => {
		let active = true
		Promise.all([getDexHunts(), getDexHuntGames()])
			.then(([loadedLists, loadedGames]) => {
				if (!active) return
				setLists(loadedLists)
				setGames(loadedGames)
				if ((!selectedId || !loadedLists.some((list) => list.id === selectedId)) && loadedLists[0]) navigate(huntUrl(loadedLists[0].id), { replace: true })
			})
			.catch((reason) => active && setError(message(reason, 'Could not load Dex Hunts.')))
			.finally(() => active && setLoadingLists(false))
		return () => { active = false }
	}, [])

	useEffect(() => {
		if (!selectedId) {
			setDetail(null)
			return
		}
		let active = true
		setLoadingDetail(true)
		setError(null)
		getDexHunt(selectedId, filters)
			.then((loaded) => active && setDetail(loaded))
			.catch((reason) => active && setError(message(reason, 'Could not load this Dex Hunt.')))
			.finally(() => active && setLoadingDetail(false))
		return () => { active = false }
	}, [selectedId, deferredSearch, status, priority, generation, type, sortBy, descending])

	const reloadSelected = async () => {
		if (!selectedId) return
		const [loadedDetail, loadedLists] = await Promise.all([getDexHunt(selectedId, filters), getDexHunts()])
		setDetail(loadedDetail)
		setLists(loadedLists)
	}

	const saveList = async (value: { name: string; gameId: number; description: string | null }) => {
		setFormBusy(true)
		setFormError(null)
		try {
			if (formMode === 'edit' && detail) {
				await updateDexHunt(detail.list.id, value)
				await reloadSelected()
				setNotice('Dex Hunt updated.')
			} else {
				const created = await createDexHunt(value)
				await loadLists(created.id)
				navigate(huntUrl(created.id))
				setNotice('Dex Hunt created. Add your first target.')
			}
			setFormMode(null)
		} catch (reason) {
			setFormError(message(reason, 'Could not save the Dex Hunt.'))
		} finally {
			setFormBusy(false)
		}
	}

	const removeList = async () => {
		if (!detail || !window.confirm(`Delete “${detail.list.name}” and all its targets?`)) return
		try {
			await deleteDexHunt(detail.list.id)
			setDetail(null)
			await loadLists()
			setNotice('Dex Hunt deleted.')
		} catch (reason) { setError(message(reason, 'Could not delete the Dex Hunt.')) }
	}

	const addTarget = async (species: DexGridEntry, newPriority: DexHuntPriority, notes: string | null) => {
		if (!selectedId) return false
		try {
			await addDexHuntItem(selectedId, { speciesId: species.speciesId, priority: newPriority, notes })
			await reloadSelected()
			setNotice(`${species.name} added to the hunt.`)
			return true
		} catch (reason) {
			setError(message(reason, 'Could not add this target.'))
			return false
		}
	}

	const openPicker = async () => {
		if (!selectedId) return
		try {
			const full = await getDexHunt(selectedId)
			setPickerSpeciesIds(full.items.map((item) => item.speciesId))
			setShowPicker(true)
		} catch (reason) { setError(message(reason, 'Could not open the Pokédex picker.')) }
	}

	const mutateItem = async (item: DexHuntItem, changes: { isCaught?: boolean; priority?: DexHuntPriority; notes?: string | null }) => {
		if (!selectedId) return
		setBusyItemId(item.id)
		try {
			await updateDexHuntItem(selectedId, item.id, {
				isCaught: changes.isCaught ?? item.isCaught,
				priority: changes.priority ?? item.priority,
				notes: changes.notes === undefined ? item.notes : changes.notes,
			})
			await reloadSelected()
		} catch (reason) { setError(message(reason, 'Could not update this target.')) }
		finally { setBusyItemId(null) }
	}

	const removeItem = async (item: DexHuntItem) => {
		if (!selectedId || !window.confirm(`Remove ${item.speciesName} from this hunt?`)) return
		setBusyItemId(item.id)
		try {
			await deleteDexHuntItem(selectedId, item.id)
			await reloadSelected()
		} catch (reason) { setError(message(reason, 'Could not remove this target.')) }
		finally { setBusyItemId(null) }
	}

	const reorderLists = async (event: DragEndEvent) => {
		if (!event.over || event.active.id === event.over.id) return
		const oldIndex = lists.findIndex((list) => list.id === event.active.id)
		const newIndex = lists.findIndex((list) => list.id === event.over?.id)
		if (oldIndex < 0 || newIndex < 0) return
		const previous = lists
		const reordered = arrayMove(lists, oldIndex, newIndex)
		setLists(reordered)
		try { await reorderDexHunts(reordered.map((list) => list.id)) }
		catch (reason) { setLists(previous); setError(message(reason, 'Could not reorder Dex Hunts.')) }
	}

	const reorderItems = async (event: DragEndEvent) => {
		if (!isManualView || !detail || !selectedId || !event.over || event.active.id === event.over.id) return
		const oldIndex = detail.items.findIndex((item) => item.id === event.active.id)
		const newIndex = detail.items.findIndex((item) => item.id === event.over?.id)
		if (oldIndex < 0 || newIndex < 0) return
		const previous = detail
		const reordered = arrayMove(detail.items, oldIndex, newIndex)
		setDetail({ ...detail, items: reordered })
		try { await reorderDexHuntItems(selectedId, reordered.map((item) => item.id)); await reloadSelected() }
		catch (reason) { setDetail(previous); setError(message(reason, 'Could not reorder targets.')) }
	}

	const handleTargetDragEnd = (event: DragEndEvent) => void reorderItems(event)

	const exportList = async () => {
		if (!detail) return
		try {
			const { blob, filename } = await downloadDexHunt(detail.list.id, detail.list.name)
			const url = URL.createObjectURL(blob)
			const anchor = document.createElement('a')
			anchor.href = url
			anchor.download = filename
			anchor.click()
			URL.revokeObjectURL(url)
			setNotice('Portable JSON exported.')
		} catch (reason) { setError(message(reason, 'Could not export this Dex Hunt.')) }
	}

	const importFile = async (file?: File) => {
		if (!file) return
		try {
			if (file.size > 2_000_000) throw new Error('The JSON file is larger than 2 MB.')
			const payload = JSON.parse(await file.text()) as DexHuntExport
			const created = await importDexHunt(payload)
			await loadLists(created.id)
			navigate(huntUrl(created.id))
			setNotice(`Imported “${created.name}”.`)
		} catch (reason) { setError(message(reason, 'Could not import this JSON file.')) }
		finally { if (importInput.current) importInput.current.value = '' }
	}

	const total = detail?.list.totalCount ?? 0
	const caught = detail?.list.caughtCount ?? 0
	const percent = total ? Math.round((caught / total) * 100) : 0

	return (
		<main className='dex-hunts-page'>
			<header className='dex-hunts-page__hero'>
				<div>
					<span className='dex-hunts-page__eyebrow'>Independent catch checklists</span>
					<h1>Dex Hunts</h1>
					<p>Plan what to catch by game, without changing or checking anything in your vault.</p>
				</div>
				<div className='dex-hunts-page__hero-actions'>
					<input ref={importInput} className='sr-only' type='file' accept='application/json,.json' onChange={(event) => importFile(event.target.files?.[0])} />
					<button className='dex-hunt-button dex-hunt-button--quiet' type='button' onClick={() => importInput.current?.click()}>Import JSON</button>
					<button className='dex-hunt-button dex-hunt-button--primary' type='button' onClick={() => { setFormError(null); setFormMode('create') }} disabled={games.length === 0}>New Dex Hunt</button>
				</div>
			</header>

			{error && <div className='dex-hunts-page__message is-error' role='alert'><span>{error}</span><button onClick={() => setError(null)} aria-label='Dismiss error'>×</button></div>}
			{notice && <div className='dex-hunts-page__message is-success' role='status'><span>{notice}</span><button onClick={() => setNotice(null)} aria-label='Dismiss message'>×</button></div>}

			<div className='dex-hunts-shell'>
				<aside className='dex-hunts-sidebar' aria-label='Dex Hunts'>
					<div className='dex-hunts-sidebar__title'><span>Your hunts</span><b>{lists.length}</b></div>
					{loadingLists ? <p className='dex-hunts-sidebar__state'>Loading…</p> : lists.length === 0 ? <div className='dex-hunts-sidebar__empty'><strong>No hunts yet</strong><span>Create one or import a JSON list.</span></div> : (
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderLists}>
							<SortableContext items={lists.map((list) => list.id)} strategy={verticalListSortingStrategy}>
								<div className='dex-hunts-sidebar__list'>
									{lists.map((list) => <DexHuntSortableNavCard key={list.id} list={list} active={selectedId === list.id} onSelect={() => navigate(huntUrl(list.id))} />)}
								</div>
							</SortableContext>
						</DndContext>
					)}
				</aside>

				<section className='dex-hunts-workspace'>
					{!selectedId && !loadingLists ? (
						<div className='dex-hunts-workspace__welcome'><div className='dex-hunts-workspace__target' aria-hidden='true'><span /></div><h2>Build your next catch route</h2><p>Create a game-specific checklist, add species from the full Pokédex, then tick them off one by one.</p><button className='dex-hunt-button dex-hunt-button--primary' onClick={() => setFormMode('create')} disabled={games.length === 0}>Create your first Dex Hunt</button></div>
					) : detail ? (
						<>
							<header className='dex-hunts-workspace__header'>
								<div className='dex-hunts-workspace__heading'><span>{detail.list.gameName}</span><h2>{detail.list.name}</h2>{detail.list.description && <p>{detail.list.description}</p>}</div>
								<div className='dex-hunts-workspace__actions'>
									<button type='button' onClick={() => { setFormError(null); setFormMode('edit') }}>Edit</button>
									<button type='button' onClick={exportList}>Export</button>
									<button type='button' className='is-danger' onClick={removeList}>Delete</button>
								</div>
							</header>

							<div className='dex-hunt-progress'>
								<div className='dex-hunt-progress__ring' style={{ '--hunt-progress': `${percent * 3.6}deg` } as React.CSSProperties}><strong>{percent}%</strong><span>caught</span></div>
								<div className='dex-hunt-progress__copy'><strong>{caught} secured</strong><span>{total - caught} still wanted · {total} total targets</span><div><i style={{ width: `${percent}%` }} /></div></div>
								<button className='dex-hunt-button dex-hunt-button--primary' type='button' onClick={openPicker}>Add targets</button>
							</div>

							<div className='dex-hunt-toolbar'>
								<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search names, numbers or notes…' aria-label='Search targets' />
								<select value={status} onChange={(event) => setStatus(event.target.value as DexHuntStatus)} aria-label='Filter by status'><option value='all'>All status</option><option value='open'>Wanted</option><option value='caught'>Caught</option></select>
								<select value={priority ?? ''} onChange={(event) => setPriority(event.target.value === '' ? null : Number(event.target.value) as DexHuntPriority)} aria-label='Filter by priority'><option value=''>All priorities</option><option value={2}>High</option><option value={1}>Normal</option><option value={0}>Low</option></select>
								<select value={generation ?? ''} onChange={(event) => setGeneration(event.target.value === '' ? null : Number(event.target.value))} aria-label='Filter by generation'><option value=''>All generations</option>{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>Gen {index + 1}</option>)}</select>
								<select value={type} onChange={(event) => setType(event.target.value)} aria-label='Filter by type'><option value=''>All types</option>{TYPES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}</select>
								<select value={sortBy} onChange={(event) => setSortBy(event.target.value as DexHuntSort)} aria-label='Sort targets'><option value='manual'>Manual order</option><option value='number'>Pokédex number</option><option value='name'>Name</option><option value='generation'>Generation</option><option value='priority'>Priority</option><option value='added'>Date added</option><option value='caught'>Date caught</option></select>
								{sortBy !== 'manual' && <button className={`dex-hunt-toolbar__direction${descending ? ' is-active' : ''}`} type='button' onClick={() => setDescending((value) => !value)} aria-label={descending ? 'Sort ascending' : 'Sort descending'} title={descending ? 'Descending' : 'Ascending'}>{descending ? 'DESC' : 'ASC'}</button>}
								<div className='dex-hunt-toolbar__view' role='group' aria-label='Target view'>
									<button type='button' className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')} aria-label='Card view' aria-pressed={view === 'cards'}>
										<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'><rect x='3' y='3' width='7' height='7' rx='1' /><rect x='14' y='3' width='7' height='7' rx='1' /><rect x='3' y='14' width='7' height='7' rx='1' /><rect x='14' y='14' width='7' height='7' rx='1' /></svg>
									</button>
									<button type='button' className={view === 'rows' ? 'is-active' : ''} onClick={() => setView('rows')} aria-label='Row view' aria-pressed={view === 'rows'}>
										<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'><path d='M4 6h16M4 12h16M4 18h16' /></svg>
									</button>
								</div>
							</div>

							{!isManualView && <p className='dex-hunts-workspace__hint'>Clear filters and select Manual order to move targets.</p>}
							{loadingDetail ? <div className='dex-hunts-workspace__state'>Updating targets…</div> : detail.items.length === 0 ? <div className='dex-hunts-workspace__empty'><strong>{total === 0 ? 'No targets yet' : 'No targets match these filters'}</strong><span>{total === 0 ? 'Search the Pokédex and add every species you still need.' : 'Change or clear the filters to see the rest of the hunt.'}</span>{total === 0 && <button className='dex-hunt-button dex-hunt-button--primary' onClick={openPicker}>Add Pokédex targets</button>}</div> : (
								<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTargetDragEnd}>
									<SortableContext items={detail.items.map((item) => item.id)} strategy={view === 'cards' ? rectSortingStrategy : verticalListSortingStrategy}>
										<div className={`dex-hunt-targets dex-hunt-targets--${view}`}>
											{detail.items.map((item) => <DexHuntTargetRow key={item.id} item={item} spriteType={spriteType} busy={busyItemId === item.id} canMove={isManualView} onToggle={(target) => mutateItem(target, { isCaught: !target.isCaught })} onPriority={(target, value) => mutateItem(target, { priority: value })} onNotes={(target, value) => mutateItem(target, { notes: value })} onDelete={removeItem} view={view} />)}
										</div>
									</SortableContext>
								</DndContext>
							)}
						</>
					) : loadingDetail ? <div className='dex-hunts-workspace__state'>Loading Dex Hunt…</div> : null}
				</section>
			</div>

			{formMode && <DexHuntFormDialog games={games} list={formMode === 'edit' ? detail?.list : undefined} busy={formBusy} error={formError} onClose={() => setFormMode(null)} onSubmit={saveList} />}
			{showPicker && detail && <DexHuntSpeciesPicker existingSpeciesIds={pickerSpeciesIds} spriteType={spriteType} onClose={() => setShowPicker(false)} onAdd={addTarget} />}
		</main>
	)
}

function message(reason: unknown, fallback: string) {
	if (!(reason instanceof Error)) return fallback
	const details = reason.message.match(/"details":"([^"]+)"/)?.[1]
	return details?.replaceAll('\\n', ' ') || reason.message || fallback
}

function parseStatus(value: string | null): DexHuntStatus {
	return value === 'open' || value === 'caught' ? value : 'all'
}

function parsePriority(value: string | null): DexHuntPriority | null {
	return value === '0' || value === '1' || value === '2' ? Number(value) as DexHuntPriority : null
}

function parseNumber(value: string | null): number | null {
	return value && /^\d+$/.test(value) ? Number(value) : null
}

function parseSort(value: string | null): DexHuntSort {
	const options: DexHuntSort[] = ['manual', 'number', 'name', 'generation', 'priority', 'added', 'caught']
	return options.includes(value as DexHuntSort) ? value as DexHuntSort : 'manual'
}

export default DexHuntsPage
