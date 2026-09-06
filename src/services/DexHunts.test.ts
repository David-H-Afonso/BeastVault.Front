import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customFetchMock, getAuthTokenMock } = vi.hoisted(() => ({
	customFetchMock: vi.fn(),
	getAuthTokenMock: vi.fn(),
}))

vi.mock('@/utils', () => ({ customFetch: customFetchMock }))
vi.mock('@/utils/authToken', () => ({ getAuthToken: getAuthTokenMock }))

import {
	addDexHuntItem,
	createDexHunt,
	downloadDexHunt,
	getDexHunt,
	importDexHunt,
	reorderDexHuntItems,
	updateDexHuntItem,
	type DexHuntExport,
} from './DexHunts'

describe('DexHunts service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.unstubAllGlobals()
		customFetchMock.mockResolvedValue({})
	})

	it('sends creation and target mutations as typed JSON objects', async () => {
		await createDexHunt({ name: 'Paldea gaps', gameId: 50, description: null })
		await addDexHuntItem(7, { speciesId: 25, priority: 2, notes: 'Trade' })
		await updateDexHuntItem(7, 9, { isCaught: true, priority: 2, notes: 'Caught' })

		expect(customFetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/dex-hunts$/), expect.objectContaining({ method: 'POST', body: { name: 'Paldea gaps', gameId: 50, description: null } }))
		expect(customFetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/dex-hunts\/7\/items$/), expect.objectContaining({ method: 'POST', body: { speciesId: 25, priority: 2, notes: 'Trade' } }))
		expect(customFetchMock).toHaveBeenNthCalledWith(3, expect.stringMatching(/\/dex-hunts\/7\/items\/9$/), expect.objectContaining({ method: 'PATCH', body: { isCaught: true, priority: 2, notes: 'Caught' } }))
	})

	it('passes every filter and atomic order to the API', async () => {
		await getDexHunt(4, { search: 'pika', status: 'open', priority: 2, generation: 1, type: 'electric', sortBy: 'priority', descending: true })
		await reorderDexHuntItems(4, [8, 3, 1])

		expect(customFetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/dex-hunts\/4$/), {
			params: { search: 'pika', status: 'open', priority: 2, generation: 1, type: 'electric', sortBy: 'priority', descending: true },
		})
		expect(customFetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/dex-hunts\/4\/items\/reorder$/), { method: 'PUT', body: { itemIds: [8, 3, 1] } })
	})

	it('imports the portable schema without manual serialization', async () => {
		const payload: DexHuntExport = {
			schemaVersion: 1,
			list: { name: 'Trade list', game: { id: 51, name: 'Violet' }, items: [{ speciesId: 25, priority: 1, caught: false }] },
		}
		await importDexHunt(payload)
		expect(customFetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/dex-hunts\/import$/), { method: 'POST', body: payload })
	})

	it('downloads exports with authentication and server filename', async () => {
		getAuthTokenMock.mockReturnValue('hunt-token')
		const fetchMock = vi.fn().mockResolvedValue(new Response(new Blob(['{}']), {
			status: 200,
			headers: { 'Content-Disposition': "attachment; filename*=UTF-8''dex-hunt-paldea.json" },
		}))
		vi.stubGlobal('fetch', fetchMock)

		const result = await downloadDexHunt(12, 'fallback')
		expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/dex-hunts\/12\/export$/), { headers: { Authorization: 'Bearer hunt-token' } })
		expect(result.filename).toBe('dex-hunt-paldea.json')
		expect(result.blob.size).toBeGreaterThan(0)
	})
})
