import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setLayoutType, type LayoutType } from '../store/layoutSlice'

export function useLayout() {
	const layoutType = useAppSelector((state) => state.layout.layoutType)
	const dispatch = useAppDispatch()

	const setLayout = (newLayout: LayoutType) => {
		dispatch(setLayoutType(newLayout))
	}

	return {
		layoutType,
		setLayout,
	}
}
