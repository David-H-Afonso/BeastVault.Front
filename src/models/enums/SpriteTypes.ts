/**
 * Tipos de sprites disponibles para mostrar en la aplicación
 */
export const SpriteType = {
	SPRITES: 'sprites', // GitHub sprites (gen8 y anterior + gen9)
	HOME: 'home', // Pokemon Home sprites
	GIFS: 'gifs', // GIFs animados (showdown)
	DEFAULT: 'default', // PokeAPI default sprites
	OFFICIAL: 'official', // Official artwork
} as const

export type SpriteType = (typeof SpriteType)[keyof typeof SpriteType]
export type SpriteTypeName = (typeof SpriteType)[keyof typeof SpriteType]

/**
 * Configuración de cada tipo de sprite
 */
export const SPRITE_TYPE_CONFIG = {
	[SpriteType.SPRITES]: {
		name: 'Sprites',
		description: 'Sprites de GitHub (Gen 8 y anteriores + Gen 9)',
		memoryImpact: 'low',
		quality: 'high',
		animated: false,
		recommended: true,
		warning: undefined,
	},
	[SpriteType.HOME]: {
		name: 'Pokémon HOME',
		description: 'Sprites oficiales de Pokémon HOME',
		memoryImpact: 'medium',
		quality: 'high',
		animated: false,
		recommended: true,
		warning: undefined,
	},
	[SpriteType.GIFS]: {
		name: 'GIFs',
		description: 'Sprites animados de Showdown (⚠️ Alto consumo de memoria)',
		memoryImpact: 'high',
		quality: 'medium',
		animated: true,
		recommended: false,
		warning: 'Puede causar problemas de rendimiento con muchos Pokémon visibles',
	},
	[SpriteType.DEFAULT]: {
		name: 'PokeAPI',
		description: 'Sprites básicos de PokeAPI',
		memoryImpact: 'low',
		quality: 'medium',
		animated: false,
		recommended: false,
		warning: undefined,
	},
	[SpriteType.OFFICIAL]: {
		name: 'Official art',
		description: 'Ilustraciones oficiales de alta calidad',
		memoryImpact: 'medium',
		quality: 'very-high',
		animated: false,
		recommended: true,
		warning: undefined,
	},
} as const

export type SpriteTypeConfig = (typeof SPRITE_TYPE_CONFIG)[keyof typeof SPRITE_TYPE_CONFIG]
