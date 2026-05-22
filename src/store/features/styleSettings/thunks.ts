import { createAsyncThunk } from '@reduxjs/toolkit'
import { getPreferences, updatePreferences } from '@/services/Auth'
import { setTheme, setViewMode, setSpriteType, setBackgroundType } from './styleSettingsSlice'
import type { ThemeName, ViewMode } from '@/models/store/StylesSetting'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'
import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { StyleSettingsState } from './styleSettingsSlice'

export const fetchPreferences = createAsyncThunk(
	'styleSettings/fetchPreferences',
	async (_, { dispatch }) => {
		const prefs = await getPreferences()
		dispatch(setTheme(prefs.theme as ThemeName))
		dispatch(setViewMode(prefs.viewMode as ViewMode))
		dispatch(setSpriteType(prefs.spriteType as SpriteTypeName))
		dispatch(setBackgroundType(prefs.backgroundType as CardBackgroundTypeName))
		document.documentElement.setAttribute('data-theme', prefs.theme)
		return prefs
	}
)

export const syncPreferences = createAsyncThunk(
	'styleSettings/syncPreferences',
	async (_, { getState }) => {
		const { styleSettings } = getState() as { styleSettings: StyleSettingsState }
		const { theme, viewMode, spriteType, backgroundType } = styleSettings
		return await updatePreferences({ theme, viewMode, spriteType, backgroundType })
	}
)
