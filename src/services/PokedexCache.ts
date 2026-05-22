import { customFetch } from '@/utils'
import { environment } from '@/environments'

export interface CachedSpeciesData {
	found: boolean
	species?: {
		speciesId: number
		name: string
		localizedNames: Record<string, string>
		genus: string
		flavorText: string
		generation: number
		color: string
		shape: string
		habitat: string
		growthRate: string
		captureRate: number
		baseHappiness: number
		hatchCounter: number
		genderRate: number
		isLegendary: boolean
		isMythical: boolean
		isBaby: boolean
		hasGenderDifferences: boolean
		formsSwitchable: boolean
		eggGroups: string[]
		varieties: { name: string; id: number; isDefault: boolean }[]
		evolutionChainUrl: string
	}
	forms?: CachedPokemonForm[]
}

export interface CachedPokemonForm {
	pokemonId: number
	speciesId: number
	name: string
	height: number
	weight: number
	baseExperience: number
	isDefault: boolean
	types: { slot: number; name: string }[]
	abilities: { name: string; isHidden: boolean; slot: number }[]
	baseStats: Record<string, number>
	sprites: Record<string, unknown>
	cries: Record<string, string>
}

export interface PopulationStatus {
	totalSpecies: number
	totalForms: number
	maxSpeciesId: number
	lastUpdated: string | null
	isPopulating: boolean
	populatingCurrent: number
	populatingTotal: number
}

const memoryCache = new Map<number, CachedSpeciesData>()

export async function getCachedSpecies(speciesId: number): Promise<CachedSpeciesData | null> {
	if (memoryCache.has(speciesId)) return memoryCache.get(speciesId)!

	try {
		const data = await customFetch<CachedSpeciesData>(
			`${environment.baseUrl}/pokedex/species/${speciesId}`
		)
		if (data.found) {
			memoryCache.set(speciesId, data)
		}
		return data
	} catch {
		return null
	}
}

export async function getPopulationStatus(): Promise<PopulationStatus> {
	return customFetch<PopulationStatus>(`${environment.baseUrl}/pokedex/status`)
}

export async function populatePokedex(
	startId?: number,
	endId?: number
): Promise<{ message: string; populated: number }> {
	return customFetch(`${environment.baseUrl}/pokedex/populate`, {
		method: 'POST',
		body: { startId: startId ?? 1, endId: endId ?? 1025 },
	})
}

export function clearPokedexMemoryCache() {
	memoryCache.clear()
}
