/**
 * Beast Vault - Type Colors Utility
 * ================================
 *
 * Centraliza los colores de tipos Pokemon usando las variables CSS definidas
 * Esto asegura consistencia en toda la aplicación
 */

export const TYPE_COLORS = {
	normal: 'var(--type-normal)',
	fire: 'var(--type-fire)',
	water: 'var(--type-water)',
	electric: 'var(--type-electric)',
	grass: 'var(--type-grass)',
	ice: 'var(--type-ice)',
	fighting: 'var(--type-fighting)',
	poison: 'var(--type-poison)',
	ground: 'var(--type-ground)',
	flying: 'var(--type-flying)',
	psychic: 'var(--type-psychic)',
	bug: 'var(--type-bug)',
	rock: 'var(--type-rock)',
	ghost: 'var(--type-ghost)',
	dragon: 'var(--type-dragon)',
	dark: 'var(--type-dark-type)',
	steel: 'var(--type-steel)',
	fairy: 'var(--type-fairy)',
} as const

/**
 * Obtiene el color de un tipo Pokemon usando las variables CSS
 * @param typeName - Nombre del tipo (ej: "fire", "water", "grass")
 * @returns Variable CSS del color del tipo
 */
export function getTypeColor(typeName: string): string {
	const typeKey = typeName.toLowerCase() as keyof typeof TYPE_COLORS
	return TYPE_COLORS[typeKey] || 'var(--type-default)'
}

/**
 * Obtiene el color computado de un tipo Pokemon desde el DOM
 * Útil cuando necesitas el valor hexadecimal real para gradientes, etc.
 * @param typeName - Nombre del tipo
 * @returns Color computado en formato hexadecimal o string
 */
export function getComputedTypeColor(typeName: string): string {
	if (typeof window === 'undefined') {
		// Fallback para SSR
		return '#68a090'
	}

	const typeKey = typeName.toLowerCase() as keyof typeof TYPE_COLORS
	const cssVar = TYPE_COLORS[typeKey] || 'var(--type-default)'

	// Crear un elemento temporal para obtener el valor computado
	const tempElement = document.createElement('div')
	tempElement.style.color = cssVar
	document.body.appendChild(tempElement)

	const computedColor = window.getComputedStyle(tempElement).color
	document.body.removeChild(tempElement)

	// Convertir rgb a hex si es necesario
	if (computedColor.startsWith('rgb')) {
		return rgbToHex(computedColor)
	}

	return computedColor
}

/**
 * Convierte un color RGB a hexadecimal
 * @param rgb - Color en formato rgb(r, g, b)
 * @returns Color en formato hexadecimal
 */
function rgbToHex(rgb: string): string {
	const result = rgb.match(/\d+/g)
	if (!result || result.length < 3) {
		return '#68a090' // Fallback
	}

	const r = parseInt(result[0])
	const g = parseInt(result[1])
	const b = parseInt(result[2])

	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Lista de todos los tipos disponibles
 */
export const POKEMON_TYPES = Object.keys(TYPE_COLORS) as (keyof typeof TYPE_COLORS)[]
