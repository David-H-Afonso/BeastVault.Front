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
	ppUps: number
	currentPp: number
}

export interface RelearnMoveDto {
	slot: number
	moveId: number
}

export interface PokemonDetailDto {
	id: number
	speciesId: number
	nickname?: string | null
	otName?: string | null
	tid: number
	sid: number
	level: number
	isShiny: boolean
	nature: number
	abilityId: number
	ballId: number
	teraType?: number | null
	originGame: number
	language?: string | null
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
	formArgument: number
	isEgg: boolean
	fatefulEncounter: boolean
	gender: number
	otGender: number
	otLanguage?: string | null
	heldItemId: number
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

export interface PokemonListItemDto {
	id: number
	speciesId: number
	nickname?: string | null
	level: number
	isShiny: boolean
	ballId: number
	teraType?: number | null
	spriteKey?: string | null
	form: number
}

export interface PokemonListItemDtoPagedResult {
	items?: PokemonListItemDto[] | null
	total: number
}

export interface PokemonListFilterDto {
	Search?: string
	SpeciesId?: number
	IsShiny?: boolean
	BallId?: number
	OriginGame?: number
	TeraType?: number
	Skip: number
	Take: number
}

// TODO: WIP
export interface UpdatePokemonDto {
	favorite?: boolean | null
	notes?: string | null
}
