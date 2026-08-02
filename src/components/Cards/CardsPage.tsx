import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type FormEvent,
	type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { getTcgVariantPrice, slugifyTcgSet } from '@/utils/tcg'
import {
	addTcgCollectionEntry,
	cacheAllTcgAssets,
	cacheTcgSetAssets,
	deleteTcgCollectionCards,
	deleteTcgCollectionEntry,
	getTcgCard,
	getTcgCollection,
	getTcgCollectionStats,
	getTcgSetCards,
	getTcgSets,
	refreshTcgCard,
	refreshTcgCards,
	searchTcgCards,
	updateTcgCollectionEntry,
	type TcgCardDto,
	type TcgCardPageDto,
	type TcgCollectionPageDto,
	type TcgCollectionEntryDto,
	type TcgCollectionGroupDto,
	type TcgCollectionStatsDto,
	type TcgDexProgressDto,
	type TcgSetDto,
	type UserCardDto,
} from '@/services/TcgCollection'
import './CardsPage.scss'

type CardsView = 'dashboard' | 'search' | 'sets' | 'collection'
type Notice = { type: 'success' | 'error'; text: string }
type SearchFilters = { query: string; setId: string; number: string; speciesId: string }
type CollectionFilters = { query: string; setId: string; language: string; condition: string }

const parseCardsView = (value: string | undefined): CardsView =>
	value === 'search' || value === 'sets' || value === 'collection' ? value : 'dashboard'

const SEARCH_PAGE_SIZE = 30
const GRID_PAGE_SIZE = 60
const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'Damaged', 'Graded']
const LANGUAGES = ['ES', 'EN', 'JP', 'DE', 'FR', 'IT', 'KO', 'ZH']
const EMPTY_CARD_PAGE: TcgCardPageDto = {
	items: [],
	page: 1,
	pageSize: SEARCH_PAGE_SIZE,
	hasMore: false,
	totalCount: null,
}
const EMPTY_COLLECTION_PAGE: TcgCollectionPageDto = {
	items: [],
	page: 1,
	pageSize: GRID_PAGE_SIZE,
	totalCount: 0,
}

const errorText = (error: unknown, fallback: string) =>
	error instanceof Error ? error.message : fallback

const formatMoney = (value: number | null, currency: 'EUR' | 'USD') =>
	value === null
		? '—'
		: new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
			}).format(value)

