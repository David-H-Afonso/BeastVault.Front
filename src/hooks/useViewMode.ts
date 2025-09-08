import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setViewMode as setViewModeAction, type ViewMode } from '../store/backgroundSlice'

export function useViewMode() {
	const viewMode = useAppSelector((state) => state.background.viewMode)
	const dispatch = useAppDispatch()

	const setViewMode = (newMode: ViewMode) => {
		dispatch(setViewModeAction(newMode))
	}

	return {
		viewMode,
		setViewMode,
	}
}
