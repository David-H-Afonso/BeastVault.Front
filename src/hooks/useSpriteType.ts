import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { setSpriteType } from '@/store/features/styleSettings'
import type { SpriteTypeName } from '../models/enums/SpriteTypes'

export function useSpriteType() {
	const dispatch = useDispatch()
	const spriteType = useSelector((state: RootState) => state.styleSettings.spriteType)

	const setSpriteTypeAction = (newType: SpriteTypeName) => {
		dispatch(setSpriteType(newType))
	}

	return {
		spriteType,
		setSpriteType: setSpriteTypeAction,
	}
}
