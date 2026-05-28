import { customFetch } from '@/utils'
import { environment } from '@/environments'
import { resolveSpriteUrl } from '@/utils/spriteUtils'
import type { PokemonSpritesDto } from '@/models/api/types'

export interface DexGridEntry {
	speciesId: number
	name: string
	generation: number
	isUnlocked: boolean
	ownedCount: number
	types: string[]
	sprites: PokemonSpritesDto | null
	isLegendary: boolean
	isMythical: boolean
	hasShiny: boolean
}

export interface DexGridResponse {
	items: DexGridEntry[]
	total: number
	page: number
	pageSize: number
}

export interface DexOwnedPokemon {
	id: number
	nickname: string | null
	isShiny: boolean
	level: number
	formName: string
	originGame: string
	spriteUrl: string
}

export interface DexSpeciesDetail {
	speciesId: number
	name: string
	flavorText: string
	genus: string
	generation: number
	isLegendary: boolean
	isMythical: boolean
	isBaby: boolean
	color: string
	types: string[]
	abilities: { name: string; isHidden: boolean; slot: number }[]
	baseStats: Record<string, number>
	captureRate: number
	baseHappiness: number
	genderRate: number
	eggGroups: string[]
	gameIndices: { game: string; entryNumber: number }[]
	sprites: PokemonSpritesDto | null
	isUnlocked: boolean
	ownedPokemon: DexOwnedPokemon[]
	evolutionChainJson: string | null
}

export async function getDexGrid(params: {
	page?: number
	pageSize?: number
	generation?: number | null
	search?: string
	unlockedOnly?: boolean
}): Promise<DexGridResponse> {
	const query = new URLSearchParams()
	if (params.page) query.set('page', String(params.page))
	if (params.pageSize) query.set('pageSize', String(params.pageSize))
	if (params.generation != null) query.set('generation', String(params.generation))
	if (params.search) query.set('search', params.search)
	if (params.unlockedOnly) query.set('unlockedOnly', 'true')

	const url = `${environment.baseUrl}/dex?${query.toString()}`
	const res = await customFetch<DexGridResponse>(url)
	// Resolve owned pokemon sprite URLs
	return res
}

export async function getDexSpecies(speciesId: number): Promise<DexSpeciesDetail> {
	const detail = await customFetch<DexSpeciesDetail>(`${environment.baseUrl}/dex/${speciesId}`)
	detail.ownedPokemon = detail.ownedPokemon.map((p) => ({
		...p,
		spriteUrl: resolveSpriteUrl(p.spriteUrl) ?? '',
	}))
	return detail
}
