import type {
	TagDto,
	CreateTagDto,
	UpdateTagDto,
	PokemonTagAssignmentDto,
} from '../models/api/types'
import { customFetch } from '../utils'
import { environment } from '../environments'

/**
 * Obtener todas las tags
 * GET /tags
 */
export async function getAllTags(): Promise<TagDto[]> {
	return customFetch<TagDto[]>(`${environment.baseUrl}/tags`, {
		headers: {
			Accept: 'application/json',
		},
	})
}

/**
 * Crear una nueva tag
 * POST /tags
 */
export async function createTag(tagData: CreateTagDto): Promise<TagDto> {
	return customFetch<TagDto>(`${environment.baseUrl}/tags`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(tagData),
	})
}

/**
 * Actualizar una tag existente
 * PUT /tags/{id}
 */
export async function updateTag(id: number, tagData: UpdateTagDto): Promise<TagDto> {
	return customFetch<TagDto>(`${environment.baseUrl}/tags/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(tagData),
	})
}

/**
 * Eliminar una tag
 * DELETE /tags/{id}
 */
export async function deleteTag(id: number): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/tags/${id}`, {
		method: 'DELETE',
	})
}

/**
 * Subir imagen a una tag
 * POST /tags/{id}/image
 */
export async function uploadTagImage(id: number, imageFile: File): Promise<TagDto> {
	const formData = new FormData()
	formData.append('image', imageFile)

	return customFetch<TagDto>(`${environment.baseUrl}/tags/${id}/image`, {
		method: 'POST',
		body: formData,
	})
}

/**
 * Eliminar imagen de una tag
 * DELETE /tags/{id}/image
 */
export async function deleteTagImage(id: number): Promise<TagDto> {
	return customFetch<TagDto>(`${environment.baseUrl}/tags/${id}/image`, {
		method: 'DELETE',
	})
}

/**
 * Obtener tags de un Pokemon específico
 * GET /pokemon/{pokemonId}/tags
 */
export async function getPokemonTags(pokemonId: number): Promise<TagDto[]> {
	return customFetch<TagDto[]>(`${environment.baseUrl}/pokemon/${pokemonId}/tags`, {
		headers: {
			Accept: 'application/json',
		},
	})
}

/**
 * Asignar tags a un Pokemon (reemplaza todas las tags existentes)
 * PUT /pokemon/{pokemonId}/tags
 */
export async function assignTagsToPokemon(pokemonId: number, tagIds: number[]): Promise<void> {
	const data: PokemonTagAssignmentDto = {
		pokemonId,
		tagIds,
	}

	return customFetch<void>(`${environment.baseUrl}/pokemon/${pokemonId}/tags`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	})
}

/**
 * Remover todas las tags de un Pokemon
 * DELETE /pokemon/{pokemonId}/tags
 */
export async function removeAllTagsFromPokemon(pokemonId: number): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/pokemon/${pokemonId}/tags`, {
		method: 'DELETE',
	})
}

/**
 * Filtrar Pokemon por tags específicas (AND logic)
 * GET /pokemon/by-tags?tagIds=1,2,3
 */
export async function getPokemonByTags(tagIds: number[]): Promise<TagDto[]> {
	const tagIdsParam = tagIds.join(',')
	return customFetch<TagDto[]>(`${environment.baseUrl}/pokemon/by-tags?tagIds=${tagIdsParam}`, {
		headers: {
			Accept: 'application/json',
		},
	})
}

/**
 * Obtener Pokemon sin ninguna tag
 * GET /pokemon/untagged
 */
export async function getUntaggedPokemon(): Promise<TagDto[]> {
	return customFetch<TagDto[]>(`${environment.baseUrl}/pokemon/untagged`, {
		headers: {
			Accept: 'application/json',
		},
	})
}
