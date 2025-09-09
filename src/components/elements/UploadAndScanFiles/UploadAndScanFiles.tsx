import { useCallback, useEffect, useRef } from 'react'
import { usePokemon } from '@/hooks/usePokemon'
import { Modal } from '../Modal/Modal'
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

	// Scan directory function
	const handleScanDirectory = useCallback(async () => {
		clearCurrentError()
		clearCurrentImportResult()
		try {
			await scanPokemonDirectory()
			// Refresh the Pokemon list after scanning
			await refreshPokemon()
		} catch (e: any) {
			console.error('Scan failed:', e.message || 'Failed to scan directory')
		}
	}, [scanPokemonDirectory, clearCurrentError, clearCurrentImportResult, refreshPokemon])

	// Auto-scan directory when modal opens
	useEffect(() => {
		if (isOpen) {
			handleScanDirectory()
		}
	}, [isOpen, handleScanDirectory])

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return
		clearCurrentError()
		clearCurrentImportResult()
		try {
			await importFiles([e.target.files[0]])
			// Refresh the Pokemon list after import
			await refreshPokemon()
		} catch (e: any) {
			console.error('Import failed:', e.message || 'Failed to upload file')
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	return (
		<Modal
			header='Import Pokémon Files'
			hasActions
			isOpen={isOpen}
			onClose={onClose}
			closeOnBackdropClick={true}
			closeOnEscape={true}>
			<div className='upload-scan-container'>
				<div
					className='upload-dropzone'
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(e) => e.preventDefault()}
					onDrop={async (e) => {
						e.preventDefault()
						if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
						clearCurrentError()
						clearCurrentImportResult()
						try {
							await importFiles(Array.from(e.dataTransfer.files))
							// Refresh the Pokemon list after import
							await refreshPokemon()
						} catch (e: any) {
							console.error('Import failed:', e.message || 'Failed to upload files')
						}
					}}>
					<p>Drag and drop your files here, or click to upload</p>
					<input
						id='file-upload'
						type='file'
						accept='.pk*'
						onChange={handleFileChange}
						ref={fileInputRef}
						multiple
						disabled={importing || scanning}
						style={{ display: 'none' }}
					/>
				</div>

				<div className='scan-container'>
					<div className='scan-button'>
						<h3>Or scan the default directory for new files:</h3>
						<button onClick={handleScanDirectory} disabled={importing || scanning}>
							Scan Directory
						</button>
					</div>

					<div className='scan-messages'>
						{/* Status Messages */}
						{importing && (
							<div className='upload-scan__status upload-scan__status--loading'>
								⏳ Uploading file...
							</div>
						)}

						{scanning && (
							<div className='upload-scan__status upload-scan__status--scanning'>
								🔍 Scanning directory for new Pokémon files...
							</div>
						)}

						{error && (
							<div className='upload-scan__status upload-scan__status--error'>❌ {error}</div>
						)}

						{importResult && (
							<div className='upload-scan__status upload-scan__status--success'>
								✅ {importResult}
							</div>
						)}
					</div>
				</div>
			</div>
		</Modal>
	)
}
