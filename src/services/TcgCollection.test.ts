import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customFetchMock } = vi.hoisted(() => ({ customFetchMock: vi.fn() }))

vi.mock('@/utils', () => ({ customFetch: customFetchMock }))

import {
	addTcgCollectionEntry,
	deleteTcgCollectionCard,
	deleteTcgCollectionCards,
	deleteTcgCollectionEntry,
	getTcgCollection,
	getTcgSetCards,
	searchTcgCards,
	refreshTcgCard,
	refreshTcgCards,
	updateTcgApiKey,
	updateTcgCollectionEntry,
} from './TcgCollection'

describe('TcgCollection service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		customFetchMock.mockResolvedValue({})
	})

	it('builds catalog and collection requests with typed query params', async () => {
		await getTcgSetCards('sv 03', 2, 48)
		await searchTcgCards({ query: 'Pikachu', setId: 9, number: '025', speciesId: 25 })
		await getTcgCollection({ query: 'Charizard', language: 'ES', page: 3 })

		expect(customFetchMock).toHaveBeenNthCalledWith(
			1,
			expect.stringMatching(/\/tcg\/sets\/sv%2003\/cards$/),
			expect.objectContaining({ params: { page: 2, pageSize: 48 } })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			2,
			expect.stringMatching(/\/tcg\/cards\/search$/),
			expect.objectContaining({
				params: { page: 1, pageSize: 30, query: 'Pikachu', setId: 9, number: '025', speciesId: 25 },
			})
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			3,
			expect.stringMatching(/\/tcg\/collection$/),
			expect.objectContaining({
				params: { page: 3, pageSize: 60, query: 'Charizard', language: 'ES' },
			})
		)
	})

	it('passes collection payloads as objects without manual serialization', async () => {
		const addRequest = {
			cardId: 42,
			variant: 'Holo',
			condition: 'NM',
			language: 'ES',
			quantity: 2,
			notes: 'Binder A',
		}

		await addTcgCollectionEntry(addRequest)
		await updateTcgCollectionEntry(7, { quantity: 3, notes: null })

		expect(customFetchMock).toHaveBeenNthCalledWith(
			1,
			expect.stringMatching(/\/tcg\/collection$/),
			expect.objectContaining({ method: 'POST', body: addRequest })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			2,
			expect.stringMatching(/\/tcg\/collection\/7$/),
			expect.objectContaining({ method: 'PATCH', body: { quantity: 3, notes: null } })
		)
		expect(customFetchMock.mock.calls[0][1].body).not.toEqual(expect.any(String))
	})

	it('uses the authenticated delete and API-key contracts', async () => {
		await deleteTcgCollectionEntry(19)
		await deleteTcgCollectionCard(42)
		await deleteTcgCollectionCards([42, 77])
		await updateTcgApiKey('tcg-secret')
		await updateTcgApiKey(null)

		expect(customFetchMock).toHaveBeenNthCalledWith(
			1,
			expect.stringMatching(/\/tcg\/collection\/19$/),
			expect.objectContaining({ method: 'DELETE' })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			2,
			expect.stringMatching(/\/tcg\/collection\/cards\/42$/),
			expect.objectContaining({ method: 'DELETE' })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			3,
			expect.stringMatching(/\/tcg\/collection\/cards$/),
			expect.objectContaining({ method: 'DELETE', body: { cardIds: [42, 77] } })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			4,
			expect.stringMatching(/\/auth\/preferences\/tcg-api-key$/),
			expect.objectContaining({ method: 'PATCH', body: { apiKey: 'tcg-secret' } })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			5,
			expect.stringMatching(/\/auth\/preferences\/tcg-api-key$/),
			expect.objectContaining({ method: 'PATCH', body: { apiKey: null } })
		)
	})

	it('uses bounded card refresh endpoints and typed response contracts', async () => {
		await refreshTcgCard(42)
		await refreshTcgCards({ cardIds: [42, 77], ownedOnly: false })
		await refreshTcgCards({ ownedOnly: true })

		expect(customFetchMock).toHaveBeenNthCalledWith(
			1,
			expect.stringMatching(/\/tcg\/cards\/42\/refresh$/),
			expect.objectContaining({ method: 'POST' })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			2,
			expect.stringMatching(/\/tcg\/cards\/refresh$/),
			expect.objectContaining({ method: 'POST', body: { cardIds: [42, 77], ownedOnly: false } })
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			3,
			expect.stringMatching(/\/tcg\/cards\/refresh$/),
			expect.objectContaining({ method: 'POST', body: { ownedOnly: true } })
		)
	})
})
