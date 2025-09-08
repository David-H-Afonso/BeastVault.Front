import { useMemo } from 'react'
import { useSpriteType } from './useSpriteType'
import { SpriteType } from '../enums/SpriteTypes'

/**
 * Hook to get the preferred sprite URL based on user settings
 * @param sprites - Object containing all available sprite URLs
 * @param isShiny - Whether the Pokemon is shiny
 * @returns The best sprite URL according to user preferences
 */
export function useUserPreferredSprite(sprites: any, isShiny: boolean = false): string | null {
	const { spriteType } = useSpriteType()

	return useMemo(() => {
		if (!sprites) return null

		// Function to get sprite by type
		const getBestSpriteByType = (
			sprites: any,
			spriteType: SpriteType,
			isShiny: boolean = false
		): string | null => {
			switch (spriteType) {
				case SpriteType.GIFS:
					// GIFs animados (Showdown)
					if (isShiny) {
						return (
							sprites.showdownShiny ||
							sprites.showdown ||
							sprites.homeShiny ||
							sprites.home ||
							sprites.shiny ||
							sprites.default
						)
					}
					return sprites.showdown || sprites.home || sprites.default

				case SpriteType.HOME:
					// Pokemon HOME sprites
					if (isShiny) {
						return (
							sprites.homeShiny ||
							sprites.home ||
							sprites.officialShiny ||
							sprites.official ||
							sprites.shiny ||
							sprites.default
						)
					}
					return sprites.home || sprites.official || sprites.default

				case SpriteType.OFFICIAL:
					// Official artwork
					if (isShiny) {
						return (
							sprites.officialShiny ||
							sprites.official ||
							sprites.homeShiny ||
							sprites.home ||
							sprites.shiny ||
							sprites.default
						)
					}
					return sprites.official || sprites.home || sprites.default

				case SpriteType.DEFAULT:
					// PokeAPI default sprites
					if (isShiny) {
						return sprites.shiny || sprites.default || sprites.homeShiny || sprites.home
					}
					return sprites.default || sprites.home

				case SpriteType.SPRITES:
				default:
					// GitHub sprites (gen 1-8 + gen 9, misma lógica que useCorrectBoxSprite)
					if (isShiny) {
						return (
							sprites.githubShiny ||
							sprites.githubRegular ||
							sprites.showdown ||
							sprites.home ||
							sprites.official ||
							sprites.default
						)
					}
					return (
						sprites.githubRegular ||
						sprites.githubShiny ||
						sprites.showdown ||
						sprites.home ||
						sprites.official ||
						sprites.default
					)
			}
		}

		return getBestSpriteByType(sprites, spriteType, isShiny)
	}, [sprites, spriteType, isShiny])
}

export default useUserPreferredSprite
