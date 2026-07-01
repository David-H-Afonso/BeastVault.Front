/**
 * BEAST VAULT API - TypeScript Interfaces
 *
 * Este archivo contiene TODAS las interfaces TypeScript para el frontend
 * que corresponden exactamente a los endpoints y DTOs de la API de Beast Vault.
 *
 * Generado automáticamente el: 17 de Agosto, 2025
 *
 * NUEVAS FUNCIONALIDADES:
 * - ✅ Detección automática de generaciones (OriginGeneration vs CapturedGeneration)
 * - ✅ Formas dinámicas basadas en Mega Stones y Gigantamax
 * - ✅ Flags CanGigantamax y HasMegaStone para mejor experiencia visual
 * - ✅ Soporte completo para archivos PKM legacy (.pk1, .pk2, etc.)
 * - ✅ Sistema de tags para Pokemon
 *
 * IMPORTANTE: Este archivo debe actualizarse cada vez que cambien los endpoints o DTOs
 */

// ===================================
// TIPOS BÁSICOS Y ENUMS
// ===================================

export type ImportStatus = 'imported' | 'duplicate' | 'error'

export type FileFormat =
	| 'pk1'
	| 'pk2'
	| 'pk3'
	| 'pk4'
	| 'pk5'
	| 'pk6'
	| 'pk7'
	| 'pk8'
	| 'pk9'
	| 'pb7'
	| 'pb8'
	| 'ek1'
	| 'ek2'
	| 'ek3'
	| 'ek4'
	| 'ek5'
	| 'ek6'
	| 'ek7'
	| 'ek8'
	| 'ek9'
	| 'ekx'

export const TypeFilterMode = {
	HasAnyType: 0,
	HasAllTypes: 1,
	HasOnlyTypes: 2,
	PrimaryTypeOnly: 3,
	ExactTypeOrder: 4,
	BothTypesAnyOrder: 5,
} as const

export type TypeFilterModeValue = (typeof TypeFilterMode)[keyof typeof TypeFilterMode]

export const PokemonSortField = {
	Id: 0,
	PokedexNumber: 1,
	SpeciesName: 2,
	Nickname: 3,
	Level: 4,
	OriginGeneration: 5,
	CapturedGeneration: 6,
	Pokeball: 7,
	Gender: 8,
	IsShiny: 9,
	Form: 10,
	CreatedAt: 11,
	Favorite: 12,
} as const

export type PokemonSortFieldValue = (typeof PokemonSortField)[keyof typeof PokemonSortField]

export const SortDirection = {
	Ascending: 0,
	Descending: 1,
} as const

export type SortDirectionValue = (typeof SortDirection)[keyof typeof SortDirection]

export const Gender = {
	Unknown: 0,
	Male: 1,
	Female: 2,
} as const

export type GenderValue = (typeof Gender)[keyof typeof Gender]

// ===================================
// INTERFACES DE RESULTADO
// ===================================

export interface PagedResult<T> {
	items: T[]
	total: number
}

export interface ImportResultDto {
	/** Nombre del archivo subido */
	fileName: string
	/** Estado del import: "imported", "duplicate", o "error" */
	status: ImportStatus
	/** ID del Pokémon creado (solo si status es "imported") */
	pokemonId?: number
	/** Mensaje de error (solo si status es "error") */
	message?: string
}

// ===================================
// INTERFACES DE CONSULTA (QUERY)
// ===================================

export interface PokemonQuery {
	/** Búsqueda de texto en nickname o nombre del entrenador original */
	search?: string
	/** Filtrar por ID de especie (ej: 1 = Bulbasaur) */
	speciesId?: number
	/** Filtrar por ID de forma (ej: 0 = Normal, 1 = Alolan, 2 = Galarian) */
	form?: number
	/** Filtrar por Pokémon shiny */
	isShiny?: boolean
	/** Filtrar por ID de Pokébola */
	ballId?: number
	/** Filtrar por juego de origen */
	originGame?: number
	/** Filtrar por tipo Tera (Gen 9) */
	teraType?: number
	/** Número de elementos a saltar (paginación) */
	skip?: number
	/** Número de elementos a devolver (máximo recomendado: 100) */
	take?: number
}

