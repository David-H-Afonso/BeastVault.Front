import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { setSpriteType } from '../store/backgroundSlice'
import type { SpriteTypeName } from '../enums/SpriteTypes'

export function useSpriteType() {
	const dispatch = useDispatch()
	const spriteType = useSelector((state: RootState) => state.background.spriteType)

	const setSpriteTypeAction = (newType: SpriteTypeName) => {
		dispatch(setSpriteType(newType))
	}

	return {
		spriteType,
		setSpriteType: setSpriteTypeAction,
	}
}
