/**
 * Get the icon URL for a Pokemon type
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
	if (!typeId) {
		// Fallback to original name-based URL if type not found
		return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-vi/omega-ruby-alpha-sapphire/${typeNameLower}.png`
	}

	// Use type ID instead of name for the URL
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-vi/omega-ruby-alpha-sapphire/${typeId}.png`
}

/**
 * Get the icon URL for a Tera type (with crystal effect)
 * @param typeName The name of the tera type
 * @returns The URL to the tera type icon
 */
export function getTeraTypeIconUrl(typeName: string): string {
	if (!typeName) return ''

	const typeNameLower = typeName.toLowerCase()

	// For now, use the same icons as regular types
	// In the future, we could use special tera type icons if available
	return getTypeIconUrl(typeNameLower)
}
