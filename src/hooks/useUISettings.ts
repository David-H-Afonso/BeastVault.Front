import { useRef, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
	setTheme as setThemeAction,
	setViewMode as setViewModeAction,
	setSpriteType,
	setBackgroundType as setBackgroundTypeAction,
	setOrganizeDensity as setOrganizeDensityAction,
	setKanbanDragMode as setKanbanDragModeAction,
	syncPreferences,
} from '@/store/features/styleSettings'
import { setLayoutType } from '@/store/features/layout'
import type {
	ThemeName,
	ViewMode,
	OrganizeDensity,
	KanbanDragMode,
} from '@/models/store/StylesSetting'
import type { LayoutType } from '@/models/store/Layout'
import type { SpriteTypeName } from '../models/enums/SpriteTypes'
import type { CardBackgroundTypeName } from '../models/enums/CardBackgroundTypes'

export function useUISettings() {
	const dispatch = useAppDispatch()
	const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

	const currentTheme = useAppSelector((state) => state.styleSettings.theme)
	const viewMode = useAppSelector((state) => state.styleSettings.viewMode)
	const spriteType = useAppSelector((state) => state.styleSettings.spriteType)
	const layoutType = useAppSelector((state) => state.layout.layoutType)
	const backgroundType = useAppSelector((state) => state.styleSettings.backgroundType)
	const organizeDensity = useAppSelector((state) => state.styleSettings.organizeDensity)
	const kanbanDragMode = useAppSelector((state) => state.styleSettings.kanbanDragMode)
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

	const syncToBackend = useCallback(() => {
		if (!isAuthenticated) return
		clearTimeout(syncTimer.current)
		syncTimer.current = setTimeout(() => dispatch(syncPreferences()), 500)
	}, [isAuthenticated, dispatch])

	const setTheme = (theme: ThemeName) => {
		dispatch(setThemeAction(theme))
		document.documentElement.setAttribute('data-theme', theme)
		syncToBackend()
	}

	const setViewMode = (newMode: ViewMode) => {
		dispatch(setViewModeAction(newMode))
		syncToBackend()
	}

	const setLayout = (newLayout: LayoutType) => {
		dispatch(setLayoutType(newLayout))
	}

	const setSpriteTypeAction = (newType: SpriteTypeName) => {
		dispatch(setSpriteType(newType))
		syncToBackend()
	}

	const setBackgroundType = (newType: CardBackgroundTypeName) => {
		dispatch(setBackgroundTypeAction(newType))
		syncToBackend()
	}

	const setOrganizeDensity = (density: OrganizeDensity) => {
		dispatch(setOrganizeDensityAction(density))
		syncToBackend()
	}

	const setKanbanDragMode = (mode: KanbanDragMode) => {
		dispatch(setKanbanDragModeAction(mode))
		syncToBackend()
	}

	// Initialize theme on DOM when hook is first used
	if (currentTheme) {
		document.documentElement.setAttribute('data-theme', currentTheme)
	}

	return {
		// Theme
		currentTheme,
		setTheme,

		// View Mode
		viewMode,
		setViewMode,

		// Layout
		layoutType,
		setLayout,

		// Sprite Type
		spriteType,
		setSpriteType: setSpriteTypeAction,

		// Background Type
		backgroundType,
		setBackgroundType,

		// Organize Density
		organizeDensity,
		setOrganizeDensity,

		// Kanban Drag Mode
		kanbanDragMode,
		setKanbanDragMode,
	}
}
