import { useState, useRef, useEffect, useCallback } from 'react'
import {
	importPokemonFiles,
	getPokemonList,
	deletePokemonFromDatabase,
	downloadFileById,
	downloadPkmFileFromDisk,
	scanPokemonDirectory,
} from './services/Pokemon'
import type { PokemonListItemDto } from './models/Pokemon'
import { getPokeApiPokemon } from './services/Pokeapi'
import { ConfirmDialog } from './ConfirmDialog'
import './App.scss'

// Helper to get the best available sprite in priority order
function getBestSprite(sprites: any, isShiny: boolean = false) {
	// Priority: showdown > home > official artwork > pokeapi default
	// If Pokemon is shiny, prefer shiny versions
	if (isShiny) {
		if (sprites.showdownShiny) return sprites.showdownShiny
		if (sprites.showdown) return sprites.showdown
		if (sprites.homeShiny) return sprites.homeShiny
		if (sprites.home) return sprites.home
		if (sprites.officialShiny) return sprites.officialShiny
		if (sprites.official) return sprites.official
		if (sprites.shiny) return sprites.shiny
		if (sprites.default) return sprites.default
	} else {
		if (sprites.showdown) return sprites.showdown
		if (sprites.home) return sprites.home
		if (sprites.official) return sprites.official
		if (sprites.default) return sprites.default
		if (sprites.shiny) return sprites.shiny
	}
	return null
}

