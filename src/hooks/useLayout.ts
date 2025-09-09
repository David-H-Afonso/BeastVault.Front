import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setLayoutType } from '@/store/features/layout'
import type { LayoutType } from '@/models/store/Layout'

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
