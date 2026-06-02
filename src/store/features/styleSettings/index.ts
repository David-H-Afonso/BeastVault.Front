// ===================================
// REDUCER
// ===================================
export { default as styleSettingsReducer } from './styleSettingsSlice'

// ===================================
// ACTIONS
// ===================================
export {
	setBackgroundType,
	setViewMode,
	setBrowseLayout,
	setTheme,
	setSpriteType,
	setOrganizeDensity,
	setKanbanDragMode,
	setBoxIconStyle,
} from './styleSettingsSlice'

// ===================================
// THUNKS
// ===================================
export { fetchPreferences, syncPreferences } from './thunks'

// ===================================
// SELECTORS
// ===================================
export {
	selectStyleSettings,
	selectBackgroundType,
	selectViewMode,
	selectBrowseLayout,
	selectTheme,
	selectSpriteType,
} from './selectors'
