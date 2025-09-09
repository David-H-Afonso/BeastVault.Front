import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setBackgroundType as setBackgroundTypeAction } from '@/store/features/styleSettings'
import type { CardBackgroundTypeName } from '../models/enums/CardBackgroundTypes'

export function useCardBackgroundType() {
	const backgroundType = useAppSelector((state) => state.styleSettings.backgroundType)
	const dispatch = useAppDispatch()

	const setBackgroundType = (newType: CardBackgroundTypeName) => {
		dispatch(setBackgroundTypeAction(newType))
	}

	return {
		backgroundType,
		setBackgroundType,
	}
}
