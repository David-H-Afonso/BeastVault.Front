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
			await updateSaveFile(detail.summary.id, { notes: nextNotes })
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
		<main className='saves-page'>
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
								{activeTab === 'pokedex' && <PokedexTab entries={detail.pokedex} />}
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
		</main>
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
			<strong className='save-summary__game'>{save.gameName}</strong>
			<span className='save-summary__filename' title={save.originalFileName}>{save.originalFileName}</span>
			<div className='save-summary__trainer'>
				<span className='save-summary__avatar' aria-hidden='true'>{save.trainerName.charAt(0).toUpperCase() || '?'}</span>
				<span><small>Trainer</small><strong>{save.trainerName || 'Unknown'}</strong></span>
				<span className='save-summary__playtime'><small>Play time</small><strong>{save.playTime}</strong></span>
			</div>
			<div className='save-summary__metrics'>
				<span><strong>{save.badgeCount ?? '—'}</strong><small>Badges</small></span>
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
	onDownload,
	onDelete,
}: {
	detail: SaveFileDetailDto
	downloading: boolean
	deleting: boolean
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
					<h2>{summary.gameName}</h2>
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
		['Trainer name', trainer.trainerName || 'Unknown'],
		['Trainer ID', String(trainer.trainerId).padStart(5, '0')],
		['Secret ID', String(trainer.secretId).padStart(5, '0')],
		['Gender', getGenderLabel(trainer.gender)],
		['Language', trainer.language || 'Unknown'],
		['Money', new Intl.NumberFormat().format(trainer.money)],
		['Play time', trainer.playTime],
		['Badges', trainer.badgeCount === null ? 'Not available' : String(trainer.badgeCount)],
	]

	return (
		<div className='trainer-tab'>
			<section className='trainer-tab__section'>
				<div className='save-section-heading'>
					<div><span>Profile</span><h3>Trainer information</h3></div>
					<small>Imported {formatDate(summary.importedAt)}</small>
				</div>
				<dl className='trainer-facts'>
					{fields.map(([label, value]) => (
						<div key={label}><dt>{label}</dt><dd>{value}</dd></div>
					))}
				</dl>
			</section>

			<section className='trainer-tab__section'>
				<div className='save-section-heading'>
					<div><span>Progress</span><h3>Adventure snapshot</h3></div>
				</div>
				<div className='trainer-progress'>
					<ProgressCard label='Badges' value={trainer.badgeCount ?? 0} max={8} display={trainer.badgeCount?.toString() ?? '—'} />
					<ProgressCard label='Pokédex seen' value={trainer.dexSeen} max={Math.max(detail.pokedex.length, trainer.dexSeen, 1)} display={trainer.dexSeen.toString()} />
					<ProgressCard label='Pokédex caught' value={trainer.dexCaught} max={Math.max(detail.pokedex.length, trainer.dexCaught, 1)} display={trainer.dexCaught.toString()} />
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
					maxLength={2000}
				/>
				<div className='trainer-notes__footer'>
					<span>{notes.length}/2000</span>
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
			<div className='pokemon-preview__metadata' title={pokemon.moves.join(', ')}>
				<span>{pokemon.natureName}</span>
				<span>{pokemon.abilityName}</span>
				{pokemon.heldItemName !== 'None' && <span>{pokemon.heldItemName}</span>}
				{pokemon.moves.length > 0 && <span>{pokemon.moves.join(' · ')}</span>}
			</div>
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

function PokedexTab({ entries }: { entries: SavePokedexEntryDto[] }) {
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
							<div><span>#{String(entry.speciesId).padStart(4, '0')}</span><strong>{entry.speciesName}</strong></div>
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
