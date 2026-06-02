import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { CardBackgroundType, type CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import { SpriteType, type SpriteTypeName } from '@/models/enums/SpriteTypes'
import type {
	StyleSettingsState,
	ThemeName,
	ViewMode,
	BrowseLayout,
	OrganizeDensity,
	KanbanDragMode,
	BoxIconStyle,
} from '@/models/store/StylesSetting'

const initialState: StyleSettingsState = {
	backgroundType: CardBackgroundType.DIAGONAL_45,
	viewMode: 'browse',
	browseLayout: 'list',
	theme: 'dark',
	spriteType: SpriteType.SPRITES,
	organizeDensity: 'expanded',
	kanbanDragMode: 'move',
	boxIconStyle: 'bulbapedia',
}

const styleSettingsSlice = createSlice({
	name: 'styleSettings',
	initialState,
	reducers: {
		setBackgroundType: (state, action: PayloadAction<CardBackgroundTypeName>) => {
			state.backgroundType = action.payload
		},
		setViewMode: (state, action: PayloadAction<ViewMode>) => {
			state.viewMode = action.payload
		},
		setBrowseLayout: (state, action: PayloadAction<BrowseLayout>) => {
			state.browseLayout = action.payload
		},
		setTheme: (state, action: PayloadAction<ThemeName>) => {
			state.theme = action.payload
		},
		setSpriteType: (state, action: PayloadAction<SpriteTypeName>) => {
			state.spriteType = action.payload
		},
		setOrganizeDensity: (state, action: PayloadAction<OrganizeDensity>) => {
			state.organizeDensity = action.payload
		},
		setKanbanDragMode: (state, action: PayloadAction<KanbanDragMode>) => {
			state.kanbanDragMode = action.payload
		},
		setBoxIconStyle: (state, action: PayloadAction<BoxIconStyle>) => {
			state.boxIconStyle = action.payload
		},
	},
})

// ===================================
// ===================================
// EXPORTS
// ===================================

export const {
	setBackgroundType,
	setViewMode,
	setBrowseLayout,
	setTheme,
	setSpriteType,
	setOrganizeDensity,
	setKanbanDragMode,
	setBoxIconStyle,
} = styleSettingsSlice.actions
export default styleSettingsSlice.reducer

// Types
export type { StyleSettingsState }
