import { useState, useEffect } from 'react'
import { cacheService } from '../../services/CacheService'

interface CacheStatsProps {
	show?: boolean
}

export function CacheStats({ show = false }: CacheStatsProps) {
	const [stats, setStats] = useState({ totalItems: 0, totalSize: 0 })

	useEffect(() => {
		if (show) {
			const updateStats = async () => {
				const currentStats = await cacheService.getStats()
				setStats(currentStats)
			}

			updateStats()
			const interval = setInterval(updateStats, 5000) // Update every 5 seconds

			return () => clearInterval(interval)
		}
	}, [show])

	const handleClearCache = async () => {
		await cacheService.clear()
		setStats({ totalItems: 0, totalSize: 0 })
	}

	const handleCleanupCache = async () => {
		await cacheService.cleanup()
		const newStats = await cacheService.getStats()
		setStats(newStats)
	}

	const formatSize = (bytes: number): string => {
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		if (bytes === 0) return '0 Bytes'
		const i = Math.floor(Math.log(bytes) / Math.log(1024))
		return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
	}

	if (!show) return null

	return (
		<div
			style={{
				position: 'fixed',
				bottom: '10px',
				right: '10px',
				background: 'rgba(0, 0, 0, 0.8)',
				color: 'white',
				padding: '10px',
				borderRadius: '8px',
				fontSize: '12px',
				zIndex: 1000,
				minWidth: '200px',
			}}>
			<div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Cache Statistics</div>
			<div>Items: {stats.totalItems}</div>
			<div>Size: {formatSize(stats.totalSize)}</div>
			<div style={{ marginTop: '8px', display: 'flex', gap: '5px' }}>
				<button
					onClick={handleCleanupCache}
					style={{
						background: '#3b82f6',
						color: 'white',
						border: 'none',
						padding: '4px 8px',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '10px',
					}}>
					Cleanup
				</button>
				<button
					onClick={handleClearCache}
					style={{
						background: '#dc2626',
						color: 'white',
						border: 'none',
						padding: '4px 8px',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '10px',
					}}>
					Clear All
				</button>
			</div>
		</div>
	)
}
