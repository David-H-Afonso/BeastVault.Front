import { importPokemonFiles, scanPokemonDirectory } from '@/services/Pokemon'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from '../Modal/Modal'
import './UploadAndScanFiles.scss'

interface UploadAndScanFilesProps {
	isOpen: boolean
	onClose: () => void
	onRefreshList?: () => Promise<void>
}

export const UploadAndScanFiles: React.FC<UploadAndScanFilesProps> = ({
	isOpen,
	onClose,
	onRefreshList,
}) => {
	const [loading, setLoading] = useState(false)
	const [scanning, setScanning] = useState(false)
	const [scanResult, setScanResult] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

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
			if (onRefreshList) {
				await onRefreshList()
			}
		} catch (e: any) {
			setError(e.message || 'Failed to scan directory')
		} finally {
			setScanning(false)
		}
	}, [onRefreshList])

	// Auto-scan directory when modal opens
	useEffect(() => {
		if (isOpen) {
			handleScanDirectory()
		}
	}, [isOpen, handleScanDirectory])

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return
		setLoading(true)
		setError(null)
		setScanResult(null)
		try {
			await importPokemonFiles([e.target.files[0]])
			if (onRefreshList) {
				await onRefreshList()
			}
		} catch (e: any) {
			setError(e.message || 'Failed to upload file')
		} finally {
			setLoading(false)
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
						setLoading(true)
						setError(null)
						setScanResult(null)
						try {
							await importPokemonFiles(Array.from(e.dataTransfer.files))
							if (onRefreshList) {
								await onRefreshList()
							}
						} catch (e: any) {
							setError(e.message || 'Failed to upload files')
						} finally {
							setLoading(false)
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
						disabled={loading || scanning}
						style={{ display: 'none' }}
					/>
				</div>

				<div className='scan-container'>
					<div className='scan-button'>
						<h3>Or scan the default directory for new files:</h3>
						<button onClick={handleScanDirectory} disabled={loading || scanning}>
							Scan Directory
						</button>
					</div>

					<div className='scan-messages'>
						{/* Status Messages */}
						{loading && (
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

						{scanResult && (
							<div className='upload-scan__status upload-scan__status--success'>
								✅ {scanResult}
							</div>
						)}
					</div>
				</div>
			</div>
		</Modal>
	)
}
