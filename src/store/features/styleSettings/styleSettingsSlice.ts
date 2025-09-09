import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { CardBackgroundType, type CardBackgroundTypeName } from '@/enums/CardBackgroundTypes'
import { SpriteType, type SpriteTypeName } from '@/enums/SpriteTypes'
import type { StyleSettingsState, ThemeName, ViewMode } from '@/models/store/StylesSetting'

// Load initial state from localStorage if available
const loadInitialState = (): StyleSettingsState => {
	try {
		const savedBackground = localStorage.getItem('cardBackgroundType')
		const savedViewMode = localStorage.getItem('viewMode')
		const savedTheme = localStorage.getItem('theme')
		const savedSpriteType = localStorage.getItem('pokemon-sprite-type')

		let backgroundType: CardBackgroundTypeName = CardBackgroundType.DIAGONAL_45
		let viewMode: ViewMode = 'grid'
		let theme: ThemeName = 'dark'
		let spriteType: SpriteTypeName = SpriteType.SPRITES

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

		if (savedSpriteType) {
			const validTypes = Object.values(SpriteType)
			if (validTypes.includes(savedSpriteType as SpriteTypeName)) {
				spriteType = savedSpriteType as SpriteTypeName
			}
		}

		return {
			backgroundType,
			viewMode,
			theme,
			spriteType,
		}
	} catch (error) {
		console.warn('Failed to load state from localStorage:', error)
	}
	return {
		backgroundType: CardBackgroundType.DIAGONAL_45,
		viewMode: 'grid',
		theme: 'dark',
		spriteType: SpriteType.SPRITES,
	}
}

const initialState: StyleSettingsState = loadInitialState()

const styleSettingsSlice = createSlice({
	name: 'styleSettings',
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
		setSpriteType: (state, action: PayloadAction<SpriteTypeName>) => {
			state.spriteType = action.payload
			// Persist to localStorage
			try {
				localStorage.setItem('pokemon-sprite-type', action.payload)
			} catch (error) {
				console.warn('Failed to save sprite type to localStorage:', error)
			}
		},
	},
})

export const { setBackgroundType, setViewMode, setTheme, setSpriteType } =
	styleSettingsSlice.actions
export default styleSettingsSlice.reducer

// Types
export type { StyleSettingsState }
