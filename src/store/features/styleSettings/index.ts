// ===================================
// REDUCER
// ===================================
export { default as styleSettingsReducer } from './styleSettingsSlice'

// ===================================
// ACTIONS
// ===================================
export { setBackgroundType, setViewMode, setTheme, setSpriteType } from './styleSettingsSlice'

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
