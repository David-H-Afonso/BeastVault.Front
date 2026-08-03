import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { TcgCardDto, TcgCardPageDto, TcgSetDto } from '@/services/TcgCollection'

const {
	addTcgCollectionEntry,
	addTcgCollectionBulk,
	cacheAllTcgAssets,
	cacheTcgSetAssets,
	deleteTcgCollectionCards,
	deleteTcgCollectionEntry,
	getTcgCard,
	getTcgCollection,
	getTcgCollectionStats,
	getTcgSetCards,
	getTcgSets,
	refreshTcgCard,
	refreshTcgCards,
	resolveTcgCardsBulk,
	searchTcgCards,
	updateTcgCollectionEntry,
} = vi.hoisted(() => ({
	addTcgCollectionEntry: vi.fn(),
	addTcgCollectionBulk: vi.fn(),
	cacheAllTcgAssets: vi.fn(),
	cacheTcgSetAssets: vi.fn(),
	deleteTcgCollectionCards: vi.fn(),
	deleteTcgCollectionEntry: vi.fn(),
	getTcgCard: vi.fn(),
	getTcgCollection: vi.fn(),
	getTcgCollectionStats: vi.fn(),
	getTcgSetCards: vi.fn(),
	getTcgSets: vi.fn(),
	refreshTcgCard: vi.fn(),
	refreshTcgCards: vi.fn(),
	resolveTcgCardsBulk: vi.fn(),
	searchTcgCards: vi.fn(),
	updateTcgCollectionEntry: vi.fn(),
}))

vi.mock('@/services/TcgCollection', () => ({
	addTcgCollectionEntry,
	addTcgCollectionBulk,
	cacheAllTcgAssets,
	cacheTcgSetAssets,
	deleteTcgCollectionCards,
	deleteTcgCollectionEntry,
	getTcgCard,
	getTcgCollection,
	getTcgCollectionStats,
	getTcgSetCards,
	getTcgSets,
	refreshTcgCard,
	refreshTcgCards,
	resolveTcgCardsBulk,
	searchTcgCards,
	updateTcgCollectionEntry,
}))

import { CardsPage } from './CardsPage'

const set: TcgSetDto = {
	id: 1,
	providerSetId: 'sv08',
	name: 'Test Set',
	nameEn: 'Test Set',
	seriesId: null,
	series: null,
	officialCode: 'TST',
	printedTotal: 1,
	total: 1,
	releaseDate: null,
	symbolUrl: null,
	logoUrl: null,
	ownedUniqueCards: 0,
	ownedCopies: 0,
	completionPercent: 0,
}

const card: TcgCardDto = {
	id: 42,
	providerCardId: 'sv08-001',
	name: 'Testmon',
	nameEn: 'Testmon',
	number: '001',
	rarity: 'Common',
	artist: 'Test artist',
	imageSmall: null,
	imageLarge: null,
	nationalPokedexNumbers: [],
	variants: ['normal'],
	setId: 1,
	setProviderId: 'sv08',
	setName: 'Test Set',
	collectorReference: 'TST 001',
	prices: {
		eur: null,
		usd: null,
		updatedAt: null,
		cardmarketUrl: null,
		tcgplayerUrl: null,
		variantEur: {},
		variantUsd: {},
	},
	owned: [],
	totalOwned: 0,
	detailedAt: null,
	priceCheckedAt: null,
	lastRefreshError: null,
}

const cardPage: TcgCardPageDto = {
	items: [card],
	page: 1,
	pageSize: 30,
	hasMore: false,
	totalCount: 1,
}

beforeEach(() => {
	vi.clearAllMocks()
	getTcgSets.mockResolvedValue([set])
	searchTcgCards.mockResolvedValue(cardPage)
	getTcgCard.mockResolvedValue(card)
	getTcgCollection.mockResolvedValue({ items: [], page: 1, pageSize: 60, totalCount: 0 })
	getTcgCollectionStats.mockResolvedValue({
		uniqueCards: 0,
		totalCopies: 0,
		totalValueEur: 0,
		totalValueUsd: 0,
		national: { name: 'National', owned: 0, total: 1025, completionPercent: 0, missing: [] },
		regions: [],
		sets: [],
		topCards: [],
	})
	getTcgSetCards.mockResolvedValue({ ...cardPage, pageSize: 60 })
	addTcgCollectionEntry.mockResolvedValue({})
	addTcgCollectionBulk.mockResolvedValue({ items: [], requested: 0, added: 0, failed: 0 })
	cacheAllTcgAssets.mockResolvedValue({})
	cacheTcgSetAssets.mockResolvedValue({})
	deleteTcgCollectionCards.mockResolvedValue(undefined)
	deleteTcgCollectionEntry.mockResolvedValue(undefined)
	refreshTcgCard.mockResolvedValue({ success: true, card })
	refreshTcgCards.mockResolvedValue({ items: [], requested: 0, processed: 0, truncated: false })
	resolveTcgCardsBulk.mockResolvedValue({ items: [], requested: 0, resolved: 0, failed: 0, truncated: false })
	updateTcgCollectionEntry.mockResolvedValue({})
})

afterEach(cleanup)

function renderSearch() {
	return render(
		<MemoryRouter initialEntries={['/cards/search']}>
			<Routes>
				<Route path='/cards/:view' element={<CardsPage />} />
			</Routes>
		</MemoryRouter>
	)
}

function renderBulk() {
	return render(
		<MemoryRouter initialEntries={['/cards/bulk']}>
			<Routes>
				<Route path='/cards/:view' element={<CardsPage />} />
			</Routes>
		</MemoryRouter>
	)
}

describe('CardsPage', () => {
	it('does not reopen a card after its detail request resolves post-close', async () => {
		let resolveDetail!: (value: TcgCardDto) => void
		getTcgCard.mockReturnValueOnce(new Promise<TcgCardDto>((resolve) => { resolveDetail = resolve }))
		renderSearch()

		fireEvent.click(await screen.findByRole('button', { name: 'Open Testmon details' }))
		expect(screen.getByText('TST 001')).toBeTruthy()
		expect(screen.getByText('Cardmarket trend · normal')).toBeTruthy()
		expect(screen.getByText(/Reverse holo: foil background/)).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'Close card details' }))
		expect(screen.queryByRole('dialog', { name: 'Testmon' })).toBeNull()

		await act(async () => resolveDetail(card))
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Testmon' })).toBeNull())
	})

	it('resolves and adds selected bulk references in one request', async () => {
		resolveTcgCardsBulk.mockResolvedValue({
			items: [{ index: 0, input: 'TST 001 x2', quantity: 2, success: true, error: null, card }],
			requested: 1,
			resolved: 1,
			failed: 0,
			truncated: false,
		})
		addTcgCollectionBulk.mockResolvedValue({
			items: [{ index: 0, cardId: card.id, success: true, error: null, entry: null }],
			requested: 1,
			added: 1,
			failed: 0,
		})
		renderBulk()

		fireEvent.change(screen.getByLabelText('Collector references'), { target: { value: 'TST 001 x2' } })
		fireEvent.click(screen.getByRole('button', { name: 'Resolve references' }))
		await screen.findByText('Resolved prints')
		fireEvent.click(screen.getByRole('button', { name: 'Add 1 selected' }))

		await waitFor(() => expect(addTcgCollectionBulk).toHaveBeenCalledWith([{
			index: 0,
			cardId: 42,
			variant: 'normal',
			condition: 'NM',
			language: 'ES',
			quantity: 2,
			notes: null,
		}]))
		await screen.findByText('Added')
	})
})
