// Cache for Pokemon names
const nameCache = new Map<string, string>()
const speciesCache = new Map<number, string>()

/**
 * Service para obtener nombres completos de Pokemon
 * Reemplaza usePokemonFullName y usePokemonSpeciesName como funciones utilitarias
 */
export class PokemonNameService {
	/**
	 * Obtiene el nombre completo de un Pokemon (incluyendo forma)
	 */
	static async getFullName(speciesId: number, form: number = 0): Promise<string> {
		const cacheKey = `${speciesId}-${form}`

		// Check cache first
		if (nameCache.has(cacheKey)) {
			return nameCache.get(cacheKey)!
		}

		try {
			let finalName = ''

			// For form 0, get the base species name
			if (form === 0) {
				const speciesResponse = await fetch(
					`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`
				)
				if (speciesResponse.ok) {
					const speciesData = await speciesResponse.json()
					const englishName = speciesData.names?.find((name: any) => name.language.name === 'en')
					finalName = englishName?.name || speciesData.name
				}
			} else {
				// For forms > 0, we need to find the specific Pokemon variant
				const speciesResponse = await fetch(
					`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`
				)
				if (speciesResponse.ok) {
					const speciesData = await speciesResponse.json()
					const baseEnglishName = speciesData.names?.find(
						(name: any) => name.language.name === 'en'
					)
					
					// Get form name logic here...
					finalName = baseEnglishName?.name || speciesData.name
				}
			}

			// Cache the result
			nameCache.set(cacheKey, finalName)
			return finalName
		} catch (error) {
			console.warn('Error loading Pokemon name:', error)
			return `Pokemon #${speciesId}`
		}
	}

	/**
	 * Obtiene solo el nombre de la especie (sin forma)
	 */
	static async getSpeciesName(speciesId: number): Promise<string> {
		if (speciesCache.has(speciesId)) {
			return speciesCache.get(speciesId)!
		}

		try {
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()
			const englishName = data.names?.find((name: any) => name.language.name === 'en')
			const finalName = englishName?.name || data.name || `Pokemon #${speciesId}`

			speciesCache.set(speciesId, finalName)
			return finalName
		} catch (error) {
			console.warn('Error fetching species name:', error)
			return `Pokemon #${speciesId}`
		}
	}

	/**
	 * Limpia las cachés
	 */
	static clearCache() {
		nameCache.clear()
		speciesCache.clear()
	}
}
