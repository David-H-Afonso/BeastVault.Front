import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BulkTagSelector } from './BulkTagSelector'
import type { TagDto } from '@/models/api/types'

afterEach(cleanup)

const makeTag = (id: number, name: string): TagDto => ({
	id,
	name,
	pokemonCount: 0,
	category: 'Uncategorized',
	sortOrder: 0,
})

function renderSelector(overrides: Partial<Parameters<typeof BulkTagSelector>[0]> = {}) {
	const props = {
		tags: [makeTag(1, 'Existing')],
		loading: false,
		onSubmit: vi.fn(),
		onCancel: vi.fn(),
		actionLabel: 'Add',
		onCreateTag: vi.fn(),
		allowCreate: true,
		...overrides,
	}
	render(<BulkTagSelector {...props} />)
	return props
}

describe('BulkTagSelector', () => {
	it('creates a new tag inline and auto-selects it for submission', async () => {
		const created = makeTag(99, 'Freshly Made')
		const onCreateTag = vi.fn().mockResolvedValue(created)
		const onSubmit = vi.fn()
		renderSelector({ onCreateTag, onSubmit })

		fireEvent.change(screen.getByLabelText('New tag name'), {
			target: { value: 'Freshly Made' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Create' }))

		await waitFor(() => expect(onCreateTag).toHaveBeenCalledWith('Freshly Made'))

		// Once created, the tag is selected so the submit button targets it,
		// even before the parent refreshes the visible tag list.
		const submit = await screen.findByRole('button', { name: /Add 1 tag/ })
		fireEvent.click(submit)
		expect(onSubmit).toHaveBeenCalledWith([99])
	})

	it('creates a tag when pressing Enter in the name field', async () => {
		const created = makeTag(7, 'ViaEnter')
		const onCreateTag = vi.fn().mockResolvedValue(created)
		renderSelector({ onCreateTag })

		const input = screen.getByLabelText('New tag name')
		fireEvent.change(input, { target: { value: 'ViaEnter' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		await waitFor(() => expect(onCreateTag).toHaveBeenCalledWith('ViaEnter'))
	})

	it('hides the create row when creation is not allowed (remove action)', () => {
		renderSelector({ allowCreate: false, actionLabel: 'Remove' })
		expect(screen.queryByLabelText('New tag name')).toBeNull()
	})

	it('shows an error when tag creation fails', async () => {
		const onCreateTag = vi.fn().mockRejectedValue(new Error('conflict'))
		renderSelector({ onCreateTag, tags: [] })

		fireEvent.change(screen.getByLabelText('New tag name'), { target: { value: 'Dup' } })
		fireEvent.click(screen.getByRole('button', { name: 'Create' }))

		const error = await screen.findByText(/Could not create tag/)
		expect(error).toBeTruthy()
	})

	it('does not call onCreateTag for a blank name', () => {
		const onCreateTag = vi.fn()
		renderSelector({ onCreateTag })

		fireEvent.change(screen.getByLabelText('New tag name'), { target: { value: '   ' } })
		fireEvent.click(screen.getByRole('button', { name: 'Create' }))
		expect(onCreateTag).not.toHaveBeenCalled()
	})
})
