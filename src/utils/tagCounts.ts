import type { TagDto } from '@/models/api/types'

/**
 * Resolves the count to display next to a tag in the Collection sidebar.
 *
 * When faceted counts are available they reflect the current search/filters,
 * so a tag with no matches shows 0. Until the facet data has loaded (null),
 * it falls back to the tag's global `pokemonCount` from GET /tags.
 */
export function resolveTagDisplayCount(
	tag: Pick<TagDto, 'id' | 'pokemonCount'>,
	facetCounts: Record<number, number> | null | undefined
): number {
	if (!facetCounts) return tag.pokemonCount
	return facetCounts[tag.id] ?? 0
}

/**
 * Resolves the "All Pokémon" count. Uses the search/filter-aware facet total
 * (which ignores tag selection) when available, otherwise the raw list total.
 */
export function resolveAllPokemonCount(
	facetTotal: number | null | undefined,
	fallbackTotal: number
): number {
	return facetTotal ?? fallbackTotal
}
