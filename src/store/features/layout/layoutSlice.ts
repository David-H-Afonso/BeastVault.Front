import type { LayoutState, LayoutType } from '@/models/store/Layout'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const initialState: LayoutState = {
	layoutType: 'header', // Default to header layout
}

const layoutSlice = createSlice({
	name: 'layout',
	initialState,
	reducers: {
		setLayoutType: (state, action: PayloadAction<LayoutType>) => {
			state.layoutType = action.payload
		},
	},
})

export const { setLayoutType } = layoutSlice.actions
export default layoutSlice.reducer

// Types
export type { LayoutState }
