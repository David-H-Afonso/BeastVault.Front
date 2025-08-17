import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { CardBackgroundType, type CardBackgroundTypeName } from '../enums/CardBackgroundTypes'

interface BackgroundState {
	backgroundType: CardBackgroundTypeName
}

// Load initial state from localStorage if available
const loadInitialState = (): BackgroundState => {
	try {
		const saved = localStorage.getItem('cardBackgroundType')
		if (saved) {
			const validValues = Object.values(CardBackgroundType)
			if (validValues.includes(saved as CardBackgroundTypeName)) {
				return { backgroundType: saved as CardBackgroundTypeName }
			}
		}
	} catch (error) {
		console.warn('Failed to load background type from localStorage:', error)
	}
	return { backgroundType: CardBackgroundType.DIAGONAL_45 }
}

const initialState: BackgroundState = loadInitialState()

const backgroundSlice = createSlice({
	name: 'background',
	initialState,
	reducers: {
		setBackgroundType: (state, action: PayloadAction<CardBackgroundTypeName>) => {
			state.backgroundType = action.payload
			// Persist to localStorage
			try {
				localStorage.setItem('cardBackgroundType', action.payload)
			} catch (error) {
				console.warn('Failed to save background type to localStorage:', error)
			}
		},
	},
})

export const { setBackgroundType } = backgroundSlice.actions
export default backgroundSlice.reducer
