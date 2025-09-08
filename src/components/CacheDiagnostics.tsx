import React from 'react'
import { useCacheStats, useStaticResourcePreloader } from '../hooks/useResourcePreloader'
import { staticResourceCache } from '../services/StaticResourceCache'

interface CacheDiagnosticsProps {
	isVisible?: boolean
}

/**
 * Development component to show cache statistics and controls
 */
export const CacheDiagnostics: React.FC<CacheDiagnosticsProps> = ({ 
	isVisible = false 
}) => {
	const cacheStats = useCacheStats()
	const preloadStats = useStaticResourcePreloader()

	if (!isVisible) return null

	const handleClearCache = () => {
		staticResourceCache.clearAll()
		// Force reload to see the effect
		window.location.reload()
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: '10px',
				right: '10px',
				background: '#fff',
				border: '2px solid #ddd',
				borderRadius: '8px',
				padding: '16px',
				boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
				fontSize: '12px',
				fontFamily: 'monospace',
				minWidth: '200px',
				zIndex: 9999
			}}
		>
			<h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
				Cache Diagnostics
			</h4>
			
			<div style={{ marginBottom: '12px' }}>
				<strong>Cache Stats:</strong>
				<br />
				Items: {cacheStats.totalItems}
				<br />
				Size: {cacheStats.totalSize}
			</div>

			<div style={{ marginBottom: '12px' }}>
				<strong>Preload Status:</strong>
				<br />
				Progress: {preloadStats.loaded}/{preloadStats.total}
				<br />
				Failed: {preloadStats.failed}
				<br />
				Complete: {preloadStats.isComplete ? 'Yes' : 'No'}
			</div>

			<button
				onClick={handleClearCache}
				style={{
					background: '#ff4444',
					color: 'white',
					border: 'none',
					padding: '6px 12px',
					borderRadius: '4px',
					fontSize: '11px',
					cursor: 'pointer'
				}}
			>
				Clear Cache
			</button>
		</div>
	)
}

export default CacheDiagnostics
