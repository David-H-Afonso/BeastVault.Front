import type { RootState } from '@/store'

// ===================================
// SIMPLE SELECTORS
// ===================================

export const selectLayoutType = (state: RootState) => state.layout.layoutType
export const selectLayoutState = (state: RootState) => state.layout