export interface AdvancedPokemonQuery {
	// Filtros básicos
	/** Búsqueda de texto en nickname, nombre OT y notas */
	search?: string
	/** Filtrar por número específico de la Pokédex (Species ID) */
	pokedexNumber?: number
	/** Filtrar por nombre de especie (coincidencia parcial) */
	speciesName?: string
	/** Filtrar por nickname (coincidencia parcial) */
	nickname?: string
	/** Filtrar por estado shiny */
	isShiny?: boolean
	/** Filtrar por favorito */
	favorite?: boolean
	/** Filtrar Pokémon capaces de Gigantamax */
	canGigantamax?: boolean
	/** Filtrar Pokémon con Mega Stone equipada */
	hasMegaStone?: boolean
	/** Filtrar huevos */
	isEgg?: boolean
	/** Filtrar por ID de forma */
	form?: number
	/** Filtrar por género (0 = indefinido, 1 = macho, 2 = hembra) */
	gender?: number

	// Filtros de generación
	/** Filtrar por generación donde la especie fue introducida (ej: Rowlet = 7) */
	originGeneration?: number
	/** Filtrar por generación donde fue capturado (ej: Rowlet en SV = 9) */
	capturedGeneration?: number

	// Filtros de equipamiento
	/** Filtrar por ID de Pokébola */
	pokeballId?: number
	/** Filtrar por ID de objeto equipado */
	heldItemId?: number

	// Filtros de tipo
	/** ID del tipo primario para filtrado de tipos */
	primaryType?: number
	/** ID del tipo secundario para filtrado de tipos */
	secondaryType?: number
	/** Modo de filtro de tipos (cómo aplicar los filtros de tipo) */
	typeFilterMode?: TypeFilterModeValue
	/** Si enforcar el orden exacto de tipos para filtrado de doble tipo */
	enforceTypeOrder?: boolean

	// Filtros de nivel y estadísticas
	/** Filtro de nivel mínimo */
	minLevel?: number
	/** Filtro de nivel máximo */
	maxLevel?: number

	// Ordenamiento
	/** Campo de ordenamiento primario */
	sortBy?: PokemonSortFieldValue
	/** Dirección de ordenamiento primario */
	sortDirection?: SortDirectionValue
	/** Campo de ordenamiento secundario (opcional) */
	thenSortBy?: PokemonSortFieldValue
	/** Dirección de ordenamiento secundario */
	thenSortDirection?: SortDirectionValue

	// Paginación
	/** Número de elementos a saltar (para paginación) */
	skip?: number
	/** Número de elementos a tomar (máximo recomendado: 100) */
	take?: number

	// Soporte legacy
	/** @deprecated Usar pokedexNumber en su lugar */
	speciesId?: number
	/** @deprecated Usar pokeballId en su lugar */
	ballId?: number
	/** Filtro legacy de juego de origen */
	originGame?: number
	/** Filtro legacy de tipo Tera */
	teraType?: number
	/** IDs de tags que el Pokémon no debe tener */
	excludedTagIds?: number[]
}

export interface UpdatePokemonDto {
	/** Marcar o desmarcar como favorito (null = sin cambio) */
	favorite?: boolean
	/** Notas personales sobre el Pokémon (null = sin cambio, string.Empty = limpiar) */
	notes?: string
}

// ===================================
// INTERFACES DE RESPUESTA DE DATOS
// ===================================

export interface PokemonListItemDto {
	/** ID único del Pokémon en la base de datos */
	id: number
	/** ID de especie (ej: 1 = Bulbasaur, 25 = Pikachu) */
	speciesId: number

	speciesName: string
	/** ID de forma (ej: 0 = Meowth Normal, 1 = Meowth de Alola, 2 = Meowth de Galar) */
	form: number
	/** Nombre de la forma (ej: "Galar", "Alola", "Mega", "Crowned", etc.) */
	formName?: string
	/** Nickname del Pokémon (null si usa el nombre de la especie) */
	nickname?: string
	/** Nivel del Pokémon (1-100) */
	level: number
	/** Si es shiny */
	isShiny: boolean
	/** Si está marcado como favorito */
	favorite: boolean
	/** Si es un huevo */
	isEgg: boolean
	/** ID de la Pokébola en la que fue capturado */
	ballId: number
	/** ID de objeto equipado */
	heldItemId: number
	/** Género del Pokémon */
	gender: number
	/** Tipo Tera (Gen 9), null si no aplica */
	teraType?: number
	/** Clave para identificar el sprite (especie+forma+shiny) */
	spriteKey: string
	/** Generación donde la especie fue introducida por primera vez (campo calculado) */
	originGeneration: number
	/** Generación donde este Pokémon específico fue capturado/obtenido (campo calculado) */
	capturedGeneration: number
	/** Si este Pokémon puede Gigantamax (solo archivos Gen 8+) */
	canGigantamax: boolean
	/** Si este Pokémon tiene una Mega Piedra equipada (afecta la visualización de la forma) */
	hasMegaStone: boolean
	/** Tags asignados a este Pokémon */
	tags?: TagDto[]

