// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DexHuntFormDialog } from './DexHuntFormDialog'

afterEach(cleanup)

const games = [
	{ id: 50, name: 'Scarlet', generation: 9 },
	{ id: 51, name: 'Violet', generation: 9 },
]

describe('DexHuntFormDialog', () => {
	it('requires a name and submits the selected game and optional description', () => {
		const onSubmit = vi.fn()
		render(<DexHuntFormDialog games={games} busy={false} error={null} onClose={vi.fn()} onSubmit={onSubmit} />)

		expect(screen.getByRole('dialog', { name: 'Create a Dex Hunt' })).toBeTruthy()
		fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Paldea gaps' } })
		fireEvent.change(screen.getByLabelText('Game'), { target: { value: '51' } })
		fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Trades and exclusives' } })
		fireEvent.click(screen.getByRole('button', { name: 'Create hunt' }))

		expect(onSubmit).toHaveBeenCalledWith({ name: 'Paldea gaps', gameId: 51, description: 'Trades and exclusives' })
	})

	it('loads existing values when editing', () => {
		render(<DexHuntFormDialog
			games={games}
			busy={false}
			error={null}
			onClose={vi.fn()}
			onSubmit={vi.fn()}
			list={{ id: 3, name: 'Living dex', gameId: 50, gameName: 'Scarlet', description: 'Missing species', sortOrder: 0, totalCount: 2, caughtCount: 1, createdAt: '', updatedAt: '' }}
		/>)

		expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Living dex')
		expect((screen.getByLabelText('Game') as HTMLSelectElement).value).toBe('50')
	})
})
