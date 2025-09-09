import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getPokeBallIcon } from '../services/Pokeapi'
import { 
	storePokeballUrl, 
	selectPokeballUrl, 
	accessPokeballUrl 
} from '../store/features/assets/assetsSlice'
import type { RootState } from '../store'

/**
 * Hook for getting Pokeball icons with Redux memory storage
 */
export function usePokeBallIcon(ballName?: string) {
	const dispatch = useDispatch()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	
	// Check Redux storage first
	const storedUrl = useSelector((state: RootState) => 
		ballName ? selectPokeballUrl(state, ballName) : null
	)

	const [icon, setIcon] = useState<string | null>(null)

	useEffect(() => {
		if (!ballName) {
			setIcon(null)
			return
		}

		// If we have stored URL, use it and update access time
		if (storedUrl) {
			setIcon(storedUrl)
			dispatch(accessPokeballUrl(ballName))
			return
		}

		// No stored URL, fetch it
		const fetchIcon = async () => {
			setLoading(true)
			setError(null)

			try {
				const iconUrl = await getPokeBallIcon(ballName)
				
				if (iconUrl) {
					// Store in Redux memory
					dispatch(storePokeballUrl({ ballName, url: iconUrl }))
					setIcon(iconUrl)
				} else {
					setIcon(null)
				}
			} catch (err) {
				console.error('Error fetching pokeball icon:', err)
				setError(err instanceof Error ? err.message : 'Unknown error')
				setIcon(null)
			} finally {
				setLoading(false)
			}
		}

		fetchIcon()
	}, [ballName, storedUrl, dispatch])

	return { 
		icon, 
		loading, 
		error 
	}
}

/**
 * Hook for getting sprite URLs with Redux memory storage
 */
export function useSpriteUrl(spriteKey?: string, spriteUrl?: string) {
	const dispatch = useDispatch()
	
	// Check Redux storage first
	const storedUrl = useSelector((state: RootState) => 
		spriteKey ? state.assets.sprites[spriteKey]?.url : null
	)

	useEffect(() => {
		if (!spriteKey || !spriteUrl) return

		// If we have a URL but it's not stored, store it
		if (spriteUrl && !storedUrl) {
			dispatch({ 
				type: 'assets/storeSpriteUrl', 
				payload: { key: spriteKey, url: spriteUrl } 
			})
		}
		
		// If stored, update access time
		if (storedUrl) {
			dispatch({ 
				type: 'assets/accessSpriteUrl', 
				payload: spriteKey 
			})
		}
	}, [spriteKey, spriteUrl, storedUrl, dispatch])

	return storedUrl || spriteUrl || null
}

/**
 * Hook for getting type icon URLs with Redux memory storage
 */
export function useTypeIconUrl(typeName?: string) {
	const dispatch = useDispatch()
	
	// Check Redux storage first
	const storedUrl = useSelector((state: RootState) => 
		typeName ? state.assets.typeIcons[typeName]?.url : null
	)

	useEffect(() => {
		if (!typeName) return

		// Generate the URL (these are static URLs)
		const typeIconUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeName.toLowerCase()}.png`
		
		// If not stored, store it
		if (!storedUrl) {
			dispatch({ 
				type: 'assets/storeTypeIconUrl', 
				payload: { typeName, url: typeIconUrl } 
			})
		} else {
			// Update access time
			dispatch({ 
				type: 'assets/accessTypeIconUrl', 
				payload: typeName 
			})
		}
	}, [typeName, storedUrl, dispatch])

	return storedUrl || (typeName ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeName.toLowerCase()}.png` : null)
}
