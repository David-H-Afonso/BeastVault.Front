import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { getDexGrid, getDexSpecies, getDexGames } from '@/services/DexService'
import type {
	DexGridEntry,
	DexSpeciesDetail,
	DexOwnedPokemon,
	DexGameOption,
} from '@/services/DexService'
import { DetailShell } from '@/components/elements/DetailShell/DetailShell'
import { DexSpeciesPanel } from './DexSpeciesPanel'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import { useUISettings } from '@/hooks/useUISettings'
import { formatSlugName } from '@/utils/formatSlugName'
import type { SpriteType } from '@/models/enums/SpriteTypes'
import './DexPage.scss'

const GENERATIONS = [
	{ label: 'All', value: null },
	{ label: 'Gen I', value: 1 },
	{ label: 'Gen II', value: 2 },
	{ label: 'Gen III', value: 3 },
	{ label: 'Gen IV', value: 4 },
	{ label: 'Gen V', value: 5 },
	{ label: 'Gen VI', value: 6 },
	{ label: 'Gen VII', value: 7 },
	{ label: 'Gen VIII', value: 8 },
	{ label: 'Gen IX', value: 9 },
]

const PAGE_SIZE = 60

export const DexPage: React.FC = () => {
	const { spriteType } = useUISettings()
	const [entries, setEntries] = useState<DexGridEntry[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [generation, setGeneration] = useState<number | null>(null)
	const [search, setSearch] = useState('')
	const [searchInput, setSearchInput] = useState('')
	const [unlockedOnly, setUnlockedOnly] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null)
	const [speciesDetail, setSpeciesDetail] = useState<DexSpeciesDetail | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)

	const [gameOptions, setGameOptions] = useState<DexGameOption[]>([])
	const [originGame, setOriginGame] = useState<number | null>(null)

	const [searchParams, setSearchParams] = useSearchParams()
	const { speciesId: speciesIdParam } = useParams<{ speciesId: string }>()
	const navigate = useNavigate()

	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
	const totalPages = Math.ceil(total / PAGE_SIZE)

	// Open modal for a specific species from URL param or query string
	useEffect(() => {
		const idFromParam = speciesIdParam ? parseInt(speciesIdParam, 10) : NaN
		const idFromQuery = parseInt(searchParams.get('species') || '', 10)
		const id = !isNaN(idFromParam) ? idFromParam : !isNaN(idFromQuery) ? idFromQuery : null

		if (id) {
			setSelectedSpeciesId(id)
			openSpeciesDetail(id)
			if (!isNaN(idFromQuery)) {
				setSearchParams({}, { replace: true })
			}
		}
	}, [speciesIdParam])

	// Load available origin games from vault
	useEffect(() => {
		getDexGames()
			.then(setGameOptions)
			.catch(() => setGameOptions([]))
	}, [])

	const load = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await getDexGrid({
				page,
				pageSize: PAGE_SIZE,
				generation,
				search,
				unlockedOnly,
				originGame,
			})
			setEntries(res.items)
			setTotal(res.total)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load Pokédex')
		} finally {
			setLoading(false)
		}
	}, [page, generation, search, unlockedOnly, originGame])

	useEffect(() => {
		load()
	}, [load])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		setSearchInput(val)
		if (searchTimeout.current) clearTimeout(searchTimeout.current)
		searchTimeout.current = setTimeout(() => {
			setSearch(val)
			setPage(1)
		}, 400)
	}

	const handleGenerationChange = (gen: number | null) => {
		setGeneration(gen)
		setPage(1)
	}

	const handleOriginGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const val = e.target.value
		setOriginGame(val === '' ? null : Number(val))
		setPage(1)
	}

	const handleUnlockedToggle = () => {
		setUnlockedOnly((v) => !v)
		setPage(1)
	}

	const openSpeciesDetail = useCallback(async (speciesId: number) => {
		setSelectedSpeciesId(speciesId)
		setSpeciesDetail(null)
		setDetailLoading(true)
		try {
			const detail = await getDexSpecies(speciesId)
			setSpeciesDetail(detail)
		} catch {
			setSpeciesDetail(null)
		} finally {
			setDetailLoading(false)
		}
	}, [])

	const handleCardClick = async (entry: DexGridEntry) => {
		navigate(`/dex/${entry.speciesId}`)
		await openSpeciesDetail(entry.speciesId)
	}

	const handleCloseModal = () => {
		setSelectedSpeciesId(null)
		setSpeciesDetail(null)
		if (window.location.pathname.startsWith('/dex/')) {
			window.history.replaceState(null, '', '/dex')
		}
	}

	const handleViewOwnedPokemon = useCallback(
		(p: DexOwnedPokemon) => {
			navigate(`/pokemon/${p.id}`)
		},
		[navigate]
	)

	const panelContent = speciesDetail ? (
		<DexSpeciesPanel
			detail={speciesDetail}
			loading={detailLoading}
			onOwnedClick={handleViewOwnedPokemon}
			onClose={handleCloseModal}
		/>
	) : detailLoading ? (
		<p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</p>
	) : null

	return (
		<DetailShell
			panel={selectedSpeciesId !== null ? panelContent : null}
			onClosePanel={handleCloseModal}>
			<div className='dex-page'>
				{/* Header */}
				<div className='dex-page__header'>
					<h1 className='dex-page__title'>Vault Pokédex</h1>
					<p className='dex-page__subtitle'>
						{total > 0 ? `${total} species — ` : ''}
						Showing Pokémon registered in PokeAPI cache
					</p>
				</div>

				{/* Filters */}
				<div className='dex-page__filters'>
					<input
						className='dex-page__search'
						type='text'
						placeholder='Search by name…'
						value={searchInput}
						onChange={handleSearchChange}
					/>

					<div className='dex-page__gen-filters'>
						{GENERATIONS.map((g) => (
							<button
								key={String(g.value)}
								className={`dex-page__gen-btn${generation === g.value ? ' active' : ''}`}
								onClick={() => handleGenerationChange(g.value)}>
								{g.label}
							</button>
						))}
					</div>

					<label className='dex-page__toggle'>
						<input type='checkbox' checked={unlockedOnly} onChange={handleUnlockedToggle} />
						<span>Owned only</span>
					</label>

					{gameOptions.length > 0 && (
						<select
							className='dex-page__game-select'
							value={originGame ?? ''}
							onChange={handleOriginGameChange}
							title='Filter by origin game'>
							<option value=''>All games</option>
							{gameOptions.map((g) => (
								<option key={g.id} value={g.id}>
									{g.name}
								</option>
							))}
						</select>
					)}
				</div>

				{/* Grid */}
				{error && <div className='dex-page__error'>{error}</div>}

				{loading ? (
					<div className='dex-page__loading'>Loading Pokédex…</div>
				) : entries.length === 0 && !loading ? (
					<div className='dex-page__empty'>
						{total === 0
							? 'No Pokédex data cached yet. Ask an admin to run Populate Pokédex Cache.'
							: 'No Pokémon match your filters.'}
					</div>
				) : (
					<div className='dex-grid'>
						{entries.map((entry) => (
							<DexCard
								key={entry.speciesId}
								entry={entry}
								onClick={handleCardClick}
								spriteType={spriteType}
							/>
						))}
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className='dex-page__pagination'>
						<button
							className='dex-page__page-btn'
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}>
							‹ Prev
						</button>
						<span className='dex-page__page-info'>
							{page} / {totalPages}
						</span>
						<button
							className='dex-page__page-btn'
							disabled={page >= totalPages}
							onClick={() => setPage((p) => p + 1)}>
							Next ›
						</button>
					</div>
				)}
			</div>
		</DetailShell>
	)
}

