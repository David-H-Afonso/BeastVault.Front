import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type DragEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/ConfirmDialog'
import { useUISettings } from '@/hooks/useUISettings'
import {
	deleteSaveFile,
	downloadSaveFile,
	getSaveFile,
	getSaveFiles,
	importSavePokemon,
	updateSaveFile,
	uploadSaveFiles,
	type SaveFileDetailDto,
	type SaveFileSummaryDto,
	type SaveFileUploadResultDto,
	type SavePokedexEntryDto,
	type SavePokemonPreviewDto,
} from '@/services/SaveFiles'
import {
	buildSpritesForId,
	getPreferredSpriteFromDto,
} from '@/utils/spriteUtils'
import './SavesPage.scss'

type DetailTab = 'trainer' | 'pokemon' | 'pokedex'
type PokedexFilter = 'seen' | 'caught' | 'missing'
type Notice = { type: 'success' | 'error'; text: string }

const SUPPORTED_FILE_COPY =
	'.sav, .dat, .dsv, .srm, .fla, .SaveRAM, .bin, .gci, .raw, .duc, .zip, .bak, and extensionless main files'

const formatBytes = (bytes: number) => {
	if (!Number.isFinite(bytes) || bytes < 1) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB']
	const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
	const value = bytes / 1024 ** unit
	return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`
}

const formatDate = (value: string) => {
	const date = new Date(value)
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const getGenderLabel = (gender: number) => {
	if (gender === 0) return 'Male'
	if (gender === 1) return 'Female'
	return 'Unspecified'
}

const getTrainerSpriteName = (originGame: number, gender: number) => {
	const female = gender === 1
	if ([4, 5, 35, 36, 37, 38, 53, 54, 59].includes(originGame)) return female ? 'green' : 'red'
	if ([7, 8, 39, 40, 41, 55, 56, 65].includes(originGame)) return female ? 'lyra' : 'ethan'
	if ([1, 2, 3, 57, 58, 60, 61, 62, 70].includes(originGame)) return female ? 'may' : 'brendan'
	if ([10, 11, 12, 48, 49, 63, 64, 75].includes(originGame)) return female ? 'dawn' : 'lucas'
	if ([20, 21, 66].includes(originGame)) return female ? 'hilda' : 'hilbert'
	if ([22, 23, 67].includes(originGame)) return female ? 'rosa' : 'nate'
	if ([24, 25, 68, 69].includes(originGame)) return female ? 'serena' : 'calem'
	if ([26, 27, 71].includes(originGame)) return female ? 'may' : 'brendan'
	if ([30, 31, 32, 33, 72].includes(originGame)) return female ? 'selene' : 'elio'
	if ([42, 43, 73].includes(originGame)) return female ? 'elaine' : 'chase'
	if ([44, 45, 74].includes(originGame)) return female ? 'gloria' : 'victor'
	if (originGame === 47) return female ? 'akari' : 'rei'
	if ([50, 51, 52, 76].includes(originGame)) return originGame === 52 ? (female ? 'playerf-go' : 'player-go') : (female ? 'juliana-s' : 'florian-s')
	return female ? 'may' : 'brendan'
}

const getTrainerSpriteUrl = (originGame: number, gender: number) =>
	`https://play.pokemonshowdown.com/sprites/trainers/${getTrainerSpriteName(originGame, gender)}.png`

const GAME_LOGO_BY_ORIGIN: Record<number, string> = {
	1: 'sapphire.jpg', 2: 'ruby.jpg', 3: 'emerald.jpg', 4: 'firered.jpg', 5: 'leafgreen.jpg',
	7: 'heartgold.jpg', 8: 'soulsilver.jpg', 10: 'diamond.jpg', 11: 'pearl.jpg', 12: 'platinum.jpg',
	20: 'white.jpg', 21: 'black.jpg', 22: 'white-2.jpg', 23: 'black-2.jpg', 24: 'x.jpg', 25: 'y.jpg',
	26: 'alpha-sapphire.jpg', 27: 'omega-ruby.jpg', 30: 'sun.jpg', 31: 'moon.jpg', 32: 'ultra-sun.jpg', 33: 'ultra-moon.jpg',
	35: 'red-blue.png', 36: 'red-blue.png', 37: 'red-blue.png', 38: 'yellow.png', 39: 'gold.png', 40: 'silver.png', 41: 'crystal.jpg',
	42: 'lets-go-pikachu.jpg', 43: 'lets-go-eevee.jpg', 44: 'sword.jpg', 45: 'shield.jpg', 47: 'legends-arceus.jpg',
	48: 'brilliant-diamond.jpg', 49: 'shining-pearl.jpg', 50: 'scarlet.jpg', 51: 'violet.jpg', 52: 'legends-z-a.jpg',
	53: 'red-blue.png', 54: 'red-blue.png', 55: 'gold-silver.png', 56: 'gold-silver.png', 57: 'ruby-sapphire.svg',
	58: 'emerald.jpg', 59: 'firered.jpg', 60: 'ruby-sapphire.svg', 61: 'ruby-sapphire.svg', 62: 'ruby-sapphire.svg',
	63: 'diamond.jpg', 64: 'platinum.jpg', 65: 'heartgold.jpg', 66: 'black.jpg', 67: 'black-2.jpg', 68: 'x.jpg',
	69: 'x.jpg', 70: 'omega-ruby.jpg', 71: 'sun.jpg', 72: 'ultra-sun.jpg', 73: 'lets-go-pikachu.jpg', 74: 'sword.jpg',
	75: 'brilliant-diamond.jpg', 76: 'scarlet.jpg',
}

const getGameLogoUrl = (originGame: number) => {
	const fileName = GAME_LOGO_BY_ORIGIN[originGame]
	return fileName ? `/game-logos/${fileName}` : null
}

export function SavesPage() {
	const [saves, setSaves] = useState<SaveFileSummaryDto[]>([])
	const [selectedSaveId, setSelectedSaveId] = useState<number | null>(null)
	const [detail, setDetail] = useState<SaveFileDetailDto | null>(null)
	const [activeTab, setActiveTab] = useState<DetailTab>('trainer')
	const [listLoading, setListLoading] = useState(true)
	const [detailLoading, setDetailLoading] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [isDragging, setDragging] = useState(false)
	const [uploadResults, setUploadResults] = useState<SaveFileUploadResultDto[]>([])
	const [notice, setNotice] = useState<Notice | null>(null)
	const [listError, setListError] = useState<string | null>(null)
	const [detailError, setDetailError] = useState<string | null>(null)
	const [selectedPreviewIds, setSelectedPreviewIds] = useState<Set<number>>(new Set())
	const [importing, setImporting] = useState(false)
	const [notes, setNotes] = useState('')
	const [savingNotes, setSavingNotes] = useState(false)
	const [titleDraft, setTitleDraft] = useState('')
	const [editingTitle, setEditingTitle] = useState(false)
	const [savingTitle, setSavingTitle] = useState(false)
	const [downloading, setDownloading] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const detailRequestRef = useRef(0)

	const loadSaves = useCallback(async (preferredId?: number | null) => {
		setListLoading(true)
		setListError(null)
		try {
			const items = await getSaveFiles()
			setSaves(items)
			setSelectedSaveId((current) => {
				const candidate = preferredId === undefined ? current : preferredId
				if (candidate !== null && items.some((save) => save.id === candidate)) return candidate
				return items[0]?.id ?? null
			})
		} catch (error) {
			setListError(error instanceof Error ? error.message : 'Could not load save files.')
		} finally {
			setListLoading(false)
		}
	}, [])

	const loadDetail = useCallback(async (id: number) => {
		const requestId = ++detailRequestRef.current
		setDetailLoading(true)
		setDetailError(null)
		setSelectedPreviewIds(new Set())
		try {
			const result = await getSaveFile(id)
			if (requestId !== detailRequestRef.current) return
			setDetail(result)
			setNotes(result.summary.notes ?? '')
			setTitleDraft(result.summary.title ?? '')
			setEditingTitle(false)
		} catch (error) {
			if (requestId !== detailRequestRef.current) return
			setDetail(null)
			setDetailError(error instanceof Error ? error.message : 'Could not load this save file.')
		} finally {
			if (requestId === detailRequestRef.current) setDetailLoading(false)
		}
	}, [])

	useEffect(() => {
		loadSaves()
	}, [loadSaves])

	useEffect(() => {
		if (selectedSaveId === null) {
			setDetail(null)
			return
		}
		loadDetail(selectedSaveId)
	}, [loadDetail, selectedSaveId])

	const handleFiles = async (files: File[]) => {
		if (files.length === 0 || uploading) return
		setUploading(true)
		setNotice(null)
		setUploadResults([])
		try {
			const results = await uploadSaveFiles(files)
			setUploadResults(results)
			const imported = results.filter((result) => result.status === 'imported').length
			const duplicates = results.filter((result) => result.status === 'duplicate').length
			const failed = results.filter((result) => result.status === 'error').length
			setNotice({
				type: failed === results.length ? 'error' : 'success',
				text: [
					imported > 0 ? `${imported} imported` : '',
					duplicates > 0 ? `${duplicates} duplicate${duplicates === 1 ? '' : 's'}` : '',
					failed > 0 ? `${failed} failed` : '',
				]
					.filter(Boolean)
					.join(' · '),
			})
			const preferredId = results.find((result) => result.saveFileId !== null)?.saveFileId
			await loadSaves(preferredId)
		} catch (error) {
			setNotice({
				type: 'error',
				text: error instanceof Error ? error.message : 'Upload failed. Please try again.',
			})
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		handleFiles(Array.from(event.target.files ?? []))
	}

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		setDragging(false)
		handleFiles(Array.from(event.dataTransfer.files))
	}

	const handleSaveNotes = async () => {
		if (!detail || savingNotes) return
		setSavingNotes(true)
		setNotice(null)
		const nextNotes = notes.trim() || null
		try {
			await updateSaveFile(detail.summary.id, { title: detail.summary.title, notes: nextNotes })
			setDetail((current) =>
				current ? { ...current, summary: { ...current.summary, notes: nextNotes } } : current
			)
			setSaves((current) =>
				current.map((save) =>
					save.id === detail.summary.id ? { ...save, notes: nextNotes } : save
				)
			)
			setNotes(nextNotes ?? '')
			setNotice({ type: 'success', text: 'Save notes updated.' })
		} catch (error) {
			setNotice({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not update notes.',
			})
		} finally {
			setSavingNotes(false)
		}
	}

	const handleSaveTitle = async () => {
		if (!detail || savingTitle) return
		setSavingTitle(true)
		setNotice(null)
		const nextTitle = titleDraft.trim() || null
		try {
			await updateSaveFile(detail.summary.id, { title: nextTitle, notes: detail.summary.notes })
			const displayTitle = nextTitle ?? detail.summary.gameName
			setDetail((current) => current ? { ...current, summary: { ...current.summary, title: nextTitle, displayTitle } } : current)
			setSaves((current) => current.map((save) => save.id === detail.summary.id ? { ...save, title: nextTitle, displayTitle } : save))
			setTitleDraft(nextTitle ?? '')
			setEditingTitle(false)
			setNotice({ type: 'success', text: 'Save title updated.' })
		} catch (error) {
			setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Could not update the save title.' })
		} finally {
			setSavingTitle(false)
		}
	}

	const handleDownload = async () => {
		if (!detail || downloading) return
		setDownloading(true)
		setNotice(null)
		try {
			const { blob, filename } = await downloadSaveFile(
				detail.summary.id,
				detail.summary.originalFileName
			)
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = filename
			document.body.appendChild(link)
			link.click()
			link.remove()
			window.URL.revokeObjectURL(url)
			setNotice({ type: 'success', text: 'Original save download started.' })
		} catch (error) {
			setNotice({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not download this save.',
			})
		} finally {
			setDownloading(false)
		}
	}

	const handleDelete = async () => {
		if (!detail || deleting) return
		setDeleteOpen(false)
		setDeleting(true)
		setNotice(null)
		try {
			await deleteSaveFile(detail.summary.id)
			setDetail(null)
			setSelectedSaveId(null)
			setNotice({ type: 'success', text: `${detail.summary.originalFileName} was deleted.` })
			await loadSaves(null)
		} catch (error) {
			setNotice({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not delete this save.',
			})
		} finally {
			setDeleting(false)
		}
	}

	const availablePokemon = detail?.pokemon.filter((pokemon) => pokemon.existingPokemonId === null) ?? []
	const allNewSelected =
		availablePokemon.length > 0 &&
		availablePokemon.every((pokemon) => selectedPreviewIds.has(pokemon.id))

	const togglePreview = (id: number) => {
		setSelectedPreviewIds((current) => {
			const next = new Set(current)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const toggleAllNew = () => {
		setSelectedPreviewIds(
			allNewSelected ? new Set() : new Set(availablePokemon.map((pokemon) => pokemon.id))
		)
	}

	const handleImportPokemon = async () => {
		if (!detail || selectedPreviewIds.size === 0 || importing) return
		setImporting(true)
		setNotice(null)
		try {
			const results = await importSavePokemon(detail.summary.id, Array.from(selectedPreviewIds))
			const imported = results.filter((result) => result.status === 'imported').length
			const duplicates = results.filter((result) => result.status === 'duplicate').length
			const failed = results.filter((result) => result.status === 'error').length
			setNotice({
				type: failed > 0 && imported === 0 && duplicates === 0 ? 'error' : 'success',
				text: [
					imported > 0 ? `${imported} Pokémon imported` : '',
					duplicates > 0 ? `${duplicates} already in your vault` : '',
					failed > 0 ? `${failed} failed` : '',
				]
					.filter(Boolean)
					.join(' · '),
			})
			setSelectedPreviewIds(new Set())
			await Promise.all([loadDetail(detail.summary.id), loadSaves(detail.summary.id)])
		} catch (error) {
			setNotice({
				type: 'error',
				text: error instanceof Error ? error.message : 'Could not import the selected Pokémon.',
			})
		} finally {
			setImporting(false)
		}
	}

	const notesDirty = (detail?.summary.notes ?? '') !== (notes.trim() || '')

	return (
		<div className='saves-page'>
			<header className='saves-page__header'>
				<div>
					<div className='saves-page__eyebrow'>Save-file manager</div>
					<h1>Game saves</h1>
					<p>Keep original saves safe, inspect their contents, and bring selected Pokémon into your vault.</p>
				</div>
				<span className='saves-page__total'>{saves.length} saved</span>
			</header>

			<section className='save-upload' aria-labelledby='save-upload-title'>
				<div
					className={`save-upload__dropzone${isDragging ? ' is-dragging' : ''}`}
					onDragEnter={(event) => {
						event.preventDefault()
						setDragging(true)
					}}
					onDragOver={(event) => event.preventDefault()}
					onDragLeave={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
					}}
					onDrop={handleDrop}>
					<div className='save-upload__icon' aria-hidden='true'>
						<UploadIcon />
					</div>
					<div className='save-upload__copy'>
						<h2 id='save-upload-title'>{isDragging ? 'Drop saves to upload' : 'Add save files'}</h2>
						<p>Drop one or more files here, or choose them from your device.</p>
						<span>Supports {SUPPORTED_FILE_COPY}. File detection is content-aware.</span>
					</div>
					<button
						type='button'
						className='saves-button saves-button--primary'
						disabled={uploading}
						onClick={() => fileInputRef.current?.click()}>
						{uploading ? 'Uploading…' : 'Choose files'}
					</button>
					<input
						ref={fileInputRef}
						className='save-upload__input'
						type='file'
						multiple
						onChange={handleFileChange}
						aria-label='Choose save files to upload'
					/>
				</div>
				{uploadResults.length > 0 && <UploadResults results={uploadResults} />}
			</section>

			{notice && (
				<div className={`saves-notice saves-notice--${notice.type}`} role='status'>
					<span>{notice.text}</span>
					<button type='button' onClick={() => setNotice(null)} aria-label='Dismiss message'>×</button>
				</div>
			)}

			<div className='saves-workspace'>
				<aside className='save-library' aria-labelledby='save-library-title'>
					<div className='save-library__header'>
						<div>
							<h2 id='save-library-title'>Your saves</h2>
							<span>Select one to inspect</span>
						</div>
						<button
							type='button'
							className='saves-icon-button'
							onClick={() => loadSaves(selectedSaveId)}
							disabled={listLoading}
							aria-label='Refresh save files'>
							<RefreshIcon />
						</button>
					</div>

					{listError && <div className='save-library__error'>{listError}</div>}
					{listLoading && saves.length === 0 ? (
						<div className='save-library__state'>Loading saves…</div>
					) : saves.length === 0 ? (
						<div className='save-library__empty'>
							<span aria-hidden='true'>◇</span>
							<strong>No save files yet</strong>
							<p>Upload a game save to see trainer, Pokémon, and Pokédex data.</p>
						</div>
					) : (
						<div className='save-library__list'>
							{saves.map((save) => (
								<SaveSummaryCard
									key={save.id}
									save={save}
									selected={save.id === selectedSaveId}
									onSelect={() => {
										setSelectedSaveId(save.id)
										setActiveTab('trainer')
									}}
								/>
							))}
						</div>
					)}
				</aside>

				<section className='save-detail' aria-live='polite'>
					{detailLoading && !detail ? (
						<DetailLoading />
					) : detailError ? (
						<div className='save-detail__state save-detail__state--error'>
							<strong>Could not open this save</strong>
							<p>{detailError}</p>
							{selectedSaveId !== null && (
								<button className='saves-button' onClick={() => loadDetail(selectedSaveId)}>Try again</button>
							)}
						</div>
					) : detail ? (
						<>
							<SaveDetailHeader
								detail={detail}
								downloading={downloading}
								deleting={deleting}
								titleDraft={titleDraft}
								editingTitle={editingTitle}
								savingTitle={savingTitle}
								onTitleChange={setTitleDraft}
								onTitleEdit={() => setEditingTitle(true)}
								onTitleCancel={() => { setTitleDraft(detail.summary.title ?? ''); setEditingTitle(false) }}
								onTitleSave={handleSaveTitle}
								onDownload={handleDownload}
								onDelete={() => setDeleteOpen(true)}
							/>

							<div className='save-detail__tabs' role='tablist' aria-label='Save details'>
								{(['trainer', 'pokemon', 'pokedex'] as DetailTab[]).map((tab) => (
									<button
										key={tab}
										type='button'
										role='tab'
										aria-selected={activeTab === tab}
										className={activeTab === tab ? 'is-active' : ''}
										onClick={() => setActiveTab(tab)}>
										{tab === 'pokemon' ? 'Pokémon' : tab === 'pokedex' ? 'Pokédex' : 'Trainer'}
										{tab === 'pokemon' && <span>{detail.pokemon.length}</span>}
									</button>
								))}
							</div>

							<div className='save-detail__content' role='tabpanel'>
								{activeTab === 'trainer' && (
									<TrainerTab
										detail={detail}
										notes={notes}
										notesDirty={notesDirty}
										savingNotes={savingNotes}
										onNotesChange={setNotes}
										onSaveNotes={handleSaveNotes}
									/>
								)}
								{activeTab === 'pokemon' && (
									<PokemonTab
										pokemon={detail.pokemon}
										selected={selectedPreviewIds}
										allNewSelected={allNewSelected}
										importing={importing}
										onToggle={togglePreview}
										onToggleAll={toggleAllNew}
										onImport={handleImportPokemon}
									/>
								)}
								{activeTab === 'pokedex' && <PokedexTab regional={detail.regionalPokedex} national={detail.nationalPokedex} fallback={detail.pokedex} originGame={detail.summary.originGame} gameName={detail.summary.gameName} />}
							</div>
						</>
					) : (
						<div className='save-detail__state'>
							<span className='save-detail__state-icon' aria-hidden='true'><SaveIcon /></span>
							<strong>Select a save file</strong>
							<p>Trainer data, Pokémon storage, and Pokédex progress will appear here.</p>
						</div>
					)}
				</section>
			</div>

			<ConfirmDialog
				open={deleteOpen}
				title='Delete save file?'
				message={
					<>
						This removes <strong>{detail?.summary.originalFileName}</strong> from Beast Vault. Pokémon already imported into your vault are not deleted.
					</>
				}
				onCancel={() => setDeleteOpen(false)}
				onConfirm={handleDelete}
			/>
		</div>
	)
}

function UploadResults({ results }: { results: SaveFileUploadResultDto[] }) {
	return (
		<ul className='save-upload__results' aria-label='Upload results'>
			{results.map((result, index) => (
				<li key={`${result.fileName}-${index}`} className={`is-${result.status}`}>
					<span className='save-upload__result-icon' aria-hidden='true'>
						{result.status === 'imported' ? '✓' : result.status === 'duplicate' ? '↺' : '!'}
					</span>
					<span>
						<strong>{result.fileName}</strong>
						<small>{result.message || (result.status === 'imported' ? 'Ready to inspect' : result.status)}</small>
					</span>
				</li>
			))}
		</ul>
	)
}

function TrainerAvatar({ name, gender, originGame, compact = false }: { name: string; gender: number; originGame: number; compact?: boolean }) {
	const initial = name.trim().charAt(0).toUpperCase() || '?'
	const style = gender === 1 ? 'female' : gender === 0 ? 'male' : 'neutral'
	const spriteName = getTrainerSpriteName(originGame, gender)
	const [imageFailed, setImageFailed] = useState(false)
	useEffect(() => setImageFailed(false), [spriteName])
	return (
		<span className={`trainer-avatar trainer-avatar--${style}${compact ? ' trainer-avatar--compact' : ''}`} aria-label={`${name || 'Unknown trainer'} ${style} trainer avatar`} role='img'>
			{imageFailed ? <span className='trainer-avatar__fallback' aria-hidden='true'>{initial}</span> : <img className='trainer-avatar__sprite' src={getTrainerSpriteUrl(originGame, gender)} alt='' aria-hidden='true' onError={() => setImageFailed(true)} />}
			<span className='sr-only'>{initial}</span>
		</span>
	)
}

function BadgeRack({ earned, total }: { earned: number | null; total: number | null }) {
	if (earned === null || total === null || total < 1) return <div className='trainer-badges'><span>League badges</span><p>Badge data is not available for this save format.</p></div>
	return (
		<div className='trainer-badges'>
			<div><span>League badges</span><strong>{earned} of {total}</strong></div>
			<ul aria-label={`${earned} of ${total} badges earned`}>
				{Array.from({ length: total }, (_, index) => <li className={index < earned ? 'is-earned' : ''} key={index}>
					<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M7 3h10v6c0 3-2 5-5 6-3-1-5-3-5-6V3Zm-3 1h3v5c0 1-1 2-3 1V4Zm16 0h-3v5c0 1 1 2 3 1V4ZM9 15h6v5H9z' /></svg>
					<span className='sr-only'>Badge {index + 1}: {index < earned ? 'earned' : 'not earned'}</span>
				</li>)}
			</ul>
		</div>
	)
}

function SaveSummaryCard({
	save,
	selected,
	onSelect,
}: {
	save: SaveFileSummaryDto
	selected: boolean
	onSelect: () => void
}) {
	return (
		<button
			type='button'
			className={`save-summary${selected ? ' is-selected' : ''}`}
			onClick={onSelect}
			aria-pressed={selected}>
			<div className='save-summary__top'>
				<span className='save-summary__generation'>Gen {save.generation}</span>
				<span className={`save-summary__checksum ${save.checksumsValid ? 'is-valid' : 'is-invalid'}`}>
					{save.checksumsValid ? '✓ Verified' : '! Checksum issue'}
				</span>
			</div>
			<strong className='save-summary__game'>{save.displayTitle}</strong>
			{save.title && <span className='save-summary__game-name'>{save.gameName}</span>}
			<span className='save-summary__filename' title={save.originalFileName}>{save.originalFileName}</span>
			<div className='save-summary__trainer'>
				<TrainerAvatar name={save.trainerName} gender={save.trainerGender} originGame={save.originGame} compact />
				<span><small>Trainer</small><strong>{save.trainerName || 'Unknown'}</strong></span>
				<span className='save-summary__playtime'><small>Play time</small><strong>{save.playTime}</strong></span>
			</div>
			<div className='save-summary__metrics'>
				<span><strong>{save.badgeCount === null ? '—' : `${save.badgeCount}/${save.badgeTotal ?? '?'}`}</strong><small>Badges</small></span>
				<span><strong>{save.dexCaught}/{save.dexSeen}</strong><small>Dex</small></span>
				<span><strong>{save.partyCount}</strong><small>Party</small></span>
				<span><strong>{save.storedPokemonCount}</strong><small>Stored</small></span>
			</div>
			<div className='save-summary__meta'>
				<span>{save.saveType} · {save.format} · {formatBytes(save.size)}</span>
				<time dateTime={save.importedAt}>{formatDate(save.importedAt)}</time>
			</div>
		</button>
	)
}

function SaveDetailHeader({
	detail,
	downloading,
	deleting,
	titleDraft,
	editingTitle,
	savingTitle,
	onTitleChange,
	onTitleEdit,
	onTitleCancel,
	onTitleSave,
	onDownload,
	onDelete,
}: {
	detail: SaveFileDetailDto
	downloading: boolean
	deleting: boolean
	titleDraft: string
	editingTitle: boolean
	savingTitle: boolean
	onTitleChange: (value: string) => void
	onTitleEdit: () => void
	onTitleCancel: () => void
	onTitleSave: () => void
	onDownload: () => void
	onDelete: () => void
}) {
	const { summary } = detail
	return (
		<header className='save-detail__header'>
			<div className='save-detail__identity'>
				<div className='save-detail__game-mark' aria-hidden='true'>G{summary.generation}</div>
				<div>
					<div className='save-detail__kicker'>{summary.saveType} · {summary.format}</div>
					{editingTitle ? (
						<form className='save-detail__title-form' onSubmit={(event) => { event.preventDefault(); onTitleSave() }}>
							<label className='sr-only' htmlFor='save-title'>Save title</label>
							<input id='save-title' value={titleDraft} onChange={(event) => onTitleChange(event.target.value)} maxLength={120} autoFocus placeholder={summary.gameName} />
							<button type='button' onClick={onTitleCancel} disabled={savingTitle}>Cancel</button>
							<button type='submit' className='is-primary' disabled={savingTitle}>{savingTitle ? 'Saving…' : 'Save'}</button>
						</form>
					) : <div className='save-detail__title'><h2>{summary.displayTitle}</h2><button type='button' onClick={onTitleEdit} aria-label='Edit save title'>Edit title</button></div>}
					{summary.title && <span className='save-detail__game-name'>{summary.gameName}</span>}
					<p>{summary.originalFileName} · {formatBytes(summary.size)}</p>
				</div>
			</div>
			<div className='save-detail__header-actions'>
				<button type='button' className='saves-button' onClick={onDownload} disabled={downloading}>
					<DownloadIcon /> {downloading ? 'Preparing…' : 'Download'}
				</button>
				<button type='button' className='saves-button saves-button--danger' onClick={onDelete} disabled={deleting}>
					<TrashIcon /> {deleting ? 'Deleting…' : 'Delete'}
				</button>
			</div>
			<div className='save-detail__quick-stats'>
				<span><small>Trainer</small><strong>{summary.trainerName}</strong></span>
				<span><small>Play time</small><strong>{summary.playTime}</strong></span>
				<span><small>Pokédex</small><strong>{summary.dexCaught} caught</strong></span>
				<span className={summary.checksumsValid ? 'is-valid' : 'is-invalid'}>
					<small>Integrity</small><strong>{summary.checksumsValid ? 'Verified' : 'Needs attention'}</strong>
				</span>
			</div>
		</header>
	)
}

function TrainerTab({
	detail,
	notes,
	notesDirty,
	savingNotes,
	onNotesChange,
	onSaveNotes,
}: {
	detail: SaveFileDetailDto
	notes: string
	notesDirty: boolean
	savingNotes: boolean
	onNotesChange: (notes: string) => void
	onSaveNotes: () => void
}) {
	const { trainer, summary } = detail
	const fields = [
		['Trainer ID', String(trainer.trainerId).padStart(5, '0')],
		['Secret ID', String(trainer.secretId).padStart(5, '0')],
		['Gender', getGenderLabel(trainer.gender)],
		['Language', trainer.language || 'Unknown'],
		['Money', new Intl.NumberFormat().format(trainer.money)],
		['Play time', trainer.playTime],
	]

	return (
		<div className='trainer-tab'>
			<section className='trainer-tab__section trainer-dossier'>
				<div className='save-section-heading'>
					<div><span>Trainer dossier</span><h3>Identity & progress</h3></div>
					<small>Imported {formatDate(summary.importedAt)}</small>
				</div>
				<div className='trainer-dossier__identity'>
					<TrainerAvatar name={trainer.trainerName} gender={trainer.gender} originGame={summary.originGame} />
					<div><span>{summary.gameName}</span><h4>{trainer.trainerName || 'Unknown trainer'}</h4><p>{getGenderLabel(trainer.gender)} · {trainer.language || 'Unknown language'} · {trainer.playTime} played</p></div>
				</div>
				<dl className='trainer-facts'>
					{fields.map(([label, value]) => (
						<div key={label}><dt>{label}</dt><dd>{value}</dd></div>
					))}
				</dl>
				<BadgeRack earned={trainer.badgeCount} total={summary.badgeTotal} />
			</section>

			<section className='trainer-tab__section'>
				<div className='save-section-heading'>
					<div><span>Progress</span><h3>Adventure snapshot</h3></div>
				</div>
				<div className='trainer-progress'>
					<ProgressCard label='Badges' value={trainer.badgeCount ?? 0} max={summary.badgeTotal ?? Math.max(trainer.badgeCount ?? 0, 1)} display={trainer.badgeCount === null ? '—' : `${trainer.badgeCount}/${summary.badgeTotal ?? '?'}`} />
					<ProgressCard label='Regional Pokédex seen' value={trainer.dexSeen} max={Math.max(detail.regionalPokedex?.total ?? detail.pokedex.length, trainer.dexSeen, 1)} display={trainer.dexSeen.toString()} />
					<ProgressCard label='Regional Pokédex caught' value={trainer.dexCaught} max={Math.max(detail.regionalPokedex?.total ?? detail.pokedex.length, trainer.dexCaught, 1)} display={trainer.dexCaught.toString()} />
					<ProgressCard label='Pokémon stored' value={summary.storedPokemonCount} max={Math.max(summary.storedPokemonCount, 1)} display={summary.storedPokemonCount.toString()} />
				</div>
			</section>

			<section className='trainer-tab__section trainer-notes'>
				<div className='save-section-heading'>
					<div><span>Private to your vault</span><h3>Notes</h3></div>
				</div>
				<label htmlFor='save-notes'>Add context about this run, backup, or team.</label>
				<textarea
					id='save-notes'
					value={notes}
					onChange={(event) => onNotesChange(event.target.value)}
					placeholder='e.g. Original Emerald cartridge, pre-Elite Four backup…'
					maxLength={4000}
				/>
				<div className='trainer-notes__footer'>
					<span>{notes.length}/4000</span>
					<button
						type='button'
						className='saves-button saves-button--primary'
						disabled={!notesDirty || savingNotes}
						onClick={onSaveNotes}>
						{savingNotes ? 'Saving…' : 'Save notes'}
					</button>
				</div>
			</section>
		</div>
	)
}

function ProgressCard({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
	const percentage = Math.min(100, Math.max(0, (value / max) * 100))
	return (
		<div className='progress-card'>
			<span><small>{label}</small><strong>{display}</strong></span>
			<div className='progress-card__track' aria-hidden='true'><i style={{ width: `${percentage}%` }} /></div>
		</div>
	)
}

function PokemonTab({
	pokemon,
	selected,
	allNewSelected,
	importing,
	onToggle,
	onToggleAll,
	onImport,
}: {
	pokemon: SavePokemonPreviewDto[]
	selected: Set<number>
	allNewSelected: boolean
	importing: boolean
	onToggle: (id: number) => void
	onToggleAll: () => void
	onImport: () => void
}) {
	const groups = useMemo(() => {
		const party = pokemon
			.filter((item) => item.location === 'party')
			.sort((a, b) => a.slotNumber - b.slotNumber)
		const boxes = new Map<number, SavePokemonPreviewDto[]>()
		pokemon
			.filter((item) => item.location === 'box')
			.forEach((item) => {
				const box = item.boxNumber ?? 0
				boxes.set(box, [...(boxes.get(box) ?? []), item])
			})
		return [
			...(party.length > 0 ? [{ key: 'party', label: 'Party', pokemon: party }] : []),
			...Array.from(boxes.entries())
				.sort(([a], [b]) => a - b)
				.map(([box, items]) => ({
					key: `box-${box}`,
					label: `Box ${box}`,
					pokemon: items.sort((a, b) => a.slotNumber - b.slotNumber),
				})),
		]
	}, [pokemon])
	const newCount = pokemon.filter((item) => item.existingPokemonId === null).length
	const existingCount = pokemon.length - newCount

	if (pokemon.length === 0) {
		return <div className='save-tab-empty'><strong>No Pokémon found</strong><p>This save does not contain any readable party or box Pokémon.</p></div>
	}

	return (
		<div className='save-pokemon'>
			<div className='save-pokemon__toolbar'>
				<div>
					<strong>{pokemon.length} Pokémon found</strong>
					<span>{newCount} available · {existingCount} already in your vault</span>
				</div>
				<div className='save-pokemon__actions'>
					<button type='button' className='saves-button' onClick={onToggleAll} disabled={newCount === 0 || importing}>
						{allNewSelected ? 'Clear selection' : 'Select all new'}
					</button>
					<button type='button' className='saves-button saves-button--primary' onClick={onImport} disabled={selected.size === 0 || importing}>
						{importing ? 'Importing…' : `Import selected${selected.size > 0 ? ` (${selected.size})` : ''}`}
					</button>
				</div>
			</div>

			{groups.map((group) => (
				<section className='pokemon-group' key={group.key}>
					<div className='pokemon-group__heading'>
						<h3>{group.label}</h3><span>{group.pokemon.length}</span>
					</div>
					<div className='pokemon-preview-grid'>
						{group.pokemon.map((item) => (
							<PokemonPreviewCard
								key={item.id}
								pokemon={item}
								selected={selected.has(item.id)}
								onToggle={() => onToggle(item.id)}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	)
}

function PokemonPreviewCard({
	pokemon,
	selected,
	onToggle,
}: {
	pokemon: SavePokemonPreviewDto
	selected: boolean
	onToggle: () => void
}) {
	const existing = pokemon.existingPokemonId !== null
	return (
		<article className={`pokemon-preview${selected ? ' is-selected' : ''}${existing ? ' is-existing' : ''}`}>
			<div className='pokemon-preview__top'>
				<span className='pokemon-preview__slot'>Slot {pokemon.slotNumber}</span>
				{existing ? (
					<span className='pokemon-preview__existing' title='Already in your vault'>✓ In vault</span>
				) : (
					<label className='pokemon-preview__checkbox'>
						<input type='checkbox' checked={selected} onChange={onToggle} aria-label={`Select ${pokemon.nickname || pokemon.speciesName}`} />
						<span aria-hidden='true'>✓</span>
					</label>
				)}
			</div>
			<PokemonSprite speciesId={pokemon.speciesId} speciesName={pokemon.speciesName} isShiny={pokemon.isShiny} />
			<div className='pokemon-preview__identity'>
				<strong>{pokemon.nickname || pokemon.speciesName}</strong>
				{pokemon.nickname && <span>{pokemon.speciesName}</span>}
			</div>
			<div className='pokemon-preview__footer'>
				<span>Lv. {pokemon.level}</span>
				{pokemon.isShiny && <span className='is-shiny'>★ Shiny</span>}
				{pokemon.isEgg && <span>Egg</span>}
			</div>
			<div className='pokemon-preview__metadata'>
				<span><small>Nature</small>{pokemon.natureName || 'Unknown'}</span>
				<span><small>Ability</small>{pokemon.abilityName || 'Unknown'}</span>
				{pokemon.heldItemName !== 'None' && <span className='is-wide'><small>Held item</small>{pokemon.heldItemName}</span>}
			</div>
			{pokemon.moves.length > 0 && <ul className='pokemon-preview__moves' aria-label={`${pokemon.nickname || pokemon.speciesName} moves`}>{pokemon.moves.map((move) => <li key={move}>{move}</li>)}</ul>}
			{existing && (
				<Link className='pokemon-preview__link' to={`/pokemon/${pokemon.existingPokemonId}`}>
					View in vault <span aria-hidden='true'>→</span>
				</Link>
			)}
		</article>
	)
}

function PokemonSprite({ speciesId, speciesName, isShiny = false }: { speciesId: number; speciesName: string; isShiny?: boolean }) {
	const { spriteType } = useUISettings()
	const [failed, setFailed] = useState(false)
	const sprite = getPreferredSpriteFromDto(buildSpritesForId(speciesId, speciesName), spriteType, isShiny)

	useEffect(() => setFailed(false), [sprite])

	return (
		<div className='save-pokemon-sprite'>
			{sprite && !failed ? (
				<img src={sprite} alt={speciesName} loading='lazy' onError={() => setFailed(true)} />
			) : (
				<span aria-label={`${speciesName} sprite unavailable`}>?</span>
			)}
		</div>
	)
}

function PokedexTab({ regional, national, fallback, originGame, gameName }: { regional: SaveFileDetailDto['regionalPokedex']; national: SaveFileDetailDto['nationalPokedex']; fallback: SavePokedexEntryDto[]; originGame: number; gameName: string }) {
	const [scope, setScope] = useState<'regional' | 'national'>('regional')
	const gameLogoUrl = getGameLogoUrl(originGame)
	const entries = (scope === 'regional' ? regional?.entries : national?.entries) ?? fallback
	const [filter, setFilter] = useState<PokedexFilter>('caught')
	const [search, setSearch] = useState('')
	const counts = useMemo(
		() => ({
			caught: entries.filter((entry) => entry.caught).length,
			seen: entries.filter((entry) => entry.seen && !entry.caught).length,
			missing: entries.filter((entry) => !entry.seen).length,
		}),
		[entries]
	)
	const filtered = useMemo(() => {
		const query = search.trim().toLocaleLowerCase()
		return entries.filter((entry) => {
			const statusMatches =
				filter === 'caught' ? entry.caught : filter === 'seen' ? entry.seen && !entry.caught : !entry.seen
			const searchMatches =
				!query || entry.speciesName.toLocaleLowerCase().includes(query) || String(entry.speciesId).includes(query)
			return statusMatches && searchMatches
		})
	}, [entries, filter, search])
	const completion = entries.length === 0 ? 0 : (counts.caught / entries.length) * 100

	return (
		<div className='save-pokedex'>
			<div className='save-pokedex__filters' aria-label='Pokédex scope'>
				{(['regional', 'national'] as const).map((value) => (
					<button key={value} type='button' className={scope === value ? 'is-active' : ''} onClick={() => setScope(value)} aria-pressed={scope === value}>
						{value.charAt(0).toUpperCase() + value.slice(1)}
					</button>
				))}
			</div>
			<div className='save-pokedex__progress'>
				<div><span>Pokédex completion</span><strong>{counts.caught} <small>/ {entries.length} caught</small></strong></div>
				<div className='save-pokedex__track' role='progressbar' aria-label='Pokédex completion' aria-valuenow={Math.round(completion)} aria-valuemin={0} aria-valuemax={100}>
					<i style={{ width: `${completion}%` }} />
				</div>
				<span>{Math.round(completion)}%</span>
			</div>

			<div className='save-pokedex__toolbar'>
				<div className='save-pokedex__filters' aria-label='Filter Pokédex entries'>
					{(['caught', 'seen', 'missing'] as PokedexFilter[]).map((value) => (
						<button key={value} type='button' className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>
							{value.charAt(0).toUpperCase() + value.slice(1)} <span>{counts[value]}</span>
						</button>
					))}
				</div>
				<label className='save-pokedex__search'>
					<SearchIcon />
					<span className='sr-only'>Search this save's Pokédex</span>
					<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search species or number' />
				</label>
			</div>

			{filtered.length === 0 ? (
				<div className='save-tab-empty'><strong>No matching species</strong><p>Try another status or search term.</p></div>
			) : (
				<div className='save-pokedex__grid'>
					{filtered.map((entry) => (
						<article className={`pokedex-entry is-${filter}`} key={entry.speciesId}>
							<PokemonSprite speciesId={entry.speciesId} speciesName={entry.speciesName} />
							<div><span>#{String(entry.speciesId).padStart(4, '0')}</span><div className='pokedex-entry__name'><strong>{entry.speciesName}</strong>{entry.isVersionExclusive && gameLogoUrl && <img className='pokedex-entry__game-logo' src={gameLogoUrl} alt={`Version exclusive in ${gameName}`} title={`Version exclusive in ${gameName}`} />}</div></div>
							<span className='pokedex-entry__status'>{entry.caught ? 'Caught' : entry.seen ? 'Seen' : 'Missing'}</span>
						</article>
					))}
				</div>
			)}
		</div>
	)
}

function DetailLoading() {
	return (
		<div className='save-detail__loading' aria-label='Loading save details'>
			<div /><div /><div />
		</div>
	)
}

function UploadIcon() {
	return <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M12 16V4' /><path d='m7 9 5-5 5 5' /><path d='M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4' /></svg>
}

function DownloadIcon() {
	return <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M12 3v12' /><path d='m7 10 5 5 5-5' /><path d='M5 21h14' /></svg>
}

function TrashIcon() {
	return <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M3 6h18' /><path d='M8 6V4h8v2' /><path d='m19 6-1 15H6L5 6' /></svg>
}

function RefreshIcon() {
	return <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M20 6v5h-5' /><path d='M4 18v-5h5' /><path d='M18.5 9a7 7 0 0 0-11.7-2.6L4 9' /><path d='M5.5 15a7 7 0 0 0 11.7 2.6L20 15' /></svg>
}

function SaveIcon() {
	return <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round'><path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z' /><path d='M17 21v-8H7v8' /><path d='M7 3v5h8' /></svg>
}

function SearchIcon() {
	return <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><circle cx='11' cy='11' r='7' /><path d='m20 20-4-4' /></svg>
}

export default SavesPage
