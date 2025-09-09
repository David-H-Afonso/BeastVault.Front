import React, { useState, useEffect } from 'react'
import { usePokemon } from '@/hooks/usePokemon'
import { PokemonCacheManager } from '@/utils'
import './PokemonCacheDiagnostics.scss'

interface PokemonCacheDiagnosticsProps {
	className?: string
	isVisible?: boolean
}

export const PokemonCacheDiagnostics: React.FC<PokemonCacheDiagnosticsProps> = ({
	className,
	isVisible = false,
}) => {
	const { pokeApiCache, clearPokeApiCache, clearAllPokeApiCache } = usePokemon()
	const [cacheStorageStats, setCacheStorageStats] = useState({ totalItems: 0, totalSize: 0 })

	useEffect(() => {
		if (isVisible) {
			const loadCacheStats = async () => {
				const stats = await PokemonCacheManager.getCacheStorageSize()
				setCacheStorageStats(stats)
			}
			loadCacheStats()
		}
	}, [isVisible])

	if (!isVisible) return null

	const cacheSize = PokemonCacheManager.getCacheSize(pokeApiCache)
	const isNearLimit = PokemonCacheManager.isCacheNearLimit(pokeApiCache)

	const getLocalStorageCacheSize = (): number => {
		let count = 0
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key && key.startsWith('beastvault_cache_pokemon_')) {
				count++
			}
		}
		return count
	}

	const localStorageCacheSize = getLocalStorageCacheSize()

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const handleClearAllCache = async () => {
		await clearAllPokeApiCache()
		// Refresh cache storage stats
		const stats = await PokemonCacheManager.getCacheStorageSize()
		setCacheStorageStats(stats)
	}

	return (
		<div className={`pokemon-cache-diagnostics ${className || ''}`}>
			<h4>Pokemon Cache Status</h4>
			<div className='cache-info'>
				<div className={`cache-stat ${isNearLimit ? 'warning' : ''}`}>
					<span className='label'>Memory Cache:</span>
					<span className='value'>{cacheSize} entries</span>
					{isNearLimit && <span className='warning-icon'>⚠️</span>}
				</div>
				<div className='cache-stat'>
					<span className='label'>Cache Storage:</span>
					<span className='value'>
						{cacheStorageStats.totalItems} entries ({formatBytes(cacheStorageStats.totalSize)})
					</span>
				</div>
				<div className='cache-stat'>
					<span className='label'>Legacy LocalStorage:</span>
					<span className='value'>{localStorageCacheSize} entries</span>
				</div>
			</div>

			<div className='cache-actions'>
				<button
					onClick={clearPokeApiCache}
					className='cache-btn clear-memory'
					title='Clear memory cache only'>
					Clear Memory Cache
				</button>
				<button
					onClick={handleClearAllCache}
					className='cache-btn clear-all'
					title='Clear both memory and Cache Storage'>
					Clear All Cache
				</button>
			</div>

			{isNearLimit && (
				<div className='cache-warning'>
					<p>⚠️ Cache is near capacity. Consider clearing cache to improve performance.</p>
				</div>
			)}
		</div>
	)
}