function App() {
	const [pokemon, setPokemon] = useState<PokemonListItemDto[]>([])
	const [pokeSprites, setPokeSprites] = useState<Record<number, any>>({})
	const pokeApiCache = useRef<{ [key: string]: any }>({})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
	const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
	const [pendingDownloadId, setPendingDownloadId] = useState<number | null>(null)
	const [scanning, setScanning] = useState(false)
	const [scanResult, setScanResult] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const fetchPokemonList = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await getPokemonList({ Skip: 0, Take: 50 })
			const pokeList = Array.isArray(result.items) ? result.items : []
			setPokemon(pokeList)
			// Create unique combinations of speciesId and form
			const speciesFormCombos = Array.from(
				new Set(pokeList.map((p) => `${p.speciesId}-${p.form || 0}`))
			)
			const speciesFetches = await Promise.all(
				speciesFormCombos.map(async (combo) => {
					const [speciesId, form] = combo.split('-').map(Number)
					const cacheKey = combo
					if (pokeApiCache.current[cacheKey])
						return [cacheKey, pokeApiCache.current[cacheKey]] as [string, any]
					try {
						const pokeApi = await getPokeApiPokemon(speciesId, form)
						pokeApiCache.current[cacheKey] = pokeApi
						return [cacheKey, pokeApi] as [string, any]
					} catch {
						pokeApiCache.current[cacheKey] = null
						return [cacheKey, null] as [string, any]
					}
				})
			)
			const pokeApiMap = Object.fromEntries(speciesFetches)
			// Now map each Pokémon to its sprites
			const spriteEntries = pokeList.map((p) => {
				const cacheKey = `${p.speciesId}-${p.form || 0}`
				const pokeApi = pokeApiMap[cacheKey]
				if (!pokeApi) return [p.id, {}]
				const sprites = pokeApi.sprites
				return [
					p.id,
					{
						default: sprites.front_default || '',
						shiny: sprites.front_shiny || '',
						back_default: sprites.back_default || '',
						back_shiny: sprites.back_shiny || '',
						front_female: sprites.front_female || '',
						front_shiny_female: sprites.front_shiny_female || '',
						back_female: sprites.back_female || '',
						back_shiny_female: sprites.back_shiny_female || '',
						official: sprites.other?.['official-artwork']?.front_default || '',
						officialShiny: sprites.other?.['official-artwork']?.front_shiny || '',
						home: sprites.other?.home?.front_default || '',
						homeShiny: sprites.other?.home?.front_shiny || '',
						dreamWorld: sprites.other?.dream_world?.front_default || '',
						showdown: sprites.other?.showdown?.front_default || '',
						showdownShiny: sprites.other?.showdown?.front_shiny || '',
						versions: sprites.versions || {},
					},
				]
			})
			setPokeSprites(Object.fromEntries(spriteEntries))
		} catch (e: any) {
			setError(e.message || 'Failed to fetch Pokémon list')
		} finally {
			setLoading(false)
		}
	}, [])

	// Scan directory function
	const handleScanDirectory = useCallback(async () => {
		setScanning(true)
		setError(null)
		setScanResult(null)
		try {
			const result = await scanPokemonDirectory()
			setScanResult(
				`Scan completed: ${result.summary.newlyImported} new, ${result.summary.alreadyImported} existing, ${result.summary.errors} errors`
			)
			// Refresh the list after scanning
			await fetchPokemonList()
		} catch (e: any) {
			setError(e.message || 'Failed to scan directory')
		} finally {
			setScanning(false)
		}
	}, [fetchPokemonList])

	// Download logic
	const handleDownload = (id: number) => {
		setPendingDownloadId(id)
		setDownloadConfirmOpen(true)
	}

	const handleDownloadSource = async (source: 'backup' | 'database') => {
		if (pendingDownloadId == null) return
		setLoading(true)
		setError(null)
		try {
			let result: { blob: Blob; filename: string }
			if (source === 'backup') {
				result = await downloadFileById(pendingDownloadId)
			} else {
				result = await downloadPkmFileFromDisk(pendingDownloadId)
			}

			const { blob, filename } = result
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			setTimeout(() => {
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			}, 100)
		} catch (e: any) {
			setError(e.message || 'Failed to download file')
		} finally {
			setLoading(false)
			setDownloadConfirmOpen(false)
			setPendingDownloadId(null)
		}
	}

	const handleCancelDownload = () => {
		setDownloadConfirmOpen(false)
		setPendingDownloadId(null)
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return
		setLoading(true)
		setError(null)
		try {
			await importPokemonFiles([e.target.files[0]])
			await fetchPokemonList()
		} catch (e: any) {
			setError(e.message || 'Failed to upload file')
		} finally {
			setLoading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	// Fetch list on mount
	useEffect(() => {
		fetchPokemonList()
	}, [fetchPokemonList])

	// Auto-scan directory on render
	useEffect(() => {
		handleScanDirectory()
	}, [handleScanDirectory])

	const handleDelete = async (id: number) => {
		setConfirmOpen(true)
		setPendingDeleteId(id)
	}

	const handleConfirmDelete = async () => {
		if (pendingDeleteId == null) return
		setLoading(true)
		setError(null)
		try {
			await deletePokemonFromDatabase(pendingDeleteId)
			await fetchPokemonList()
		} catch (e: any) {
			setError(e.message || 'Failed to delete Pokémon')
		} finally {
			setLoading(false)
			setConfirmOpen(false)
			setPendingDeleteId(null)
		}
	}

	const handleCancelDelete = () => {
		setConfirmOpen(false)
		setPendingDeleteId(null)
	}

	return (
		<div className='app-container'>
			<h1>Beast Vault</h1>
			<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
				<input
					type='file'
					accept='.pk9'
					onChange={handleFileChange}
					ref={fileInputRef}
					className='file-input'
				/>
				<button
					onClick={handleScanDirectory}
					disabled={loading || scanning}
					style={{
						padding: '0.5rem 1rem',
						background: '#059669',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: scanning ? 'not-allowed' : 'pointer',
						opacity: scanning ? 0.6 : 1,
					}}>
					{scanning ? 'Scanning...' : 'Scan Directory'}
				</button>
			</div>
			{loading && <p>Loading...</p>}
			{scanning && <p>Scanning directory for new Pokémon files...</p>}
			{error && <p className='error'>{error}</p>}
			{scanResult && <p style={{ color: '#059669', fontWeight: 'bold' }}>{scanResult}</p>}
			<h2>Pokémon Collection</h2>
			<div className='pokemon-grid'>
				{pokemon.length === 0 && !loading && <p>No Pokémon found.</p>}
				{pokemon.map((p) => {
					const sprites = pokeSprites[p.id] || {}
					const bestSprite = getBestSprite(sprites, p.isShiny)
					return (
						<div key={p.id} className='pokemon-card'>
							<button
								className='delete-button'
								onClick={() => handleDelete(p.id)}
								title='Delete Pokémon'
								aria-label='Delete Pokémon'
								disabled={loading}>
								×
							</button>
							<button
								className='download-button'
								onClick={() => handleDownload(p.id)}
								title='Download original file'
								aria-label='Download file'
								disabled={loading}
								style={{
									position: 'absolute',
									top: 6,
									left: 6,
									background: '#2563eb',
									color: 'white',
									border: 'none',
									borderRadius: '50%',
									width: 20,
									height: 20,
									fontWeight: 'bold',
									fontSize: 12,
									lineHeight: 1,
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								↓
							</button>
							<div className='pokemon-image'>
								{bestSprite ? (
									<img src={bestSprite} alt={p.nickname || 'Pokemon'} />
								) : (
									<span className='no-image'>⚙️</span>
								)}
							</div>
							<div className='pokemon-info'>
								<h3 className='pokemon-name'>
									{p.nickname || 'No Nickname'}
									{p.isShiny && <span className='shiny-star'>★</span>}
								</h3>
								<p className='pokemon-level'>Level {p.level}</p>
							</div>
						</div>
					)
				})}
			</div>
			<ConfirmDialog
				open={confirmOpen}
				title='Delete Pokémon'
				message='Are you sure you want to delete this Pokémon from the database? This action cannot be undone.'
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
			/>
			<ConfirmDialog
				open={downloadConfirmOpen}
				title='Download Pokémon file'
				message={
					<div>
						<div>Choose the source to download the original file for this Pokémon:</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
							<button
								className='download-source-btn'
								style={{
									background: '#2563eb',
									color: 'white',
									border: 'none',
									borderRadius: 6,
									padding: '0.5em 1em',
									fontWeight: 600,
									cursor: 'pointer',
								}}
								onClick={() => handleDownloadSource('backup')}
								disabled={loading}>
								Backup
							</button>
							<button
								className='download-source-btn'
								style={{
									background: '#059669',
									color: 'white',
									border: 'none',
									borderRadius: 6,
									padding: '0.5em 1em',
									fontWeight: 600,
									cursor: 'pointer',
								}}
								onClick={() => handleDownloadSource('database')}
								disabled={loading}>
								Database
							</button>
						</div>
					</div>
				}
				onConfirm={() => {}}
				onCancel={handleCancelDownload}
				hideConfirm
			/>
		</div>
	)
}

export default App
