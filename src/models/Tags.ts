// Tag Category type
export type TagCategory = 'Uncategorized' | 'Run' | 'Team' | 'Collection' | 'Personal' | 'Utility'

// Pokemon Tag Models
export interface TagDto {
	id: number
	name: string
	imagePath?: string
	pokemonCount: number
	category: TagCategory
	colorHex?: string
	sortOrder: number
	description?: string
}

export interface PokemonTagAssignmentDto {
	pokemonId: number
	tagIds: number[]
}

export interface CreateTagDto {
	name: string
	category?: TagCategory
	colorHex?: string
	description?: string
}

export interface UpdateTagDto {
	name: string
	category?: TagCategory
	colorHex?: string
	sortOrder?: number
	description?: string
}

export interface BulkTagRequest {
	pokemonIds: number[]
	addTagIds?: number[]
	removeTagIds?: number[]
	replaceTagIds?: number[]
	includeDuplicateFiles?: boolean
}

export interface BulkTagResult {
	affectedPokemon: number
	tagsAdded: number
	tagsRemoved: number
}

// Extended Pokemon model to include tags
export interface PokemonWithTagsDto {
	id: number
	nickname?: string
	speciesName: string
	speciesId: number
	pokedexNumber: number
	level: number
	isShiny: boolean
	isEgg: boolean
	ballId: number
	heldItemId?: number
	abilityId: number
	natureId: number
	genderId: number
	originGame: string
	teraTypeId?: number
	markings: number
	ribbonCount: number
	shinyLeaves: number
	filePath: string
	fileName: string
	tags: TagDto[] // This will be included in the Pokemon response
}

// Grouped Pokemon by tags for display
export interface GroupedPokemon {
	tagName: string
	tagId?: number
	pokemon: PokemonWithTagsDto[]
}
