import type { LayoutState, LayoutType } from '@/models/store/Layout'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Load initial state from localStorage if available
const loadInitialState = (): LayoutState => {
	try {
		const savedLayout = localStorage.getItem('layoutType')

		let layoutType: LayoutType = 'header' // Default to header layout

		if (savedLayout) {
			const validLayouts: LayoutType[] = ['empty', 'header']
			if (validLayouts.includes(savedLayout as LayoutType)) {
				layoutType = savedLayout as LayoutType
			}
		}

		return { layoutType }
	} catch (error) {
		console.warn('Failed to load layout state from localStorage:', error)
	}
	return {
		layoutType: 'header',
	}
}

const initialState: LayoutState = loadInitialState()

const layoutSlice = createSlice({
	name: 'layout',
	initialState,
	reducers: {
		setLayoutType: (state, action: PayloadAction<LayoutType>) => {
			state.layoutType = action.payload
			// Persist to localStorage
			try {
				localStorage.setItem('layoutType', action.payload)
			} catch (error) {
				console.warn('Failed to save layout type to localStorage:', error)
			}
		},
	},
})

export const { setLayoutType } = layoutSlice.actions
export default layoutSlice.reducer

// Types
export type { LayoutState }
