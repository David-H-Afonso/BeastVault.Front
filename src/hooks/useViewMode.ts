import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setViewMode as setViewModeAction } from '@/store/features/styleSettings'
import type { ViewMode } from '@/models/store/StylesSetting'

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