// ── DexCard ──────────────────────────────────────────────────────────────────

interface DexCardProps {
	entry: DexGridEntry
	onClick: (entry: DexGridEntry) => void
	spriteType: SpriteType
}

function DexCard({ entry, onClick, spriteType }: DexCardProps) {
	const isLocked = !entry.isUnlocked
	const [showShiny, setShowShiny] = useState(entry.hasShiny)

	const displaySprite = getPreferredSpriteFromDto(entry.sprites, spriteType, showShiny)

	const handleShinyToggle = (e: React.MouseEvent) => {
		e.stopPropagation()
		setShowShiny((v) => !v)
	}

	const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		// Middle-click / Ctrl+click / Shift+click → let browser open in new tab natively
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return
		e.preventDefault()
		onClick(entry)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			onClick(entry)
		}
	}

	return (
		<a
			href={`/dex/${entry.speciesId}`}
			className={`dex-card${isLocked ? ' dex-card--locked' : ''}${showShiny ? ' dex-card--shiny-active' : ''}`}
			onClick={handleCardClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			title={entry.name}>
			<div className='dex-card__sprite-wrap'>
				{displaySprite ? (
					<img
						className={`dex-card__sprite${isLocked ? ' dex-card__sprite--silhouette' : ''}`}
						src={displaySprite}
						alt={entry.name}
						loading='lazy'
					/>
				) : (
					<div className='dex-card__sprite dex-card__sprite--placeholder'>?</div>
				)}
				{entry.ownedCount > 0 && <span className='dex-card__count'>{entry.ownedCount}</span>}
				{entry.hasShiny && !isLocked && (
					<button
						type='button'
						className={`dex-card__shiny-btn${showShiny ? ' active' : ''}`}
						onClick={handleShinyToggle}
						title='Toggle shiny sprite'>
						★
					</button>
				)}
			</div>
			<div className='dex-card__info'>
				<span className='dex-card__id'>#{String(entry.speciesId).padStart(4, '0')}</span>
				<span className='dex-card__name'>{isLocked ? '???' : formatSlugName(entry.name)}</span>
				<div className='dex-card__types'>
					{(isLocked ? [] : entry.types).map((t) => (
						<span key={t} className={`dex-card__type type-${t.toLowerCase()}`}>
							{formatSlugName(t)}
						</span>
					))}
				</div>
			</div>
		</a>
	)
}

export default DexPage
