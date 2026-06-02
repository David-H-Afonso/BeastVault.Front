import { createAsyncThunk } from '@reduxjs/toolkit'
import { getPreferences, updatePreferences } from '@/services/Auth'
import {
	setTheme,
	setViewMode,
	setBrowseLayout,
	setSpriteType,
	setBackgroundType,
	setOrganizeDensity,
	setKanbanDragMode,
} from './styleSettingsSlice'
import type {
	ThemeName,
	ViewMode,
	BrowseLayout,
	OrganizeDensity,
	KanbanDragMode,
} from '@/models/store/StylesSetting'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'
import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { StyleSettingsState } from './styleSettingsSlice'

/** Migrate legacy view mode names to new ones */
function migrateViewMode(mode: string): ViewMode {
	switch (mode) {
		case 'box':
		case 'boxes':
			return 'boxes'
		case 'tags':
		case 'list':
		case 'grid':
		case 'organize':
		case 'kanban':
			return 'browse'
		case 'browse':
			return 'browse'
		default:
			return 'browse'
	}
}

function migrateBrowseLayout(layout: string | undefined | null, legacyMode: string): BrowseLayout {
	if (layout === 'grid' || layout === 'list') return layout
	if (legacyMode === 'grid') return 'grid'
	return 'list'
}

function migrateTheme(theme: string | undefined | null): ThemeName {
	return theme === 'home' ? 'home' : 'dark'
}

export const fetchPreferences = createAsyncThunk(
	'styleSettings/fetchPreferences',
	async (_, { dispatch }) => {
		const prefs = await getPreferences()
		const viewMode = migrateViewMode(prefs.viewMode)
		const browseLayout = migrateBrowseLayout(prefs.browseLayout, prefs.viewMode)
		const theme = migrateTheme(prefs.theme)
		dispatch(setTheme(theme))
		dispatch(setViewMode(viewMode))
		dispatch(setBrowseLayout(browseLayout))
		dispatch(setSpriteType(prefs.spriteType as SpriteTypeName))
		dispatch(setBackgroundType(prefs.backgroundType as CardBackgroundTypeName))
		dispatch(setOrganizeDensity((prefs.organizeDensity || 'expanded') as OrganizeDensity))
		dispatch(setKanbanDragMode((prefs.kanbanDragMode || 'move') as KanbanDragMode))
		document.documentElement.setAttribute('data-theme', theme)
		return prefs
	}
)

export const syncPreferences = createAsyncThunk(
	'styleSettings/syncPreferences',
	async (_, { getState }) => {
		const { styleSettings } = getState() as { styleSettings: StyleSettingsState }
		const { theme, viewMode, browseLayout, spriteType, backgroundType, organizeDensity, kanbanDragMode } =
			styleSettings
		return await updatePreferences({
			theme,
			viewMode,
			browseLayout,
			spriteType,
			backgroundType,
			organizeDensity,
			kanbanDragMode,
		})
	}
)
