import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setViewMode as setViewModeAction, type ViewMode } from '../store/styleSettingsSlice'

export function useViewMode() {
	const viewMode = useAppSelector((state) => state.styleSettings.viewMode)
	const dispatch = useAppDispatch()

	const setViewMode = (newMode: ViewMode) => {
		dispatch(setViewModeAction(newMode))
	}

	return {
		viewMode,
		setViewMode,
	}
}
