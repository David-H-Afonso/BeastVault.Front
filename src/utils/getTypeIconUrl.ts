/**
 * Get the icon URL for a Pokemon type
 * @param typeName The name of the Pokemon type (e.g., "fire", "water", "grass")
 * @returns The URL to the type icon
 */
export function getTypeIconUrl(typeName: string): string {
	if (!typeName) return ''

	const typeNameLower = typeName.toLowerCase()

	// Use Pokemon type icons from a reliable CDN
	// These are the standard Pokemon type icons used across the franchise
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${typeNameLower}.png`
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
