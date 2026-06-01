import { resolveSpriteUrl } from '@/utils/spriteUtils'

/**
 * Get the icon URL for a Pokemon type — served through the local backend cache.
 * @param typeName The name of the Pokemon type (e.g., "fire", "water", "grass")
 * @returns The URL to the type icon
 */
export function getTypeIconUrl(typeName: string): string {
	if (!typeName) return ''

	const typeNameLower = typeName.toLowerCase()

	// Map type names to their IDs for the sprite URLs
	const typeIdMap: { [key: string]: number } = {
		normal: 1,
		fighting: 2,
		flying: 3,
		poison: 4,
		ground: 5,
		rock: 6,
		bug: 7,
		ghost: 8,
		steel: 9,
		fire: 10,
		water: 11,
		grass: 12,
		electric: 13,
		psychic: 14,
		ice: 15,
		dragon: 16,
		dark: 17,
		fairy: 18,
	}

	const typeId = typeIdMap[typeNameLower]
	const id = typeId ?? typeNameLower
	return resolveSpriteUrl(`/sprites/types/${id}.png`) ?? ''
}

/**
 * Get the icon URL for a Tera type (with crystal effect)
 * @param typeName The name of the tera type
 * @returns The URL to the tera type icon
 */
export function getTeraTypeIconUrl(typeName: string): string {
	if (!typeName) return ''

	return getTypeIconUrl(typeName.toLowerCase())
}
