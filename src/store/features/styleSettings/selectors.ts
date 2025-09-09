import type { RootState } from '@/store'

// ===================================
// SIMPLE SELECTORS
// ===================================

export const selectStyleSettings = (state: RootState) => state.styleSettings
export const selectBackgroundType = (state: RootState) => state.styleSettings.backgroundType
export const selectViewMode = (state: RootState) => state.styleSettings.viewMode
export const selectTheme = (state: RootState) => state.styleSettings.theme
export const selectSpriteType = (state: RootState) => state.styleSettings.spriteType
