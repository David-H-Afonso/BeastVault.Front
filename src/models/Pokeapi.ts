// Sprites
export interface PokeApiSprites {
	front_default?: string
	front_shiny?: string
	back_default?: string
	back_shiny?: string
	front_female?: string | null
	front_shiny_female?: string | null
	back_female?: string | null
	back_shiny_female?: string | null
	other?: {
		'official-artwork'?: {
			front_default?: string
			front_shiny?: string
		}
		'home'?: {
			front_default?: string
			front_shiny?: string
			front_female?: string | null
			front_shiny_female?: string | null
		}
		'dream_world'?: {
			front_default?: string
			front_female?: string | null
		}
		'showdown'?: {
			front_default?: string
			front_shiny?: string
			back_default?: string
			back_shiny?: string
			front_female?: string | null
			front_shiny_female?: string | null
			back_female?: string | null
			back_shiny_female?: string | null
		}
		[key: string]: any
	}
	versions?: Record<string, any>
	[key: string]: any
}

// Abilities
export interface PokeApiAbilityRef {
	name: string
	url: string
}
export interface PokeApiAbility {
	ability: PokeApiAbilityRef
	is_hidden: boolean
	slot: number
}

// Forms
export interface PokeApiForm {
	name: string
	url: string
}

// Game Indices
export interface PokeApiGameIndex {
	game_index: number
	version: PokeApiNamedAPIResource
}

// Held Items
export interface PokeApiHeldItem {
	item: PokeApiNamedAPIResource
	version_details: Array<{
		rarity: number
		version: PokeApiNamedAPIResource
	}>
}

// Moves
export interface PokeApiMove {
	move: PokeApiNamedAPIResource
	version_group_details: Array<{
		level_learned_at: number
		move_learn_method: PokeApiNamedAPIResource
		order: number | null
		version_group: PokeApiNamedAPIResource
	}>
}

// Stats
export interface PokeApiStat {
	base_stat: number
	effort: number
	stat: PokeApiNamedAPIResource
}

// Types
export interface PokeApiType {
	slot: number
	type: PokeApiNamedAPIResource
}

// Cries
export interface PokeApiCries {
	latest?: string
	legacy?: string
}

// Named API Resource
export interface PokeApiNamedAPIResource {
	name: string
	url: string
}

// Main Pokémon DTO
export interface PokeApiPokemon {
	id: number
	name: string
	base_experience: number
	height: number
	is_default: boolean
	order: number
	weight: number
	abilities: PokeApiAbility[]
	cries: PokeApiCries
	forms: PokeApiForm[]
	game_indices: PokeApiGameIndex[]
	held_items: PokeApiHeldItem[]
	location_area_encounters: string
	moves: PokeApiMove[]
	past_abilities?: any[]
	past_types?: any[]
	species: PokeApiNamedAPIResource
	sprites: PokeApiSprites
	stats: PokeApiStat[]
	types: PokeApiType[]
}
