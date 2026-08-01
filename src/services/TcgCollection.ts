import { environment } from '@/environments'
import { customFetch } from '@/utils'

export interface TcgPriceDto {
	eur: number | null
	usd: number | null
	updatedAt: string | null
	cardmarketUrl: string | null
	tcgplayerUrl: string | null
	variantEur?: Record<string, number>
	variantUsd?: Record<string, number>
}

export interface TcgOwnedEntryDto {
	id: number
	variant: string
	condition: string
	language: string
	quantity: number
	notes: string | null
}

export interface TcgCardDto {
	id: number
	providerCardId: string
	name: string
	nameEn: string | null
	number: string
	rarity: string | null
	artist: string | null
	imageSmall: string | null
	imageLarge: string | null
	nationalPokedexNumbers: number[]
	variants: string[]
	setId: number
	setProviderId: string
	setName: string
	prices: TcgPriceDto
	owned: TcgOwnedEntryDto[]
	totalOwned: number
	detailedAt: string | null
	priceCheckedAt: string | null
	lastRefreshError: string | null
}

export interface TcgCardPageDto {
	items: TcgCardDto[]
	page: number
	pageSize: number
	hasMore: boolean
	totalCount: number | null
}

export interface TcgSetDto {
	id: number
	providerSetId: string
	name: string
	nameEn: string | null
	seriesId: string | null
	series: string | null
	officialCode: string | null
	printedTotal: number
	total: number
	releaseDate: string | null
	symbolUrl: string | null
	logoUrl: string | null
	ownedUniqueCards: number
	ownedCopies: number
	completionPercent: number
}

export interface UserCardDto {
	id: number
	card: TcgCardDto
	variant: string
	condition: string
	language: string
	quantity: number
	notes: string | null
	addedAt: string
	unitValueEur: number | null
	unitValueUsd: number | null
	totalValueEur: number | null
	totalValueUsd: number | null
}

export interface TcgCollectionEntryDto {
	id: number
	variant: string
	condition: string
	language: string
	quantity: number
	notes: string | null
	addedAt: string
	updatedAt: string
	unitValueEur: number | null
	unitValueUsd: number | null
	totalValueEur: number | null
	totalValueUsd: number | null
}

export interface TcgCollectionGroupDto {
	card: TcgCardDto
	entries: TcgCollectionEntryDto[]
	totalCopies: number
	totalValueEur: number | null
	totalValueUsd: number | null
	updatedAt: string
}

export interface TcgCollectionPageDto {
	items: TcgCollectionGroupDto[]
	page: number
	pageSize: number
	totalCount: number
}

export interface TcgCardRefreshResultDto {
	cardId: number
	success: boolean
	error: string | null
	card: TcgCardDto | null
}

export interface TcgCardBatchRefreshDto {
	items: TcgCardRefreshResultDto[]
	requested: number
	processed: number
	truncated: boolean
}

export interface TcgMissingSpeciesDto {
	speciesId: number
	speciesName: string
}

export interface TcgDexProgressDto {
	name: string
	owned: number
	total: number
	completionPercent: number
	missing: TcgMissingSpeciesDto[]
}

export interface TcgSetProgressDto {
	setId: number
	providerSetId: string
	name: string
	owned: number
	total: number
	completionPercent: number
}

export interface TcgCollectionStatsDto {
	uniqueCards: number
	totalCopies: number
	totalValueEur: number
	totalValueUsd: number
	national: TcgDexProgressDto
	regions: TcgDexProgressDto[]
	sets: TcgSetProgressDto[]
	topCards: UserCardDto[]
}

export interface TcgApiKeyStatusDto {
	configured: boolean
	maskedApiKey: string | null
	updatedAt: string | null
}

export interface AddTcgCollectionEntryRequest {
	cardId: number
	variant: string
	condition: string
	language: string
	quantity: number
	notes: string | null
}

export type UpdateTcgCollectionEntryRequest = Partial<
	Pick<AddTcgCollectionEntryRequest, 'variant' | 'condition' | 'language' | 'quantity' | 'notes'>
>

export interface TcgCardSearchParams {
	query?: string
	setId?: number
	number?: string
	speciesId?: number
	page?: number
	pageSize?: number
}

export interface TcgCollectionParams {
	query?: string
	setId?: number
	language?: string
	condition?: string
	page?: number
	pageSize?: number
}

const headers = { Accept: 'application/json' }
const tcgUrl = (path: string) => `${environment.baseUrl}${path}`

