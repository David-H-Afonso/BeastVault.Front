import { simpleFetcher } from '@/utils/simpleFetcher'
import { getCachedSpecies } from './PokedexCache'

const POKEAPI = 'https://pokeapi.co/api/v2'
const nameCache = new Map<string, string>()
const speciesCache = new Map<number, string>()

export class PokemonNameService {
	static async getFullName(speciesId: number, form: number = 0): Promise<string> {
		const cacheKey = `${speciesId}-${form}`
		if (nameCache.has(cacheKey)) return nameCache.get(cacheKey)!

		try {
			// Try backend cache first
			const cached = await getCachedSpecies(speciesId)
			if (cached?.species?.localizedNames?.en) {
				const name = cached.species.localizedNames.en
				nameCache.set(cacheKey, name)
				return name
			}

			// Fallback to PokeAPI
			const speciesData = await simpleFetcher.fetchWithCache<any>(
				`${POKEAPI}/pokemon-species/${speciesId}`
			)
			const englishName = speciesData.names?.find((n: any) => n.language.name === 'en')
			const finalName = englishName?.name || speciesData.name || `Pokemon #${speciesId}`

			nameCache.set(cacheKey, finalName)
			return finalName
		} catch {
			return `Pokemon #${speciesId}`
		}
	}

	static async getSpeciesName(speciesId: number): Promise<string> {
		if (speciesCache.has(speciesId)) return speciesCache.get(speciesId)!

		try {
			const cached = await getCachedSpecies(speciesId)
			if (cached?.species?.localizedNames?.en) {
				const name = cached.species.localizedNames.en
				speciesCache.set(speciesId, name)
				return name
			}

			const data = await simpleFetcher.fetchWithCache<any>(
				`${POKEAPI}/pokemon-species/${speciesId}`
			)
			const englishName = data.names?.find((n: any) => n.language.name === 'en')
			const finalName = englishName?.name || data.name || `Pokemon #${speciesId}`

			speciesCache.set(speciesId, finalName)
			return finalName
		} catch {
			return `Pokemon #${speciesId}`
		}
	}

	static clearCache() {
		nameCache.clear()
		speciesCache.clear()
	}
}
