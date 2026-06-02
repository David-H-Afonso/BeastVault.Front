import type {
	CreatePokemonBoxRequest,
	MovePokemonBoxSlotRequest,
	PokemonBoxDetailDto,
	PokemonBoxSummaryDto,
	UpdatePokemonBoxRequest,
} from '@/models/api/types'
import { customFetch } from '@/utils'
import { environment } from '@/environments'

export async function getPokemonBoxes(): Promise<PokemonBoxSummaryDto[]> {
	return customFetch<PokemonBoxSummaryDto[]>(`${environment.baseUrl}/boxes`, {
		headers: { Accept: 'application/json' },
	})
}

export async function getPokemonBox(id: number): Promise<PokemonBoxDetailDto> {
	return customFetch<PokemonBoxDetailDto>(`${environment.baseUrl}/boxes/${id}`, {
		headers: { Accept: 'application/json' },
	})
}

export async function createPokemonBox(
	request: CreatePokemonBoxRequest
): Promise<PokemonBoxSummaryDto> {
	return customFetch<PokemonBoxSummaryDto>(`${environment.baseUrl}/boxes`, {
		method: 'POST',
		body: JSON.stringify(request),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
	})
}

export async function updatePokemonBox(
	id: number,
	request: UpdatePokemonBoxRequest
): Promise<void> {
	await customFetch(`${environment.baseUrl}/boxes/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(request),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
	})
}

export async function deletePokemonBox(id: number): Promise<void> {
	await customFetch(`${environment.baseUrl}/boxes/${id}`, {
		method: 'DELETE',
		headers: { Accept: 'application/json' },
	})
}

export async function movePokemonToBoxSlot(
	request: MovePokemonBoxSlotRequest
): Promise<PokemonBoxDetailDto> {
	return customFetch<PokemonBoxDetailDto>(`${environment.baseUrl}/boxes/move`, {
		method: 'POST',
		body: JSON.stringify(request),
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
	})
}

export async function clearPokemonBoxSlot(boxId: number, slotIndex: number): Promise<void> {
	await customFetch(`${environment.baseUrl}/boxes/${boxId}/slots/${slotIndex}`, {
		method: 'DELETE',
		headers: { Accept: 'application/json' },
	})
}

export async function clearPokemonBox(boxId: number): Promise<void> {
	await customFetch(`${environment.baseUrl}/boxes/${boxId}/slots`, {
		method: 'DELETE',
		headers: { Accept: 'application/json' },
	})
}
