import { createAsyncThunk } from '@reduxjs/toolkit'
import { getPreferences, updatePreferences } from '@/services/Auth'
import {
	setTheme,
	setViewMode,
	setSpriteType,
	setBackgroundType,
	setOrganizeDensity,
	setKanbanDragMode,
} from './styleSettingsSlice'
import type {
	ThemeName,
	ViewMode,
	OrganizeDensity,
	KanbanDragMode,
} from '@/models/store/StylesSetting'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'
import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { StyleSettingsState } from './styleSettingsSlice'

/** Migrate legacy view mode names to new ones */
function migrateViewMode(mode: string): ViewMode {
	switch (mode) {
		case 'tags':
			return 'organize'
		case 'list':
			return 'grid'
		case 'grid':
		case 'organize':
		case 'box':
		case 'kanban':
			return mode as ViewMode
		default:
			return 'grid'
	}
}

export const fetchPreferences = createAsyncThunk(
	'styleSettings/fetchPreferences',
	async (_, { dispatch }) => {
		const prefs = await getPreferences()
		const viewMode = migrateViewMode(prefs.viewMode)
		dispatch(setTheme(prefs.theme as ThemeName))
		dispatch(setViewMode(viewMode))
		dispatch(setSpriteType(prefs.spriteType as SpriteTypeName))
		dispatch(setBackgroundType(prefs.backgroundType as CardBackgroundTypeName))
		dispatch(setOrganizeDensity((prefs.organizeDensity || 'expanded') as OrganizeDensity))
		dispatch(setKanbanDragMode((prefs.kanbanDragMode || 'move') as KanbanDragMode))
		document.documentElement.setAttribute('data-theme', prefs.theme)
		return prefs
	}
)

export const syncPreferences = createAsyncThunk(
	'styleSettings/syncPreferences',
	async (_, { getState }) => {
		const { styleSettings } = getState() as { styleSettings: StyleSettingsState }
		const { theme, viewMode, spriteType, backgroundType, organizeDensity, kanbanDragMode } =
			styleSettings
		return await updatePreferences({
			theme,
			viewMode,
			spriteType,
			backgroundType,
			organizeDensity,
			kanbanDragMode,
		})
	}
)
