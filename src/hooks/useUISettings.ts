import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { 
	setTheme as setThemeAction,
	setViewMode as setViewModeAction,
	setSpriteType,
	setBackgroundType as setBackgroundTypeAction
} from '@/store/features/styleSettings'
import { setLayoutType } from '@/store/features/layout'
import type { ThemeName, ViewMode } from '@/models/store/StylesSetting'
import type { LayoutType } from '@/models/store/Layout'
import type { SpriteTypeName } from '../models/enums/SpriteTypes'
import type { CardBackgroundTypeName } from '../models/enums/CardBackgroundTypes'

/**
 * Hook unificado para manejar todas las configuraciones de UI
 * Consolida theme, viewMode, layout, spriteType y backgroundType en un solo hook
 */
export function useUISettings() {
	const dispatch = useAppDispatch()
	
	// Selectors
	const currentTheme = useAppSelector((state) => state.styleSettings.theme)
	const viewMode = useAppSelector((state) => state.styleSettings.viewMode)
	const spriteType = useAppSelector((state) => state.styleSettings.spriteType)
	const layoutType = useAppSelector((state) => state.layout.layoutType)
	const backgroundType = useAppSelector((state) => state.styleSettings.backgroundType)

	// Theme actions
	const setTheme = (theme: ThemeName) => {
		dispatch(setThemeAction(theme))
		document.documentElement.setAttribute('data-theme', theme)
	}

	// ViewMode actions
	const setViewMode = (newMode: ViewMode) => {
		dispatch(setViewModeAction(newMode))
	}

	// Layout actions
	const setLayout = (newLayout: LayoutType) => {
		dispatch(setLayoutType(newLayout))
	}

	// Sprite type actions
	const setSpriteTypeAction = (newType: SpriteTypeName) => {
		dispatch(setSpriteType(newType))
	}

	// Background type actions
	const setBackgroundType = (newType: CardBackgroundTypeName) => {
		dispatch(setBackgroundTypeAction(newType))
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
	}
}