const definedParams = (
	params: Record<string, string | number | undefined>
): Record<string, string | number> =>
	Object.fromEntries(
		Object.entries(params).filter((entry): entry is [string, string | number] => entry[1] !== undefined)
	)

export function getTcgSets(search = ''): Promise<TcgSetDto[]> {
	return customFetch<TcgSetDto[]>(tcgUrl('/tcg/sets'), {
		headers,
		params: { search },
	})
}

export function getTcgSetCards(
	setProviderId: string,
	page = 1,
	pageSize = 60
): Promise<TcgCardPageDto> {
	return customFetch<TcgCardPageDto>(
		tcgUrl(`/tcg/sets/${encodeURIComponent(setProviderId)}/cards`),
		{ headers, params: { page, pageSize } }
	)
}

export function searchTcgCards(params: TcgCardSearchParams): Promise<TcgCardPageDto> {
	return customFetch<TcgCardPageDto>(tcgUrl('/tcg/cards/search'), {
		headers,
		params: definedParams({ page: 1, pageSize: 30, ...params }),
	})
}

export function getTcgCard(id: number): Promise<TcgCardDto> {
	return customFetch<TcgCardDto>(tcgUrl(`/tcg/cards/${id}`), { headers })
}

export function getTcgSpeciesCards(
	speciesId: number,
	page = 1,
	pageSize = 60
): Promise<TcgCardPageDto> {
	return customFetch<TcgCardPageDto>(tcgUrl(`/tcg/species/${speciesId}/cards`), {
		headers,
		params: { page, pageSize },
	})
}

export function getTcgCollection(params: TcgCollectionParams = {}): Promise<TcgCollectionPageDto> {
	return customFetch<TcgCollectionPageDto>(tcgUrl('/tcg/collection'), {
		headers,
		params: definedParams({ page: 1, pageSize: 60, ...params }),
	})
}

export function addTcgCollectionEntry(
	request: AddTcgCollectionEntryRequest
): Promise<UserCardDto> {
	return customFetch<UserCardDto>(tcgUrl('/tcg/collection'), {
		method: 'POST',
		body: request,
		headers,
	})
}

export function updateTcgCollectionEntry(
	id: number,
	request: UpdateTcgCollectionEntryRequest
): Promise<UserCardDto> {
	return customFetch<UserCardDto>(tcgUrl(`/tcg/collection/${id}`), {
		method: 'PATCH',
		body: request,
		headers,
	})
}

export async function deleteTcgCollectionEntry(id: number): Promise<void> {
	await customFetch<void>(tcgUrl(`/tcg/collection/${id}`), {
		method: 'DELETE',
		headers,
	})
}

export function getTcgCollectionStats(): Promise<TcgCollectionStatsDto> {
	return customFetch<TcgCollectionStatsDto>(tcgUrl('/tcg/collection/stats'), { headers })
}

export function refreshTcgCard(id: number): Promise<TcgCardRefreshResultDto> {
	return customFetch<TcgCardRefreshResultDto>(tcgUrl(`/tcg/cards/${id}/refresh`), {
		method: 'POST',
		headers,
	})
}

export function refreshTcgCards(
	request: { cardIds?: number[]; ownedOnly: boolean }
): Promise<TcgCardBatchRefreshDto> {
	return customFetch<TcgCardBatchRefreshDto>(tcgUrl('/tcg/cards/refresh'), {
		method: 'POST',
		body: request,
		headers,
	})
}

export async function deleteTcgCollectionCard(cardId: number): Promise<void> {
	await customFetch<void>(tcgUrl(`/tcg/collection/cards/${cardId}`), {
		method: 'DELETE',
		headers,
	})
}

export async function deleteTcgCollectionCards(cardIds: number[]): Promise<void> {
	await customFetch<void>(tcgUrl('/tcg/collection/cards'), {
		method: 'DELETE',
		body: { cardIds },
		headers,
	})
}

export function getTcgApiKeyStatus(): Promise<TcgApiKeyStatusDto> {
	return customFetch<TcgApiKeyStatusDto>(tcgUrl('/auth/preferences/tcg-api-key'), { headers })
}

export function updateTcgApiKey(apiKey: string | null): Promise<TcgApiKeyStatusDto> {
	return customFetch<TcgApiKeyStatusDto>(tcgUrl('/auth/preferences/tcg-api-key'), {
		method: 'PATCH',
		body: { apiKey },
		headers,
	})
}
