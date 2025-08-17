import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setBackgroundType as setBackgroundTypeAction } from '../store/backgroundSlice'
import type { CardBackgroundTypeName } from '../enums/CardBackgroundTypes'

export function useCardBackgroundType() {
	const backgroundType = useAppSelector((state) => state.background.backgroundType)
	const dispatch = useAppDispatch()

	const setBackgroundType = (newType: CardBackgroundTypeName) => {
		dispatch(setBackgroundTypeAction(newType))
	}

	return {
		backgroundType,
		setBackgroundType,
	}
}
