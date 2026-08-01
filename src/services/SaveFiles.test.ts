import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customFetchMock, getAuthTokenMock } = vi.hoisted(() => ({
	customFetchMock: vi.fn(),
	getAuthTokenMock: vi.fn(),
}))

vi.mock('@/utils', () => ({ customFetch: customFetchMock }))
vi.mock('@/utils/authToken', () => ({ getAuthToken: getAuthTokenMock }))

import {
	downloadSaveFile,
	importSavePokemon,
	updateSaveFile,
	uploadSaveFiles,
} from './SaveFiles'

describe('SaveFiles service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.unstubAllGlobals()
	})

	it('uploads every file under the multipart files field', async () => {
		customFetchMock.mockResolvedValue([])
		const files = [new File(['a'], 'ruby.sav'), new File(['b'], 'main')]

		await uploadSaveFiles(files)

		const [url, options] = customFetchMock.mock.calls[0]
		expect(url).toMatch(/\/saves$/)
		expect(options.method).toBe('POST')
		expect(options.body).toBeInstanceOf(FormData)
		expect(options.body.getAll('files')).toEqual(files)
		expect(options.headers).not.toHaveProperty('Content-Type')
	})

	it('sends typed JSON bodies for notes and selected previews', async () => {
		customFetchMock.mockResolvedValue(undefined)

		await updateSaveFile(4, { title: 'Emerald living dex', notes: 'Living dex run' })
		await importSavePokemon(4, [12, 18])

		expect(customFetchMock).toHaveBeenNthCalledWith(
			1,
			expect.stringMatching(/\/saves\/4$/),
			expect.objectContaining({
				method: 'PATCH',
				body: { title: 'Emerald living dex', notes: 'Living dex run' },
			})
		)
		expect(customFetchMock).toHaveBeenNthCalledWith(
			2,
			expect.stringMatching(/\/saves\/4\/import$/),
			expect.objectContaining({ method: 'POST', body: { previewIds: [12, 18] } })
		)
	})

	it('downloads with the auth token and uses the server filename', async () => {
		getAuthTokenMock.mockReturnValue('vault-token')
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(new Blob(['save']), {
				status: 200,
				headers: { 'Content-Disposition': "attachment; filename*=UTF-8''Pokemon%20Emerald.sav" },
			})
		)
		vi.stubGlobal('fetch', fetchMock)

		const result = await downloadSaveFile(7, 'fallback.sav')

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/\/saves\/7\/download$/),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer vault-token' }),
			})
		)
		expect(result.filename).toBe('Pokemon Emerald.sav')
		expect(result.blob.size).toBeGreaterThan(0)
	})
})
