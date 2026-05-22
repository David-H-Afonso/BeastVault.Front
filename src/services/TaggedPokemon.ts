import type { PokemonListItemDto, TagDto } from '@/models/api/types'
import type { PokemonListFilterDto } from '@/models/Pokemon'
import { getPokemonList } from './Pokemon'
import { getAllTags } from './Tags'

/**
 * Get all tags that have pokemon
 */
export async function getTagsWithPokemon(): Promise<TagDto[]> {
	return await getAllTags()
}

/**
 * Fetch pokemon for a specific tag with pagination
 */
export async function fetchPokemonForTag(
	tagId: number,
	tagName: string,
	filters: Omit<
		PokemonListFilterDto,
		'tagIds' | 'tagNames' | 'anyTagIds' | 'anyTagNames' | 'hasNoTags'
	>,
	skip: number,
	take: number
): Promise<{
	tagName: string
	pokemon: PokemonListItemDto[]
}> {
	const result = await getPokemonList({
		...filters,
		tagIds: [tagId],
		Skip: skip,
		Take: take,
	})

	return {
		tagName,
		pokemon: result.items || [],
	}
}

/**
 * Fetch untagged pokemon with pagination
 */
export async function fetchUntaggedPokemon(
	filters: Omit<
		PokemonListFilterDto,
		'tagIds' | 'tagNames' | 'anyTagIds' | 'anyTagNames' | 'hasNoTags'
	>,
	skip: number,
	take: number
): Promise<{
	tagName: string
	pokemon: PokemonListItemDto[]
}> {
	const result = await getPokemonList({
		...filters,
		hasNoTags: true,
		Skip: skip,
		Take: take,
	})

	return {
		tagName: 'No Tags',
		pokemon: result.items || [],
	}
}

/**
 * Combine results from multiple tag fetches
 */
export function combineTagResults(
	results: Array<{
		tagName: string
		pokemon: PokemonListItemDto[]
	}>
): {
	allPokemon: PokemonListItemDto[]
	tagGroups: { tagName: string; pokemon: PokemonListItemDto[] }[]
	totalUnique: number
	totalPokemon: number
} {
	let allPokemon: PokemonListItemDto[] = []
	const tagGroups: { tagName: string; pokemon: PokemonListItemDto[] }[] = []

	results.forEach((result) => {
		// Only add tag groups that have pokemon
		if (result.pokemon.length > 0) {
			tagGroups.push({
				tagName: result.tagName,
				pokemon: result.pokemon,
			})
			allPokemon = [...allPokemon, ...result.pokemon]
		}
	})

	// Calculate total unique pokemon
	const uniquePokemonIds = new Set(allPokemon.map((p) => p.id))
	const totalUnique = uniquePokemonIds.size

	return {
		allPokemon,
		tagGroups,
		totalUnique,
		totalPokemon: allPokemon.length,
	}
}
