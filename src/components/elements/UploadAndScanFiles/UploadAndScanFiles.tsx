import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { usePokemon } from '@/hooks/usePokemon'
import './UploadAndScanFiles.scss'

interface UploadAndScanFilesProps {
	isOpen: boolean
	onClose: () => void
}

export const UploadAndScanFiles: React.FC<UploadAndScanFilesProps> = ({ isOpen, onClose }) => {
	const {
		importing,
		scanning,
		importResult,
		error,
		importFiles,
		scanPokemonDirectory,
		clearCurrentError,
		clearCurrentImportResult,
		refreshPokemon,
	} = usePokemon()

	const fileInputRef = useRef<HTMLInputElement | null>(null)

	// Escape key + body scroll lock
	useEffect(() => {
		if (!isOpen) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', onKey)
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', onKey)
			document.body.style.overflow = ''
		}
	}, [isOpen, onClose])

	const handleScanDirectory = useCallback(async () => {
		clearCurrentError()
		clearCurrentImportResult()
		try {
			await scanPokemonDirectory()
			await refreshPokemon()
		} catch (e: any) {
			console.error('Scan failed:', e.message || 'Failed to scan directory')
		}
	}, [scanPokemonDirectory, clearCurrentError, clearCurrentImportResult, refreshPokemon])

	useEffect(() => {
		if (isOpen) handleScanDirectory()
	}, [isOpen, handleScanDirectory])

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return
		clearCurrentError()
		clearCurrentImportResult()
		try {
			await importFiles(Array.from(e.target.files))
			await refreshPokemon()
		} catch (e: any) {
			console.error('Import failed:', e.message || 'Failed to upload file')
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	if (!isOpen) return null

	return createPortal(
		<div className='import-modal-overlay' onClick={onClose}>
			<div className='import-modal' onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className='import-modal__header'>
					<h2>Import Pokémon Files</h2>
					<button className='import-modal__close' onClick={onClose} aria-label='Close'>
						×
					</button>
				</div>

				{/* Drag & Drop zone */}
				<div className='import-modal__body'>
					<div
						className={`import-dropzone${importing ? ' import-dropzone--busy' : ''}`}
						onClick={() => !importing && !scanning && fileInputRef.current?.click()}
						onDragOver={(e) => e.preventDefault()}
						onDrop={async (e) => {
							e.preventDefault()
							if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
							clearCurrentError()
							clearCurrentImportResult()
							try {
								await importFiles(Array.from(e.dataTransfer.files))
								await refreshPokemon()
							} catch (e: any) {
								console.error('Import failed:', e.message || 'Failed to upload files')
							}
						}}>
						<div className='import-dropzone__icon'>📂</div>
						<p className='import-dropzone__text'>
							{importing ? 'Uploading...' : 'Drag & drop .pk* files here'}
						</p>
						<p className='import-dropzone__sub'>or click to browse</p>
						<input
							type='file'
							accept='.pk*'
							onChange={handleFileChange}
							ref={fileInputRef}
							multiple
							disabled={importing || scanning}
							style={{ display: 'none' }}
						/>
					</div>

					{/* Divider */}
					<div className='import-modal__divider'>
						<span>or</span>
					</div>

					{/* Scan section */}
					<div className='import-scan'>
						<p className='import-scan__label'>Scan the default directory for new files</p>
						<button
							className='import-scan__btn'
							onClick={handleScanDirectory}
							disabled={importing || scanning}>
							{scanning ? 'Scanning...' : 'Scan Directory'}
						</button>
					</div>

					{/* Status messages */}
					{(error || importResult) && (
						<div className={`import-status import-status--${error ? 'error' : 'success'}`}>
							{error ? `❌ ${error}` : `✅ ${importResult}`}
						</div>
					)}
				</div>
			</div>
		</div>,
		document.body
	)
}
