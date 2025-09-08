// Export all cache-related services and utilities
export { staticResourceCache } from './StaticResourceCache'
export { cacheService, CacheKeys } from './CacheService'

// Re-export optimized PokeAPI functions
export { 
	getPokeApiPokemon, 
	getPokeBallIcon, 
	getTeraTypeIcon, 
	getBestSpriteUrl,
	POKEAPI_BASE_URL 
} from './Pokeapi'

// Export cached resource hooks
export { 
	useCachedImage, 
	useCachedApi, 
	useImagePreloader 
} from '../hooks/useCachedResources'

// Export preloader hooks
export { 
	useStaticResourcePreloader, 
	usePokemonResourcePreloader, 
	useCacheStats,
	PreloadPriority,
	type PreloadPriorityType
} from '../hooks/useResourcePreloader'

// Export cached components
export { CachedImage } from '../components/CachedImage'
export { CacheDiagnostics } from '../components/CacheDiagnostics'
