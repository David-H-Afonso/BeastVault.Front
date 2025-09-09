import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setTheme as setThemeAction } from '@/store/features/styleSettings'
import type { ThemeName } from '@/models/store/StylesSetting'

export function useTheme() {
	const currentTheme = useAppSelector((state) => state.styleSettings.theme)
	const dispatch = useAppDispatch()

	const setTheme = (theme: ThemeName) => {
		dispatch(setThemeAction(theme))
		// Apply theme to DOM
		document.documentElement.setAttribute('data-theme', theme)
	}

	// Initialize theme on DOM when hook is first used
	if (currentTheme) {
		document.documentElement.setAttribute('data-theme', currentTheme)
	}

	return {
		currentTheme,
		setTheme,
	}
}
