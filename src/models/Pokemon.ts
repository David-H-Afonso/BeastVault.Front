// Use the official API types
export type { PokemonListItemDto } from './api/types'

export interface StatsDto {
	ivHp: number
	ivAtk: number
	ivDef: number
	ivSpa: number
	ivSpd: number
	ivSpe: number
	evHp: number
	evAtk: number
	evDef: number
	evSpa: number
	evSpd: number
	evSpe: number
	hyperTrainedHp: boolean
	hyperTrainedAtk: boolean
	hyperTrainedDef: boolean
	hyperTrainedSpa: boolean
	hyperTrainedSpd: boolean
	hyperTrainedSpe: boolean
	statHp: number
	statAtk: number
	statDef: number
	statSpa: number
	statSpd: number
	statSpe: number
	statHpCurrent: number
}

export interface MoveDto {
	slot: number
	moveId: number
	moveName: string
	ppUps: number
	currentPp: number
}

export interface RelearnMoveDto {
	slot: number
	moveId: number
	moveName: string
}

export interface PokemonDetailDto {
	id: number
	speciesId: number
	speciesName: string
	nickname?: string | null
	otName?: string | null
	tid: number
	sid: number
	level: number
	isShiny: boolean
	nature: number
	natureName: string
	abilityId: number
	abilityName: string
	ballId: number
	ballName: string
	teraType?: number | null
	teraTypeName?: string | null
	type1: string
	type2?: string | null
	originGame: number
	language?: string | null
	languageName: string
	metDate?: string | null
	metLocation?: string | null
	spriteKey?: string | null
	favorite: boolean
	notes?: string | null
	encryptionConstant: number
	personalityId: number
	experience: number
	currentFriendship: number
	form: number
	formName?: string | null
	formArgument: number
	isEgg: boolean
	fatefulEncounter: boolean
	gender: number
	genderName: string
	otGender: number
	otGenderName: string
	otLanguage?: string | null
	otLanguageName: string
	heldItemId: number
	heldItemName: string
	heightScalar: number
	weightScalar: number
	scale: number
	pokerusState: number
	pokerusDays: number
	pokerusStrain: number
	contestCool: number
	contestBeauty: number
	contestCute: number
	contestSmart: number
	contestTough: number
	contestSheen: number
	stats: StatsDto
	moves?: MoveDto[] | null
	relearnMoves?: RelearnMoveDto[] | null
}

export interface PokemonListItemDtoPagedResult {
	items?: import('./api/types').PokemonListItemDto[] | null
	total: number
}

// Metadata interfaces for dynamic filter options
export interface PokemonType {
	id: number
	name: string
}

export interface PokemonBall {
	id: number
	name: string
}

export interface PokemonNature {
	id: number
	name: string
}

export interface PokemonMetadata {
	types: PokemonType[]
	pokeballs: PokemonBall[]
	natures: PokemonNature[]
	generations: number[]
	genders: { id: number; name: string }[]
	sortFields: { name: string; value: number }[]
	typeFilterModes: { name: string; value: number }[]
	defaultPageSize: number
	maxPageSize: number
}

// Type definitions for filter values
export const TypeFilterMode = {
	HasAnyType: 0,
	HasAllTypes: 1,
	ExactTypes: 2,
} as const

export type TypeFilterMode = (typeof TypeFilterMode)[keyof typeof TypeFilterMode]

export const SortBy = {
	Id: 0,
	PokedexNumber: 1,
	SpeciesName: 2,
	Nickname: 3,
	Level: 4,
	Nature: 5,
	OriginGeneration: 6,
	CapturedGeneration: 7,
	Pokeball: 8,
	Gender: 9,
	IsShiny: 10,
	Form: 11,
	CreatedAt: 12,
	Favorite: 13,
	PrimaryType: 14,
	SecondaryType: 15,
	TeraType: 16,
} as const

export type SortBy = (typeof SortBy)[keyof typeof SortBy]

/**
 * Maps frontend SortBy values to backend PokemonSortField strings
 */
export function mapSortByToBackend(sortBy: SortBy): string {
	switch (sortBy) {
		case SortBy.Id:
			return 'Id'
		case SortBy.PokedexNumber:
			return 'PokedexNumber'
		case SortBy.SpeciesName:
			return 'SpeciesName'
		case SortBy.Nickname:
			return 'Nickname'
		case SortBy.Level:
			return 'Level'
		case SortBy.Nature:
			return 'Nature'
		case SortBy.CreatedAt:
			return 'CreatedAt'
		case SortBy.Gender:
			return 'Gender'
		case SortBy.IsShiny:
			return 'IsShiny'
		case SortBy.OriginGeneration:
			return 'OriginGeneration'
		case SortBy.CapturedGeneration:
			return 'CapturedGeneration'
		case SortBy.Pokeball:
			return 'Pokeball'
		case SortBy.Form:
			return 'Form'
		case SortBy.Favorite:
			return 'Favorite'
		case SortBy.PrimaryType:
			return 'PrimaryType'
		case SortBy.SecondaryType:
			return 'SecondaryType'
		case SortBy.TeraType:
			return 'TeraType'
		default:
			return 'Id' // Default to Id sorting
	}
}

export const SortDirection = {
	Ascending: 0,
	Descending: 1,
} as const

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection]

export interface PokemonListFilterDto {
	// Search filters
	Search?: string
	PokedexNumber?: number
	SpeciesName?: string
	Nickname?: string
	IsShiny?: boolean

	// Pokemon characteristics
	Form?: number
	Gender?: number
	OriginGeneration?: number
	CapturedGeneration?: number
	PokeballId?: number
	HeldItemId?: number

	// Type filtering
	PrimaryType?: number
	SecondaryType?: number
	Types?: number[] // Array of type IDs for multi-type filtering
	TypeFilterMode?: TypeFilterMode
	EnforceTypeOrder?: boolean

	// Level range
	MinLevel?: number
	MaxLevel?: number

	// Sorting
	SortBy?: SortBy
	SortDirection?: SortDirection
	ThenSortBy?: SortBy
	ThenSortDirection?: SortDirection

	// Pagination
	Skip: number
	Take: number

	// Additional filters
	SpeciesId?: number
	BallId?: number
	OriginGame?: number
	TeraType?: number
	Favorite?: boolean

	/** IDs de tags que el Pokémon DEBE tener (todos los tags especificados) */
	tagIds?: number[]
	/** Nombres de tags que el Pokémon DEBE tener (todos los tags especificados) */
	tagNames?: string[]
	/** IDs de tags donde el Pokémon PUEDE tener cualquiera de ellos */
	anyTagIds?: number[]
	/** Nombres de tags donde el Pokémon PUEDE tener cualquiera de ellos */
	anyTagNames?: string[]
	/** Filtrar Pokémon que no tienen ningún tag */
	hasNoTags?: boolean
}

// TODO: WIP
export interface UpdatePokemonDto {
	favorite?: boolean | null
	notes?: string | null
}