	// --- Enriched fields from backend Pokédex cache ---
	/** Primary type name (e.g., "fire", "water") */
	type1?: string
	/** Secondary type name, null if single-type */
	type2?: string
	/** Ball name (e.g., "Poké Ball", "Beast Ball") */
	ballName?: string
	/** Direct URL to ball sprite image */
	ballSpriteUrl?: string
	/** Sprite URLs for different display modes */
	sprites?: PokemonSpritesDto
	/** True if this Pokémon occupies a slot in any box */
	isBoxed?: boolean
}

export interface PokemonSpritesDto {
	default: string
	shiny: string
	official: string
	officialShiny: string
	home: string
	homeShiny: string
	showdown: string
	showdownShiny: string
	github: string
	githubShiny: string
}

export interface AdvancedPokemonListResponse {
	items: PokemonListItemDto[]
	total: number
	stats: {
		queryComplexity: number
		executionTimeMs: number
		filterCount: number
		sortFields: string[]
	}
}

export interface PokemonBoxSummaryDto {
	id: number
	name: string
	sortOrder: number
	pokemonCount: number
}

export interface PokemonBoxSlotDto {
	slotIndex: number
	pokemon: PokemonListItemDto
}

export interface PokemonBoxDetailDto {
	id: number
	name: string
	sortOrder: number
	pokemonCount: number
	slots: PokemonBoxSlotDto[]
}

export interface CreatePokemonBoxRequest {
	name: string
}

export interface UpdatePokemonBoxRequest {
	name?: string | null
	sortOrder?: number | null
}

export interface MovePokemonBoxSlotRequest {
	pokemonId: number
	targetBoxId: number
	targetSlotIndex: number
}

// ===================================
// CONSTANTES ÚTILES
// ===================================

export const API_CONSTANTS = {
	DEFAULT_PAGE_SIZE: 50,
	MAX_PAGE_SIZE: 500,
	MAX_LEVEL: 100,
	MIN_LEVEL: 1,
	SUPPORTED_FILE_EXTENSIONS: [
		'.pk1',
		'.pk2',
		'.pk3',
		'.pk4',
		'.pk5',
		'.pk6',
		'.pk7',
		'.pk8',
		'.pk9',
		'.pb7',
		'.pb8',
		'.ek1',
		'.ek2',
		'.ek3',
		'.ek4',
		'.ek5',
		'.ek6',
		'.ek7',
		'.ek8',
		'.ek9',
		'.ekx',
	] as const,
	POKEMON_GENDERS: {
		UNKNOWN: 0,
		MALE: 1,
		FEMALE: 2,
	} as const,
} as const

// ===================================
// TAG SYSTEM INTERFACES
// ===================================

/**
 * Categoría de tag
 */
export type TagCategory = 'Uncategorized' | 'Run' | 'Team' | 'Collection' | 'Personal' | 'Utility'

/**
 * Tag DTO para el sistema de etiquetas de Pokemon
 */
export interface TagDto {
	id: number
	name: string
	imagePath?: string | null
	pokemonCount: number
	category: TagCategory
	colorHex?: string | null
	sortOrder: number
	description?: string | null
}

/**
 * Per-tag match counts for the current search/filters.
 * `total` is the number of Pokémon matching the non-tag filters (search,
 * generation, shiny, ball...) ignoring tag selection; `counts` maps a tag id
 * to how many of those matches carry that tag.
 */
export interface TagFacetCountsDto {
	total: number
	counts: Record<number, number>
}

/**
 * DTO para crear un nuevo tag
 */
export interface CreateTagDto {
	name: string
	category?: TagCategory
	colorHex?: string | null
	description?: string | null
}

/**
 * DTO para actualizar un tag existente
 */
export interface UpdateTagDto {
	name: string
	category?: TagCategory
	colorHex?: string | null
	sortOrder?: number
	description?: string | null
}

/**
 * DTO para asignar tags a un Pokemon
 */
export interface PokemonTagAssignmentDto {
	pokemonId: number
	tagIds: number[]
}

/**
 * Request para operaciones bulk de tags
 */
export interface BulkTagRequest {
	pokemonIds: number[]
	addTagIds?: number[]
	removeTagIds?: number[]
	replaceTagIds?: number[]
	includeDuplicateFiles?: boolean
}

/**
 * Resultado de operaciones bulk de tags
 */
export interface BulkTagResult {
	affectedPokemon: number
	tagsAdded: number
	tagsRemoved: number
}
