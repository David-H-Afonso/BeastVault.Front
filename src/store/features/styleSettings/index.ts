// ===================================
// REDUCER
// ===================================
export { default as styleSettingsReducer } from './styleSettingsSlice'

// ===================================
// ACTIONS
// ===================================
export { setBackgroundType, setViewMode, setTheme, setSpriteType } from './styleSettingsSlice'

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
	selectTheme,
	selectSpriteType,
} from './selectors'
