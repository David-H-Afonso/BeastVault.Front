import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { CardBackgroundType, type CardBackgroundTypeName } from '../enums/CardBackgroundTypes'

export type ViewMode = 'tags' | 'grid' | 'list'
export type ThemeName =
	| 'dark'
	| 'light'
	| 'pokemon'
	| 'water'
	| 'fire'
	| 'grass'
	| 'electric'
	| 'psychic'

interface BackgroundState {
	backgroundType: CardBackgroundTypeName
	viewMode: ViewMode
	theme: ThemeName
}

// Load initial state from localStorage if available
const loadInitialState = (): BackgroundState => {
	try {
		const savedBackground = localStorage.getItem('cardBackgroundType')
		const savedViewMode = localStorage.getItem('viewMode')
		const savedTheme = localStorage.getItem('theme')

		let backgroundType: CardBackgroundTypeName = CardBackgroundType.DIAGONAL_45
		let viewMode: ViewMode = 'grid'
		let theme: ThemeName = 'dark'

		if (savedBackground) {
			const validValues = Object.values(CardBackgroundType)
			if (validValues.includes(savedBackground as CardBackgroundTypeName)) {
				backgroundType = savedBackground as CardBackgroundTypeName
			}
		}

		if (savedViewMode) {
			const validModes: ViewMode[] = ['tags', 'grid', 'list']
			if (validModes.includes(savedViewMode as ViewMode)) {
				viewMode = savedViewMode as ViewMode
			}
		}

		if (savedTheme) {
			const validThemes: ThemeName[] = [
				'dark',
				'light',
				'pokemon',
				'water',
				'fire',
				'grass',
				'electric',
				'psychic',
			]
			if (validThemes.includes(savedTheme as ThemeName)) {
				theme = savedTheme as ThemeName
			}
		}

		return { backgroundType, viewMode, theme }
	} catch (error) {
		console.warn('Failed to load state from localStorage:', error)
	}
	return { backgroundType: CardBackgroundType.DIAGONAL_45, viewMode: 'grid', theme: 'dark' }
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
		setViewMode: (state, action: PayloadAction<ViewMode>) => {
			state.viewMode = action.payload
			// Persist to localStorage
			try {
				localStorage.setItem('viewMode', action.payload)
			} catch (error) {
				console.warn('Failed to save view mode to localStorage:', error)
			}
		},
		setTheme: (state, action: PayloadAction<ThemeName>) => {
			state.theme = action.payload
			// Persist to localStorage
			try {
				localStorage.setItem('theme', action.payload)
			} catch (error) {
				console.warn('Failed to save theme to localStorage:', error)
			}
		},
	},
})

export const { setBackgroundType, setViewMode, setTheme } = backgroundSlice.actions
export default backgroundSlice.reducer