const formatDate = (value: string | null) => {
	if (!value) return 'Not updated yet'
	const date = new Date(value)
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

const formatCollectorReference = (card: TcgCardDto, sets: TcgSetDto[]) => {
	const set = sets.find((item) => item.id === card.setId)
	const code = set?.officialCode?.trim()
	const printedTotal = set?.printedTotal
	const rawNumber = card.number.trim()
	const number = printedTotal && !rawNumber.includes('/') ? `${rawNumber}/${printedTotal}` : rawNumber
	return code ? `${code} ${number}` : `#${number}`
}

const toCollectionEntry = (entry: UserCardDto): TcgCollectionEntryDto => ({
	id: entry.id,
	variant: entry.variant,
	condition: entry.condition,
	language: entry.language,
	quantity: entry.quantity,
	notes: entry.notes,
	addedAt: entry.addedAt,
	updatedAt: entry.addedAt,
	unitValueEur: entry.unitValueEur,
	unitValueUsd: entry.unitValueUsd,
	totalValueEur: entry.totalValueEur,
	totalValueUsd: entry.totalValueUsd,
})

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

function TcgIcon({ name }: { name: 'dashboard' | 'search' | 'sets' | 'collection' | 'cards' }) {
	const paths: Record<typeof name, ReactNode> = {
		dashboard: <><rect x='3' y='3' width='7' height='7' rx='1' /><rect x='14' y='3' width='7' height='7' rx='1' /><rect x='3' y='14' width='7' height='7' rx='1' /><rect x='14' y='14' width='7' height='7' rx='1' /></>,
		search: <><circle cx='11' cy='11' r='7' /><path d='m20 20-4-4' /></>,
		sets: <><rect x='4' y='3' width='14' height='18' rx='2' /><path d='M8 7h6M8 11h6M8 15h4' /><path d='M18 7h2v14a2 2 0 0 1-2 2H8' /></>,
		collection: <><path d='M4 7h16v13H4z' /><path d='M2 4h20v3H2zM9 11h6' /></>,
		cards: <><rect x='5' y='2' width='14' height='20' rx='2' /><circle cx='12' cy='11' r='3' /><path d='M5 11h4M15 11h4' /></>,
	}
	return <svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>{paths[name]}</svg>
}

function ProgressBar({ value, label }: { value: number; label: string }) {
	return (
		<div className='tcg-progress' aria-label={`${label}: ${Math.round(value)}%`}>
			<span className='tcg-progress__fill' style={{ width: `${clampPercent(value)}%` }} />
		</div>
	)
}

function TcgState({
	title,
	message,
	action,
	busy = false,
}: {
	title: string
	message: string
	action?: { label: string; onClick: () => void }
	busy?: boolean
}) {
	return (
		<div className={`tcg-state${busy ? ' tcg-state--loading' : ''}`} role={busy ? 'status' : undefined}>
			<div className='tcg-state__mark' aria-hidden='true'><TcgIcon name='cards' /></div>
			<strong>{title}</strong>
			<p>{message}</p>
			{action && <button type='button' className='tcg-button tcg-button--secondary' onClick={action.onClick}>{action.label}</button>}
		</div>
	)
}

function CardArtwork({ card, large = false }: { card: TcgCardDto; large?: boolean }) {
	const candidates = useMemo(
		() => Array.from(new Set(
			(large ? [card.imageLarge, card.imageSmall] : [card.imageSmall, card.imageLarge])
				.filter((source): source is string => Boolean(source))
		)),
		[card.id, card.imageLarge, card.imageSmall, large]
	)
	const candidateKey = candidates.join('|')
	const [candidateIndex, setCandidateIndex] = useState(0)
	useEffect(() => setCandidateIndex(0), [card.id, candidateKey])
	const source = candidates[candidateIndex]
	if (!source) {
		return <div className='tcg-artwork tcg-artwork--empty' aria-label={`No image available for ${card.name}`}><TcgIcon name='cards' /><span>{card.name}</span></div>
	}
	return <img className='tcg-artwork' src={source} alt={card.name} width='245' height='342' loading='lazy' decoding='async' referrerPolicy='no-referrer' onError={() => setCandidateIndex((index) => index + 1)} />
}

function SafeImage({ src, alt = '', className }: { src: string | null; alt?: string; className?: string }) {
	const [failed, setFailed] = useState(false)
	useEffect(() => setFailed(false), [src])
	if (!src || failed) return null
	return <img src={src} alt={alt} className={className} loading='lazy' decoding='async' onError={() => setFailed(true)} />
}

function TcgCardGrid({
	cards,
	onOpen,
	onQuickAdd,
	quickAddingId,
	sets,
	setChecklist = false,
}: {
	cards: TcgCardDto[]
	onOpen: (card: TcgCardDto) => void
	onQuickAdd?: (card: TcgCardDto) => void
	quickAddingId?: number | null
	sets: TcgSetDto[]
	setChecklist?: boolean
}) {
	return (
		<div className='tcg-card-grid'>
			{cards.map((card) => (
				<article className={`tcg-card${card.totalOwned > 0 ? ' tcg-card--owned' : ''}`} key={card.id}>
					{card.totalOwned > 0 && (
						<span className='tcg-card__owned' title={`${card.totalOwned} owned`} aria-label={`${card.totalOwned} owned`}>
							<span aria-hidden='true'>✓</span> {card.totalOwned}
						</span>
					)}
					<button type='button' className='tcg-card__main' onClick={() => onOpen(card)} aria-label={`Open ${card.name} details`}>
						<div className='tcg-card__image'><CardArtwork card={card} /></div>
						<div className='tcg-card__copy'>
							<strong title={card.name}>{card.name}</strong>
							<span>{card.setName}</span>
							<small>{formatCollectorReference(card, sets)}{card.rarity ? ` · ${card.rarity}` : ''}</small>
						</div>
					</button>
					<div className='tcg-card__footer'>
						<span>{formatMoney(card.prices.eur, 'EUR')}</span>
						{setChecklist && onQuickAdd ? (
							<button type='button' className='tcg-card__quick' onClick={() => onQuickAdd(card)} disabled={quickAddingId === card.id} aria-label={`Add one ${card.name} with defaults`}>
								{quickAddingId === card.id ? '…' : '+1'}
							</button>
						) : (
							<button type='button' className='tcg-card__details' onClick={() => onOpen(card)}>Details</button>
						)}
					</div>
				</article>
			))}
		</div>
	)
}

function Pagination({
	page,
	hasMore,
	totalCount,
	pageSize,
	onChange,
}: {
	page: number
	hasMore: boolean
	totalCount: number | null
	pageSize: number
	onChange: (page: number) => void
}) {
	const pages = totalCount === null ? null : Math.max(1, Math.ceil(totalCount / pageSize))
	if (page === 1 && !hasMore) return null
	return (
		<nav className='tcg-pagination' aria-label='Results pages'>
			<button type='button' className='tcg-button tcg-button--secondary' disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
			<span>Page {page}{pages ? ` of ${pages}` : ''}</span>
			<button type='button' className='tcg-button tcg-button--secondary' disabled={!hasMore} onClick={() => onChange(page + 1)}>Next</button>
		</nav>
	)
}

function DexProgressCard({ progress }: { progress: TcgDexProgressDto }) {
	return (
		<article className='tcg-dex-card'>
			<div className='tcg-dex-card__top'>
				<strong>{progress.name}</strong>
				<span>{Math.round(progress.completionPercent)}%</span>
			</div>
			<ProgressBar value={progress.completionPercent} label={progress.name} />
			<small>{progress.owned} of {progress.total} species represented</small>
		</article>
	)
}

function DashboardView({
	stats,
	loading,
	error,
	onRetry,
	onMissingSpecies,
	onSet,
	onOpenCard,
}: {
	stats: TcgCollectionStatsDto | null
	loading: boolean
	error: string | null
	onRetry: () => void
	onMissingSpecies: (speciesId: number) => void
	onSet: (providerSetId: string) => void
	onOpenCard: (card: TcgCardDto) => void
}) {
	if (loading && !stats) return <TcgState busy title='Reading your collection' message='Calculating card, set, and Pokédex progress…' />
	if (error && !stats) return <TcgState title='Collection insights are unavailable' message='The card provider or BeastVault API may be temporarily unavailable. Your collection is safe.' action={{ label: 'Try again', onClick: onRetry }} />
	if (!stats) return null

	const missing = stats.national.missing
	return (
		<div className='tcg-dashboard'>
			{error && <div className='tcg-inline-error' role='alert'>Some insights could not refresh. Showing the latest available data.</div>}
			<section className='tcg-summary-grid' aria-label='Collection summary'>
				<article className='tcg-summary-card tcg-summary-card--accent'><span>Unique cards</span><strong>{stats.uniqueCards.toLocaleString()}</strong><small>distinct prints</small></article>
				<article className='tcg-summary-card'><span>Total copies</span><strong>{stats.totalCopies.toLocaleString()}</strong><small>physical cards</small></article>
				<article className='tcg-summary-card'><span>Estimated value</span><strong>{formatMoney(stats.totalValueEur, 'EUR')}</strong><small>{formatMoney(stats.totalValueUsd, 'USD')} secondary</small></article>
			</section>

			<section className='tcg-dashboard__section tcg-dashboard__section--national'>
				<div className='tcg-section-heading'><div><span className='tcg-eyebrow'>Species coverage</span><h2>National Pokédex</h2></div><strong>{Math.round(stats.national.completionPercent)}%</strong></div>
				<ProgressBar value={stats.national.completionPercent} label='National Pokédex' />
				<p>{stats.national.owned} of {stats.national.total} species have at least one physical card in your vault.</p>
			</section>

			<div className='tcg-dashboard__columns'>
				<section className='tcg-dashboard__section'>
					<div className='tcg-section-heading'><div><span className='tcg-eyebrow'>Regional goals</span><h2>Pokédex progress</h2></div></div>
					<div className='tcg-dex-grid'>{stats.regions.map((region) => <DexProgressCard progress={region} key={region.name} />)}</div>
				</section>

				<section className='tcg-dashboard__section'>
					<div className='tcg-section-heading'><div><span className='tcg-eyebrow'>Next targets</span><h2>Missing species</h2></div><span>{missing.length} shown</span></div>
					{missing.length === 0 ? <p className='tcg-dashboard__empty-copy'>National coverage complete. That is a serious binder.</p> : (
						<div className='tcg-missing-list'>{missing.slice(0, 24).map((species) => (
							<button type='button' key={species.speciesId} onClick={() => onMissingSpecies(species.speciesId)}>
								<span>#{species.speciesId.toString().padStart(4, '0')}</span>{species.speciesName}
							</button>
						))}</div>
					)}
				</section>
			</div>

			<div className='tcg-dashboard__columns tcg-dashboard__columns--bottom'>
				<section className='tcg-dashboard__section'>
					<div className='tcg-section-heading'><div><span className='tcg-eyebrow'>Binder projects</span><h2>Set completion</h2></div></div>
					{stats.sets.length === 0 ? <p className='tcg-dashboard__empty-copy'>Add cards to begin tracking set completion.</p> : (
						<div className='tcg-set-progress-list'>{stats.sets.slice(0, 10).map((set) => (
							<button type='button' key={set.setId} onClick={() => onSet(set.providerSetId)}>
								<span className='tcg-set-progress-list__copy'><strong>{set.name}</strong><small>{set.owned} / {set.total}</small></span>
								<span className='tcg-set-progress-list__meter'><ProgressBar value={set.completionPercent} label={set.name} /></span>
								<b>{Math.round(set.completionPercent)}%</b>
							</button>
						))}</div>
					)}
				</section>

				<section className='tcg-dashboard__section'>
					<div className='tcg-section-heading'><div><span className='tcg-eyebrow'>Market highlights</span><h2>Top valuable cards</h2></div></div>
					{stats.topCards.length === 0 ? <p className='tcg-dashboard__empty-copy'>Priced cards will appear here as your collection grows.</p> : (
						<div className='tcg-top-list'>{stats.topCards.slice(0, 6).map((entry, index) => (
							<button type='button' key={entry.id} onClick={() => onOpenCard(entry.card)}>
								<span className='tcg-top-list__rank'>{index + 1}</span><span className='tcg-top-list__image'><CardArtwork card={entry.card} /></span>
								<span className='tcg-top-list__copy'><strong>{entry.card.name}</strong><small>{entry.card.setName} · {entry.variant}</small></span>
								<span className='tcg-top-list__value'><strong>{formatMoney(entry.totalValueEur, 'EUR')}</strong><small>{formatMoney(entry.totalValueUsd, 'USD')}</small></span>
							</button>
						))}</div>
					)}
				</section>
			</div>
		</div>
	)
}

function CardDetailModal({
	card,
	loading,
	collectionGroup,
	onClose,
	onCardChange,
	onAdded,
	onEntrySaved,
	onEntryDelete,
}: {
	card: TcgCardDto
	loading: boolean
	collectionGroup?: TcgCollectionGroupDto | null
	onClose: () => void
	onCardChange: (card: TcgCardDto) => void
	onAdded: (entry: UserCardDto) => void
	onEntrySaved?: (entry: UserCardDto) => void
	onEntryDelete?: (entry: TcgCollectionEntryDto, card: TcgCardDto) => void
}) {
	const defaultVariant = card.variants[0] || 'Normal'
	const [variantChoice, setVariantChoice] = useState(defaultVariant)
	const [customVariant, setCustomVariant] = useState('')
	const [condition, setCondition] = useState('NM')
	const [languageChoice, setLanguageChoice] = useState('ES')
	const [customLanguage, setCustomLanguage] = useState('')
	const [quantity, setQuantity] = useState(1)
	const [notes, setNotes] = useState('')
	const [saving, setSaving] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const closeButtonRef = useRef<HTMLButtonElement | null>(null)
	const dialogRef = useRef<HTMLElement | null>(null)
	const selectedVariant = variantChoice === '__custom' ? customVariant.trim() : variantChoice
	const selectedEur = getTcgVariantPrice(card.prices.variantEur, selectedVariant, card.prices.eur)
	const selectedUsd = getTcgVariantPrice(card.prices.variantUsd, selectedVariant, card.prices.usd)

	useEffect(() => {
		setVariantChoice(card.variants[0] || 'Normal')
		setCustomVariant('')
		setCondition('NM')
		setLanguageChoice('ES')
		setCustomLanguage('')
		setQuantity(1)
		setNotes('')
	}, [card.id])

	useEffect(() => {
		const previousFocus = document.activeElement as HTMLElement | null
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose()
			if (event.key !== 'Tab' || !dialogRef.current) return
			const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
			if (focusable.length === 0) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}
		document.addEventListener('keydown', onKeyDown)
		document.body.style.overflow = 'hidden'
		closeButtonRef.current?.focus()
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			document.body.style.overflow = ''
			previousFocus?.focus()
		}
	}, [onClose])

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		const variant = variantChoice === '__custom' ? customVariant.trim() : variantChoice
		const language = languageChoice === '__custom' ? customLanguage.trim() : languageChoice
		if (!variant || !language || quantity < 1) {
			setError('Choose a variant and language, and enter at least one copy.')
			return
		}
		setSaving(true)
		setError(null)
		try {
			const entry = await addTcgCollectionEntry({ cardId: card.id, variant, condition, language, quantity, notes: notes.trim() || null })
			onCardChange(entry.card)
			onAdded(entry)
			setQuantity(1)
			setNotes('')
		} catch (requestError) {
			setError(errorText(requestError, 'Could not add this card.'))
		} finally {
			setSaving(false)
		}
	}

	const handleRefresh = async () => {
		setRefreshing(true)
		setError(null)
		try {
			const result = await refreshTcgCard(card.id)
			if (!result.success || !result.card) throw new Error(result.error || 'Price refresh failed.')
			onCardChange(result.card)
		} catch (requestError) {
			setError(errorText(requestError, 'Price refresh is temporarily unavailable.'))
		} finally {
			setRefreshing(false)
		}
	}

	return createPortal(
		<div className='tcg-detail-overlay' onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
			<section ref={dialogRef} className='tcg-detail' role='dialog' aria-modal='true' aria-labelledby='tcg-card-title'>
				<header className='tcg-detail__header'>
					<div><span className='tcg-eyebrow'>{card.setName} · #{card.number}</span><h2 id='tcg-card-title'>{card.name}</h2>{card.nameEn && card.nameEn !== card.name && <p>{card.nameEn}</p>}</div>
					<button ref={closeButtonRef} type='button' className='tcg-detail__close' onClick={onClose} aria-label='Close card details'>×</button>
				</header>
				<div className='tcg-detail__body'>
					<div className='tcg-detail__visual'><CardArtwork card={card} large /></div>
					<div className='tcg-detail__content'>
						{loading && <div className='tcg-detail__loading' role='status'>Loading latest card details…</div>}
						<div className='tcg-detail__facts'><span><small>Rarity</small><strong>{card.rarity || 'Unknown'}</strong></span><span><small>Artist</small><strong>{card.artist || 'Unknown'}</strong></span><span><small>National Dex</small><strong>{card.nationalPokedexNumbers.length ? card.nationalPokedexNumbers.map((id) => `#${id}`).join(', ') : '—'}</strong></span></div>
						<section className='tcg-prices' aria-label='Market prices'>
							<div><span>Cardmarket</span><strong>{formatMoney(selectedEur, 'EUR')}</strong>{card.prices.cardmarketUrl && <a href={card.prices.cardmarketUrl} target='_blank' rel='noreferrer'>View listing ↗</a>}</div>
							<div><span>TCGPlayer</span><strong>{formatMoney(selectedUsd, 'USD')}</strong>{card.prices.tcgplayerUrl && <a href={card.prices.tcgplayerUrl} target='_blank' rel='noreferrer'>View listing ↗</a>}</div>
							<button type='button' className='tcg-button tcg-button--secondary' onClick={handleRefresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh price'}</button>
							<small className='tcg-prices__updated'>Updated {formatDate(card.prices.updatedAt)}</small>
						</section>

						<section className={`tcg-owned-combinations${collectionGroup ? ' tcg-owned-combinations--editable' : ''}`}>
							<h3>Your physical copies <span>{collectionGroup?.totalCopies ?? card.totalOwned} total</span></h3>
							{collectionGroup && onEntrySaved && onEntryDelete ? (
				collectionGroup.entries.length === 0 ? <p>No physical copies recorded yet.</p> : <div className='tcg-owned-combinations__entries'>{collectionGroup.entries.map((entry) => <CollectionEntryEditor entry={entry} key={entry.id} onSaved={onEntrySaved} onDelete={(item) => onEntryDelete(item, card)} />)}</div>
							) : card.owned.length === 0 ? <p>No physical copies recorded yet.</p> : <ul>{card.owned.map((entry) => <li key={entry.id}><strong>{entry.quantity}× {entry.variant}</strong><span>{entry.condition} · {entry.language}</span>{entry.notes && <small>{entry.notes}</small>}</li>)}</ul>}
						</section>

						<form className='tcg-add-form' onSubmit={handleSubmit}>
							<div className='tcg-section-heading'><div><span className='tcg-eyebrow'>Physical collection</span><h3>Add a copy</h3></div></div>
							<div className='tcg-form-grid'>
								<label className='tcg-field'><span>Variant</span><select value={variantChoice} onChange={(event) => setVariantChoice(event.target.value)}>{card.variants.map((variant) => <option value={variant} key={variant}>{variant}</option>)}{card.variants.length === 0 && <option value='Normal'>Normal</option>}<option value='__custom'>Custom…</option></select></label>
								{variantChoice === '__custom' && <label className='tcg-field'><span>Custom variant</span><input value={customVariant} onChange={(event) => setCustomVariant(event.target.value)} required placeholder='e.g. Reverse holo' /></label>}
								<label className='tcg-field'><span>Condition</span><select value={condition} onChange={(event) => setCondition(event.target.value)}>{CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
								<label className='tcg-field'><span>Language</span><select value={languageChoice} onChange={(event) => setLanguageChoice(event.target.value)}>{LANGUAGES.map((item) => <option key={item}>{item}</option>)}<option value='__custom'>Custom…</option></select></label>
								{languageChoice === '__custom' && <label className='tcg-field'><span>Custom language</span><input value={customLanguage} onChange={(event) => setCustomLanguage(event.target.value)} required placeholder='Language code or name' /></label>}
								<label className='tcg-field'><span>Quantity</span><input type='number' min='1' max='999' value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required /></label>
								<label className='tcg-field tcg-field--wide'><span>Notes <small>optional</small></span><textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder='Binder, grading details, provenance…' /></label>
							</div>
							<div className='tcg-add-form__estimate'>Selected variant estimate: <strong>{formatMoney(selectedEur, 'EUR')}</strong><span>{formatMoney(selectedUsd, 'USD')}</span></div>
							{error && <div className='tcg-form-error' role='alert'>{error}</div>}
							<button type='submit' className='tcg-button tcg-button--primary tcg-add-form__submit' disabled={saving}>{saving ? 'Adding…' : `Add ${quantity} to collection`}</button>
						</form>
					</div>
				</div>
			</section>
		</div>,
		document.body
	)
}

function CollectionEntryEditor({
	entry,
	onSaved,
	onDelete,
}: {
	entry: TcgCollectionEntryDto
	onSaved: (entry: UserCardDto) => void
	onDelete: (entry: TcgCollectionEntryDto) => void
}) {
	const [editing, setEditing] = useState(false)
	const [variant, setVariant] = useState(entry.variant)
	const [condition, setCondition] = useState(entry.condition)
	const [language, setLanguage] = useState(entry.language)
	const [quantity, setQuantity] = useState(entry.quantity)
	const [notes, setNotes] = useState(entry.notes ?? '')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const save = async (event: FormEvent) => {
		event.preventDefault()
		if (!variant.trim() || !language.trim() || quantity < 1) return setError('Variant, language, and a positive quantity are required.')
		setSaving(true)
		setError(null)
		try {
			const updated = await updateTcgCollectionEntry(entry.id, { variant: variant.trim(), condition, language: language.trim(), quantity, notes: notes.trim() || null })
			onSaved(updated)
			setEditing(false)
		} catch (requestError) {
			setError(errorText(requestError, 'Could not update this entry.'))
		} finally {
			setSaving(false)
		}
	}

	if (!editing) {
		return (
			<div className='tcg-entry'>
				<div className='tcg-entry__tags'><strong>{entry.quantity}× {entry.variant}</strong><span>{entry.condition}</span><span>{entry.language}</span></div>
				<div className='tcg-entry__values'><strong>{formatMoney(entry.totalValueEur, 'EUR')}</strong><small>{formatMoney(entry.totalValueUsd, 'USD')} · {formatMoney(entry.unitValueEur, 'EUR')} each</small></div>
				{entry.notes && <p>{entry.notes}</p>}
				<div className='tcg-entry__actions'><button type='button' onClick={() => setEditing(true)}>Edit</button><button type='button' className='tcg-entry__delete' onClick={() => onDelete(entry)}>Delete</button></div>
			</div>
		)
	}

	return (
		<form className='tcg-entry tcg-entry--editing' onSubmit={save}>
			<div className='tcg-entry__edit-grid'>
				<label className='tcg-field'><span>Variant</span><input value={variant} onChange={(event) => setVariant(event.target.value)} /></label>
				<label className='tcg-field'><span>Condition</span><select value={condition} onChange={(event) => setCondition(event.target.value)}>{CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
				<label className='tcg-field'><span>Language</span><input value={language} onChange={(event) => setLanguage(event.target.value)} /></label>
				<label className='tcg-field'><span>Quantity</span><input type='number' min='1' max='999' value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
				<label className='tcg-field tcg-field--wide'><span>Notes</span><textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
			</div>
			{error && <div className='tcg-form-error' role='alert'>{error}</div>}
			<div className='tcg-entry__actions'><button type='button' onClick={() => setEditing(false)} disabled={saving}>Cancel</button><button type='submit' className='tcg-entry__save' disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button></div>
		</form>
	)
}

function DeleteEntryDialog({ entry, card, deleting, onCancel, onConfirm }: { entry: TcgCollectionEntryDto; card: TcgCardDto; deleting: boolean; onCancel: () => void; onConfirm: () => void }) {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCancel()
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [onCancel])
	return createPortal(
		<div className='tcg-confirm-overlay' onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
			<section className='tcg-confirm' role='alertdialog' aria-modal='true' aria-labelledby='tcg-delete-title'>
				<span className='tcg-confirm__mark' aria-hidden='true'>!</span><h2 id='tcg-delete-title'>Remove this physical entry?</h2>
				<p>{entry.quantity}× {card.name} · {entry.variant} · {entry.condition} · {entry.language}</p>
				<div><button type='button' className='tcg-button tcg-button--secondary' onClick={onCancel} disabled={deleting}>Cancel</button><button type='button' className='tcg-button tcg-button--danger' onClick={onConfirm} disabled={deleting}>{deleting ? 'Removing…' : 'Remove entry'}</button></div>
			</section>
		</div>, document.body
	)
}

function CollectionCard({
	group,
	sets,
	selected,
	onOpen,
	onSelectedChange,
}: {
	group: TcgCollectionGroupDto
	sets: TcgSetDto[]
	selected: boolean
	onOpen: () => void
	onSelectedChange: (selected: boolean) => void
}) {
	const conditions = Array.from(new Set(group.entries.map((entry) => entry.condition)))
	const languages = Array.from(new Set(group.entries.map((entry) => entry.language)))
	const checkedAt = group.card.priceCheckedAt ?? group.card.prices.updatedAt
	return (
		<article className={`tcg-collection-card${selected ? ' is-selected' : ''}`}>
			<label className='tcg-collection-card__select' onClick={(event) => event.stopPropagation()}>
				<input type='checkbox' checked={selected} onChange={(event) => onSelectedChange(event.target.checked)} aria-label={`Select ${group.card.name}`} />
				<span aria-hidden='true'>✓</span>
			</label>
			<button type='button' className='tcg-collection-card__main' onClick={onOpen} aria-label={`Edit ${group.card.name} collection entries`}>
				<div className='tcg-collection-card__art'>
					<CardArtwork card={group.card} />
					<span className='tcg-collection-card__copies'>{group.totalCopies}×</span>
				</div>
				<div className='tcg-collection-card__body'>
					<strong title={group.card.name}>{group.card.name}</strong>
					<span>{group.card.setName}</span>
					<small>{formatCollectorReference(group.card, sets)}</small>
					<div className='tcg-collection-card__chips' aria-label={`Conditions: ${conditions.join(', ')}. Languages: ${languages.join(', ')}`}>
						{conditions.slice(0, 2).map((condition) => <b key={`condition-${condition}`}>{condition}</b>)}
						{conditions.length > 2 && <b>+{conditions.length - 2}</b>}
						{languages.slice(0, 2).map((language) => <i key={`language-${language}`}>{language}</i>)}
						{languages.length > 2 && <i>+{languages.length - 2}</i>}
					</div>
				</div>
				<footer className='tcg-collection-card__footer'>
					<span><strong>{formatMoney(group.totalValueEur, 'EUR')}</strong><small>{formatMoney(group.totalValueUsd, 'USD')}</small></span>
					<span className={group.card.lastRefreshError ? 'has-error' : ''} title={group.card.lastRefreshError || undefined}>{group.card.lastRefreshError ? 'Price check failed' : checkedAt ? `Checked ${formatDate(checkedAt)}` : 'Price not checked'}</span>
				</footer>
			</button>
		</article>
	)
}

function CollectionBulkBar({ count, busy, onRefresh, onDelete, onClear }: { count: number; busy: boolean; onRefresh: () => void; onDelete: () => void; onClear: () => void }) {
	if (count === 0) return null
	return (
		<div className='tcg-bulk-bar' role='region' aria-label='Selected card actions'>
			<strong>{count} selected</strong>
			<div>
				<button type='button' className='tcg-button tcg-button--secondary' onClick={onRefresh} disabled={busy}>Refresh prices</button>
				<button type='button' className='tcg-button tcg-button--danger' onClick={onDelete} disabled={busy}>Delete</button>
				<button type='button' className='tcg-bulk-bar__clear' onClick={onClear} disabled={busy} aria-label='Clear card selection'>×</button>
			</div>
		</div>
	)
}

function BulkDeleteDialog({ groups, deleting, onCancel, onConfirm }: { groups: TcgCollectionGroupDto[]; deleting: boolean; onCancel: () => void; onConfirm: () => void }) {
	const cancelRef = useRef<HTMLButtonElement | null>(null)
	const copies = groups.reduce((total, group) => total + group.totalCopies, 0)
	const entries = groups.reduce((total, group) => total + group.entries.length, 0)
	useEffect(() => {
		cancelRef.current?.focus()
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCancel()
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [onCancel])
	return createPortal(
		<div className='tcg-confirm-overlay'>
			<section className='tcg-confirm' role='alertdialog' aria-modal='true' aria-labelledby='tcg-bulk-delete-title' aria-describedby='tcg-bulk-delete-copy'>
				<span className='tcg-confirm__mark' aria-hidden='true'>!</span>
				<h2 id='tcg-bulk-delete-title'>Delete selected cards?</h2>
				<p id='tcg-bulk-delete-copy'>This removes {groups.length} card {groups.length === 1 ? 'print' : 'prints'}, {entries} physical {entries === 1 ? 'entry' : 'entries'}, and {copies} total {copies === 1 ? 'copy' : 'copies'} from your collection.</p>
				<div><button ref={cancelRef} type='button' className='tcg-button tcg-button--secondary' onClick={onCancel} disabled={deleting}>Cancel</button><button type='button' className='tcg-button tcg-button--danger' onClick={onConfirm} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete selected'}</button></div>
			</section>
		</div>, document.body
	)
}

export function CardsPage() {
	const navigate = useNavigate()
	const { view: routeView, setProviderId: routeSetProviderId } = useParams<{ view?: string; setProviderId?: string }>()
	const routeCardsView: CardsView = routeSetProviderId ? 'sets' : parseCardsView(routeView)
	const [view, setView] = useState<CardsView>(routeCardsView)
	const [sets, setSets] = useState<TcgSetDto[]>([])
	const [setsLoading, setSetsLoading] = useState(true)
	const [setsError, setSetsError] = useState<string | null>(null)
	const [stats, setStats] = useState<TcgCollectionStatsDto | null>(null)
	const [statsLoading, setStatsLoading] = useState(false)
	const [statsError, setStatsError] = useState<string | null>(null)
	const [notice, setNotice] = useState<Notice | null>(null)
	const [retryVersion, setRetryVersion] = useState(0)
	const [collectionVersion, setCollectionVersion] = useState(0)
	const [statsVersion, setStatsVersion] = useState(0)

	const [searchDraft, setSearchDraft] = useState<SearchFilters>({ query: '', setId: '', number: '', speciesId: '' })
	const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '', setId: '', number: '', speciesId: '' })
	const [searchResult, setSearchResult] = useState<TcgCardPageDto>(EMPTY_CARD_PAGE)
	const [searchPage, setSearchPage] = useState(1)
	const [searchLoading, setSearchLoading] = useState(false)
	const [searchError, setSearchError] = useState<string | null>(null)

	const [setQuery, setSetQuery] = useState('')
	const [selectedSetProviderId, setSelectedSetProviderId] = useState<string | null>(null)
	const [setResult, setSetResult] = useState<TcgCardPageDto>({ ...EMPTY_CARD_PAGE, pageSize: GRID_PAGE_SIZE })
	const [setPage, setSetPage] = useState(1)
	const [setCardsLoading, setSetCardsLoading] = useState(false)
	const [setCardsError, setSetCardsError] = useState<string | null>(null)
	const [quickAddingId, setQuickAddingId] = useState<number | null>(null)
	const [assetCaching, setAssetCaching] = useState<string | null>(null)

	const [collectionDraft, setCollectionDraft] = useState<CollectionFilters>({ query: '', setId: '', language: '', condition: '' })
	const [collectionFilters, setCollectionFilters] = useState<CollectionFilters>({ query: '', setId: '', language: '', condition: '' })
	const [collectionResult, setCollectionResult] = useState<TcgCollectionPageDto>(EMPTY_COLLECTION_PAGE)
	const [collectionPage, setCollectionPage] = useState(1)
	const [collectionLoading, setCollectionLoading] = useState(false)
	const [collectionError, setCollectionError] = useState<string | null>(null)
	const [deleteEntry, setDeleteEntry] = useState<{ entry: TcgCollectionEntryDto; card: TcgCardDto } | null>(null)
	const [deletingEntry, setDeletingEntry] = useState(false)
	const [selectedCardIds, setSelectedCardIds] = useState<Set<number>>(new Set())
	const [bulkAction, setBulkAction] = useState<'refresh' | 'delete' | 'refresh-all' | null>(null)
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

	const [selectedCard, setSelectedCard] = useState<TcgCardDto | null>(null)
	const [editorCardId, setEditorCardId] = useState<number | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const requestRef = useRef({ search: 0, set: 0, collection: 0 })

	useEffect(() => {
		setView(routeCardsView)
		if (!routeSetProviderId && (routeView === 'dashboard' || (routeView && routeCardsView === 'dashboard'))) {
			navigate('/cards', { replace: true })
		}
	}, [navigate, routeCardsView, routeView, routeSetProviderId])

	const changeView = useCallback((next: CardsView) => {
		navigate(next === 'dashboard' ? '/cards' : `/cards/${next}`)
	}, [navigate])

	const loadSets = useCallback(async () => {
		setSetsLoading(true)
		setSetsError(null)
		try {
			const result = await getTcgSets()
			setSets(result)
			const routeSet = routeSetProviderId
				? result.find((set) => set.providerSetId === routeSetProviderId || slugifyTcgSet(set.name) === routeSetProviderId)
				: null
			setSelectedSetProviderId((current) => routeSet?.providerSetId ?? current ?? result[0]?.providerSetId ?? null)
		} catch (error) {
			setSetsError(errorText(error, 'Could not load the card catalog.'))
		} finally {
			setSetsLoading(false)
		}
	}, [routeSetProviderId])

	const loadStats = useCallback(async () => {
		setStatsLoading(true)
		setStatsError(null)
		try {
			setStats(await getTcgCollectionStats())
		} catch (error) {
			setStatsError(errorText(error, 'Could not load collection insights.'))
		} finally {
			setStatsLoading(false)
		}
	}, [])

	useEffect(() => { loadSets() }, [loadSets])
	useEffect(() => { if (view === 'dashboard') loadStats() }, [view, loadStats, statsVersion])

	useEffect(() => {
		if (view !== 'search') return
		const requestId = ++requestRef.current.search
		setSearchLoading(true)
		setSearchError(null)
		searchTcgCards({
			query: searchFilters.query || undefined,
			setId: searchFilters.setId ? Number(searchFilters.setId) : undefined,
			number: searchFilters.number || undefined,
			speciesId: searchFilters.speciesId ? Number(searchFilters.speciesId) : undefined,
			page: searchPage,
			pageSize: SEARCH_PAGE_SIZE,
		}).then((result) => {
			if (requestRef.current.search === requestId) setSearchResult(result)
		}).catch((error) => {
			if (requestRef.current.search === requestId) setSearchError(errorText(error, 'Card search is unavailable.'))
		}).finally(() => {
			if (requestRef.current.search === requestId) setSearchLoading(false)
		})
	}, [view, searchFilters, searchPage, retryVersion])

	useEffect(() => {
		if (view !== 'sets' || !selectedSetProviderId) return
		const requestId = ++requestRef.current.set
		setSetCardsLoading(true)
		setSetCardsError(null)
		getTcgSetCards(selectedSetProviderId, setPage, GRID_PAGE_SIZE).then((result) => {
			if (requestRef.current.set === requestId) setSetResult(result)
		}).catch((error) => {
			if (requestRef.current.set === requestId) setSetCardsError(errorText(error, 'This set could not be loaded.'))
		}).finally(() => {
			if (requestRef.current.set === requestId) setSetCardsLoading(false)
		})
	}, [view, selectedSetProviderId, setPage, retryVersion])

	useEffect(() => {
		if (view !== 'collection') return
		const requestId = ++requestRef.current.collection
		setCollectionLoading(true)
		setCollectionError(null)
		getTcgCollection({
			query: collectionFilters.query || undefined,
			setId: collectionFilters.setId ? Number(collectionFilters.setId) : undefined,
			language: collectionFilters.language || undefined,
			condition: collectionFilters.condition || undefined,
			page: collectionPage,
			pageSize: GRID_PAGE_SIZE,
		}).then((result) => {
			if (requestRef.current.collection === requestId) setCollectionResult(result)
		}).catch((error) => {
			if (requestRef.current.collection === requestId) setCollectionError(errorText(error, 'Your physical collection could not be loaded.'))
		}).finally(() => {
			if (requestRef.current.collection === requestId) setCollectionLoading(false)
		})
	}, [view, collectionFilters, collectionPage, collectionVersion, retryVersion])

	const filteredSets = useMemo(() => {
		const query = setQuery.trim().toLocaleLowerCase()
		return query ? sets.filter((set) => `${set.name} ${set.nameEn ?? ''} ${set.series ?? ''} ${set.officialCode ?? ''} ${set.providerSetId}`.toLocaleLowerCase().includes(query)) : sets
	}, [setQuery, sets])
	const selectedSet = sets.find((set) => set.providerSetId === selectedSetProviderId) ?? null

	const selectedGroups = useMemo(() => collectionResult.items.filter((group) => selectedCardIds.has(group.card.id)), [collectionResult.items, selectedCardIds])
	const selectedCollectionGroup = editorCardId === null ? null : collectionResult.items.find((group) => group.card.id === editorCardId) ?? null

	const submitSearch = (event: FormEvent) => {
		event.preventDefault()
		setSearchPage(1)
		setSearchFilters(searchDraft)
	}

	const submitCollectionFilters = (event: FormEvent) => {
		event.preventDefault()
		setCollectionPage(1)
		setCollectionFilters(collectionDraft)
	}

	const openCard = useCallback(async (card: TcgCardDto) => {
		setEditorCardId(null)
		setSelectedCard(card)
		setDetailLoading(true)
		try {
			setSelectedCard(await getTcgCard(card.id))
		} catch {
			// The grid payload is complete enough for the panel when a detail refresh fails.
		} finally {
			setDetailLoading(false)
		}
	}, [])

	const openCollectionCard = useCallback(async (group: TcgCollectionGroupDto) => {
		setEditorCardId(group.card.id)
		setSelectedCard(group.card)
		setDetailLoading(true)
		try {
			setSelectedCard(await getTcgCard(group.card.id))
		} catch {
			// The grouped collection payload remains editable if a detail refresh fails.
		} finally {
			setDetailLoading(false)
		}
	}, [])

	const replaceCardEverywhere = useCallback((card: TcgCardDto) => {
		setSearchResult((current) => ({ ...current, items: current.items.map((item) => item.id === card.id ? card : item) }))
		setSetResult((current) => ({ ...current, items: current.items.map((item) => item.id === card.id ? card : item) }))
		setCollectionResult((current) => ({ ...current, items: current.items.map((group) => group.card.id === card.id ? { ...group, card } : group) }))
		setSelectedCard((current) => current?.id === card.id ? card : current)
	}, [])

	const openMissingSpecies = (speciesId: number) => {
		const next = { query: '', setId: '', number: '', speciesId: String(speciesId) }
		setSearchDraft(next)
		setSearchFilters(next)
		setSearchPage(1)
		changeView('search')
	}

	const openSet = (providerSetId: string) => {
		const set = sets.find((item) => item.providerSetId === providerSetId)
		setSelectedSetProviderId(providerSetId)
		setSetPage(1)
		navigate(`/cards/sets/${slugifyTcgSet(set?.name ?? providerSetId)}`)
	}

	const cacheSetAssets = async (providerSetId: string) => {
		setAssetCaching(providerSetId)
		setNotice(null)
		try {
			const result = await cacheTcgSetAssets(providerSetId)
			setNotice({ type: 'success', text: result.message ?? `Image cache started for ${result.cached ?? 0} of ${result.requested ?? 0} cards.` })
		} catch (error) {
			setNotice({ type: 'error', text: errorText(error, 'Could not cache this set images.') })
		} finally {
			setAssetCaching(null)
		}
	}

	const cacheAllAssets = async () => {
		setAssetCaching('all')
		setNotice(null)
		try {
			const result = await cacheAllTcgAssets()
			setNotice({ type: 'success', text: result.message ?? `Image cache started for ${result.cached ?? 0} of ${result.requested ?? 0} cards.` })
		} catch (error) {
			setNotice({ type: 'error', text: errorText(error, 'Could not cache all set images.') })
		} finally {
			setAssetCaching(null)
		}
	}

	const handleAdded = (entry: UserCardDto) => {
		setNotice({ type: 'success', text: `${entry.quantity}× ${entry.card.name} is now in your physical collection.` })
		replaceCardEverywhere(entry.card)
		setCollectionVersion((value) => value + 1)
		setStatsVersion((value) => value + 1)
	}

	const quickAdd = async (card: TcgCardDto) => {
		setQuickAddingId(card.id)
		setNotice(null)
		try {
			const entry = await addTcgCollectionEntry({ cardId: card.id, variant: card.variants[0] || 'Normal', condition: 'NM', language: 'ES', quantity: 1, notes: null })
			setNotice({ type: 'success', text: `Added 1× ${entry.card.name} · ${entry.variant} · NM · ES.` })
			replaceCardEverywhere(entry.card)
			setStatsVersion((value) => value + 1)
		} catch (error) {
			setNotice({ type: 'error', text: errorText(error, 'Could not add this card.') })
		} finally {
			setQuickAddingId(null)
		}
	}

	const updateCollectionItem = (updated: UserCardDto) => {
		setCollectionResult((current) => ({
			...current,
			items: current.items.map((group) => group.card.id !== updated.card.id ? group : {
				...group,
				card: updated.card,
				entries: group.entries.map((entry) => entry.id === updated.id ? toCollectionEntry(updated) : entry),
			}),
		}))
		setSelectedCard(updated.card)
		setNotice({ type: 'success', text: `${updated.card.name} entry updated.` })
		setCollectionVersion((value) => value + 1)
		setStatsVersion((value) => value + 1)
	}

	const confirmDelete = async () => {
		if (!deleteEntry) return
		setDeletingEntry(true)
		try {
			await deleteTcgCollectionEntry(deleteEntry.entry.id)
			setCollectionResult((current) => ({
				...current,
				items: current.items.map((group) => group.card.id !== deleteEntry.card.id ? group : { ...group, entries: group.entries.filter((entry) => entry.id !== deleteEntry.entry.id), totalCopies: Math.max(0, group.totalCopies - deleteEntry.entry.quantity) }).filter((group) => group.entries.length > 0),
				totalCount: deleteEntry.entry.quantity === deleteEntry.card.totalOwned ? Math.max(0, current.totalCount - 1) : current.totalCount,
			}))
			setNotice({ type: 'success', text: `${deleteEntry.card.name} entry removed.` })
			setDeleteEntry(null)
			setCollectionVersion((value) => value + 1)
			setStatsVersion((value) => value + 1)
		} catch (error) {
			setNotice({ type: 'error', text: errorText(error, 'Could not remove this entry.') })
		} finally {
			setDeletingEntry(false)
		}
	}

	const setCardSelected = (cardId: number, selected: boolean) => {
		setSelectedCardIds((current) => {
			const next = new Set(current)
			if (selected) next.add(cardId)
			else next.delete(cardId)
			return next
		})
	}

	const refreshSelectedCards = async () => {
		const requestedIds = Array.from(selectedCardIds)
		if (requestedIds.length === 0) return
		setBulkAction('refresh')
		setNotice(null)
		try {
			const result = await refreshTcgCards({ cardIds: requestedIds, ownedOnly: false })
			result.items.forEach((item) => { if (item.success && item.card) replaceCardEverywhere(item.card) })
			const failedIds = new Set(requestedIds)
			result.items.forEach((item) => { if (item.success) failedIds.delete(item.cardId) })
			setSelectedCardIds(failedIds)
			setCollectionVersion((value) => value + 1)
			const failures = failedIds.size
			setNotice({
				type: failures > 0 || result.truncated ? 'error' : 'success',
				text: failures > 0 || result.truncated
					? `${result.items.filter((item) => item.success).length} refreshed. ${failures} still selected; retry them or check your API key and provider status.${result.truncated ? ' The server limited this batch.' : ''}`
					: `${result.processed} card prices refreshed.`,
			})
		} catch (error) {
			setNotice({ type: 'error', text: `${errorText(error, 'Could not refresh selected prices.')} Your selection was kept so you can retry.` })
		} finally {
			setBulkAction(null)
		}
	}

	const refreshOwnedCollection = async () => {
		setBulkAction('refresh-all')
		setNotice(null)
		try {
			const result = await refreshTcgCards({ ownedOnly: true })
			result.items.forEach((item) => { if (item.success && item.card) replaceCardEverywhere(item.card) })
			setCollectionVersion((value) => value + 1)
			const failures = result.items.filter((item) => !item.success).length
			setNotice({ type: failures || result.truncated ? 'error' : 'success', text: failures || result.truncated ? `${result.processed - failures} prices refreshed; ${failures} failed.${result.truncated ? ' The server limited this batch; run it again to continue.' : ' Check Settings if supported market coverage is unavailable.'}` : `${result.processed} owned card prices refreshed.` })
		} catch (error) {
			setNotice({ type: 'error', text: errorText(error, 'Could not refresh owned card prices. Check your connection and try again.') })
		} finally {
			setBulkAction(null)
		}
	}

	const confirmBulkDelete = async () => {
		const ids = Array.from(selectedCardIds)
		if (ids.length === 0) return
		setBulkAction('delete')
		setNotice(null)
		try {
			await deleteTcgCollectionCards(ids)
			setCollectionResult((current) => ({ ...current, items: current.items.filter((group) => !selectedCardIds.has(group.card.id)), totalCount: Math.max(0, current.totalCount - ids.length) }))
			setSelectedCardIds(new Set())
			setBulkDeleteOpen(false)
			setStatsVersion((value) => value + 1)
			setNotice({ type: 'success', text: `${ids.length} selected card ${ids.length === 1 ? 'print was' : 'prints were'} removed from your collection.` })
		} catch (error) {
			setNotice({ type: 'error', text: `${errorText(error, 'Could not delete selected cards.')} Your selection was kept so you can retry.` })
		} finally {
			setBulkAction(null)
		}
	}

	return (
		<div className='tcg-page'>
			<header className='tcg-page__hero'>
				<div className='tcg-page__hero-mark'><TcgIcon name='cards' /></div>
				<div><span className='tcg-eyebrow'>Physical Pokémon TCG</span><h1>Card Vault</h1><p>Catalog every print, finish binder goals, and keep market context close without turning your collection into a spreadsheet.</p></div>
				{stats && <div className='tcg-page__hero-stat'><strong>{stats.totalCopies.toLocaleString()}</strong><span>cards protected</span></div>}
			</header>

			<nav className='tcg-tabs' aria-label='Card collection views'>
				{([
					['dashboard', 'Dashboard'], ['search', 'Search'], ['sets', 'Sets'], ['collection', 'Collection'],
				] as [CardsView, string][]).map(([key, label]) => (
					<button type='button' key={key} className={view === key ? 'is-active' : ''} onClick={() => changeView(key)} aria-current={view === key ? 'page' : undefined}><TcgIcon name={key} /><span>{label}</span></button>
				))}
			</nav>

			{notice && <div className={`tcg-notice tcg-notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}><span>{notice.text}</span><button type='button' onClick={() => setNotice(null)} aria-label='Dismiss notice'>×</button></div>}

			<div className='tcg-page__content'>
				{view === 'dashboard' && <DashboardView stats={stats} loading={statsLoading} error={statsError} onRetry={loadStats} onMissingSpecies={openMissingSpecies} onSet={openSet} onOpenCard={openCard} />}

				{view === 'search' && (
					<section className='tcg-catalog-view'>
						<div className='tcg-view-heading'><div><span className='tcg-eyebrow'>Global catalog</span><h2>Find a card</h2><p>Search Spanish or English names, then narrow the exact print.</p></div>{searchResult.totalCount !== null && <span>{searchResult.totalCount.toLocaleString()} results</span>}</div>
						<form className='tcg-toolbar' onSubmit={submitSearch}>
							<label className='tcg-field tcg-field--search'><span>Name or collector reference</span><input type='search' value={searchDraft.query} onChange={(event) => setSearchDraft((current) => ({ ...current, query: event.target.value }))} placeholder='Mewtwo, SVP 216, SSP 132/191…' /></label>
							<label className='tcg-field'><span>Set</span><select value={searchDraft.setId} onChange={(event) => setSearchDraft((current) => ({ ...current, setId: event.target.value }))}><option value=''>All sets</option>{sets.map((set) => <option value={set.id} key={set.id}>{set.name}</option>)}</select></label>
							<label className='tcg-field tcg-field--compact'><span>Collector number</span><input value={searchDraft.number} onChange={(event) => setSearchDraft((current) => ({ ...current, number: event.target.value }))} placeholder='216 or 132/191' /></label>
							<label className='tcg-field tcg-field--compact'><span>National Dex</span><input type='number' min='1' value={searchDraft.speciesId} onChange={(event) => setSearchDraft((current) => ({ ...current, speciesId: event.target.value }))} placeholder='25' /></label>
							<button type='submit' className='tcg-button tcg-button--primary'><TcgIcon name='search' /> Search</button>
						</form>
						{searchError ? <TcgState title='The card catalog is not responding' message='TCGdex may be experiencing an outage. Wait a moment and retry; existing collection data is unaffected.' action={{ label: 'Retry search', onClick: () => setRetryVersion((value) => value + 1) }} /> : searchLoading ? <TcgState busy title='Searching the catalog' message='Matching cards and current ownership…' /> : searchResult.items.length === 0 ? <TcgState title='No matching cards' message='Try a broader name, remove a set filter, or check the collector number.' /> : <><TcgCardGrid cards={searchResult.items} sets={sets} onOpen={openCard} /><Pagination page={searchResult.page} hasMore={searchResult.hasMore} totalCount={searchResult.totalCount} pageSize={searchResult.pageSize} onChange={setSearchPage} /></>}
					</section>
				)}

				{view === 'sets' && (
					<section className='tcg-sets-view'>
						<aside className='tcg-set-picker'>
							<div className='tcg-set-picker__header'><span className='tcg-eyebrow'>Catalog</span><h2>Sets</h2><input type='search' value={setQuery} onChange={(event) => setSetQuery(event.target.value)} placeholder='Search sets…' aria-label='Search card sets' /><button type='button' className='tcg-button tcg-button--secondary' onClick={cacheAllAssets} disabled={assetCaching !== null}>{assetCaching === 'all' ? 'Caching…' : 'Cache all images'}</button></div>
							{setsLoading ? <p className='tcg-set-picker__state'>Loading sets…</p> : setsError ? <div className='tcg-set-picker__state'><p>Set catalog unavailable.</p><button type='button' onClick={loadSets}>Retry</button></div> : filteredSets.length === 0 ? <p className='tcg-set-picker__state'>No sets match “{setQuery}”.</p> : (
								<div className='tcg-set-picker__list'>{filteredSets.map((set) => <button type='button' key={set.id} className={selectedSetProviderId === set.providerSetId ? 'is-active' : ''} onClick={() => openSet(set.providerSetId)}><span className='tcg-set-picker__symbol'>{set.symbolUrl ? <SafeImage src={set.symbolUrl} /> : <TcgIcon name='cards' />}</span><span><strong>{set.name}</strong><small>{set.series || `${set.total} cards`}</small><ProgressBar value={set.completionPercent} label={set.name} /></span><b>{Math.round(set.completionPercent)}%</b></button>)}</div>
							)}
						</aside>
						<div className='tcg-set-content'>
							{selectedSet ? <header className='tcg-set-content__header'><div className='tcg-set-content__identity'>{selectedSet.logoUrl && <SafeImage src={selectedSet.logoUrl} />}<div><span className='tcg-eyebrow'>{selectedSet.series || 'Pokémon TCG set'}</span><h2>{selectedSet.name}</h2><p>{selectedSet.releaseDate ? `Released ${formatDate(selectedSet.releaseDate)} · ` : ''}{selectedSet.printedTotal} printed · {selectedSet.total} cataloged</p></div></div><div className='tcg-set-content__progress'><strong>{selectedSet.ownedUniqueCards} / {selectedSet.total}</strong><span>unique owned · {selectedSet.ownedCopies} copies</span><ProgressBar value={selectedSet.completionPercent} label={selectedSet.name} /><button type='button' className='tcg-button tcg-button--secondary' onClick={() => cacheSetAssets(selectedSet.providerSetId)} disabled={assetCaching !== null}>{assetCaching === selectedSet.providerSetId ? 'Caching…' : 'Cache set images'}</button></div></header> : <TcgState title='Choose a set' message='Select a set to open its full printable checklist.' />}
							{selectedSet && (setCardsError ? <TcgState title='This set is temporarily unavailable' message='The provider did not return its card list. Your tracked cards remain safe.' action={{ label: 'Retry set', onClick: () => setRetryVersion((value) => value + 1) }} /> : setCardsLoading ? <TcgState busy title='Opening the checklist' message={`Loading ${selectedSet.name}…`} /> : setResult.items.length === 0 ? <TcgState title='No cards cached for this set' message='The catalog may still be syncing from TCGdex. Retry shortly or choose another set.' action={{ label: 'Retry catalog', onClick: () => setRetryVersion((value) => value + 1) }} /> : <><div className='tcg-set-content__hint'><span>✓ Owned cards show their total quantity.</span><span>Quick +1 uses the first provider variant, NM condition, and ES language.</span></div><TcgCardGrid cards={setResult.items} sets={sets} onOpen={openCard} onQuickAdd={quickAdd} quickAddingId={quickAddingId} setChecklist /><Pagination page={setResult.page} hasMore={setResult.hasMore} totalCount={setResult.totalCount} pageSize={setResult.pageSize} onChange={setSetPage} /></>)}
						</div>
					</section>
				)}

				{view === 'collection' && (
					<section className='tcg-collection-view'>
						<div className='tcg-view-heading tcg-view-heading--collection'><div><span className='tcg-eyebrow'>Your physical inventory</span><h2>Binder grid</h2><p>One card print per slot. Open a card to edit its variants, condition, language, and quantities.</p></div><div className='tcg-collection-heading__actions'><span>{collectionResult.totalCount.toLocaleString()} unique prints</span><button type='button' className='tcg-button tcg-button--secondary' onClick={refreshOwnedCollection} disabled={bulkAction !== null || collectionResult.totalCount === 0}>{bulkAction === 'refresh-all' ? 'Refreshing owned…' : 'Refresh owned prices'}</button></div></div>
						<form className='tcg-toolbar tcg-toolbar--collection' onSubmit={submitCollectionFilters}>
							<label className='tcg-field tcg-field--search'><span>Name or number</span><input type='search' value={collectionDraft.query} onChange={(event) => setCollectionDraft((current) => ({ ...current, query: event.target.value }))} placeholder='Card name or collector number…' /></label>
							<label className='tcg-field'><span>Set</span><select value={collectionDraft.setId} onChange={(event) => setCollectionDraft((current) => ({ ...current, setId: event.target.value }))}><option value=''>All sets</option>{sets.map((set) => <option value={set.id} key={set.id}>{set.name}</option>)}</select></label>
							<label className='tcg-field'><span>Language</span><select value={collectionDraft.language} onChange={(event) => setCollectionDraft((current) => ({ ...current, language: event.target.value }))}><option value=''>All languages</option>{LANGUAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
							<label className='tcg-field'><span>Condition</span><select value={collectionDraft.condition} onChange={(event) => setCollectionDraft((current) => ({ ...current, condition: event.target.value }))}><option value=''>All conditions</option>{CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
							<button type='submit' className='tcg-button tcg-button--primary'>Apply filters</button>
						</form>
						{collectionError ? <TcgState title='Your collection could not be loaded' message='The BeastVault API may be temporarily unavailable. No local changes were made.' action={{ label: 'Try again', onClick: () => setRetryVersion((value) => value + 1) }} /> : collectionLoading ? <TcgState busy title='Organizing your binder' message='Grouping physical entries by card print…' /> : collectionResult.items.length === 0 ? <TcgState title='No physical cards found' message={collectionResult.totalCount === 0 ? 'Start in Search or Sets, open a card, and add your first physical copy.' : 'No cards match these filters. Clear one or more filters and try again.'} action={collectionResult.totalCount === 0 ? { label: 'Search cards', onClick: () => setView('search') } : undefined} /> : <><div className='tcg-collection-grid'>{collectionResult.items.map((group) => <CollectionCard key={group.card.id} group={group} sets={sets} selected={selectedCardIds.has(group.card.id)} onOpen={() => openCollectionCard(group)} onSelectedChange={(selected) => setCardSelected(group.card.id, selected)} />)}</div><Pagination page={collectionResult.page} hasMore={collectionResult.page * collectionResult.pageSize < collectionResult.totalCount} totalCount={collectionResult.totalCount} pageSize={collectionResult.pageSize} onChange={(page) => { setSelectedCardIds(new Set()); setCollectionPage(page) }} /></>}
						<CollectionBulkBar count={selectedCardIds.size} busy={bulkAction !== null} onRefresh={refreshSelectedCards} onDelete={() => setBulkDeleteOpen(true)} onClear={() => setSelectedCardIds(new Set())} />
					</section>
				)}
			</div>

			<footer className='tcg-footer'>Card data and images are provided by TCGdex. Market references may link to Cardmarket and TCGplayer. BeastVault is an independent collection tool and is not affiliated with, endorsed, or sponsored by The Pokémon Company, Nintendo, Creatures, Game Freak, Cardmarket, or TCGplayer.</footer>

			{selectedCard && <CardDetailModal card={selectedCard} loading={detailLoading} collectionGroup={selectedCollectionGroup} onClose={() => { setSelectedCard(null); setEditorCardId(null) }} onCardChange={replaceCardEverywhere} onAdded={handleAdded} onEntrySaved={selectedCollectionGroup ? updateCollectionItem : undefined} onEntryDelete={selectedCollectionGroup ? (entry, card) => setDeleteEntry({ entry, card }) : undefined} />}
			{deleteEntry && <DeleteEntryDialog entry={deleteEntry.entry} card={deleteEntry.card} deleting={deletingEntry} onCancel={() => setDeleteEntry(null)} onConfirm={confirmDelete} />}
			{bulkDeleteOpen && <BulkDeleteDialog groups={selectedGroups} deleting={bulkAction === 'delete'} onCancel={() => setBulkDeleteOpen(false)} onConfirm={confirmBulkDelete} />}
		</div>
	)
}
