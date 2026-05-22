import type { PokemonSpritesDto } from '@/models/api/types'
import { SpriteType } from '@/models/enums/SpriteTypes'

/**
 * Selects the best sprite URL from a PokemonSpritesDto based on user's sprite type preference.
 * Works with the enriched sprite data from the backend list endpoint.
 */
export function getPreferredSpriteFromDto(
	sprites: PokemonSpritesDto | undefined | null,
	spriteType: SpriteType,
	isShiny: boolean = false
): string | null {
	if (!sprites) return null

	switch (spriteType) {
		case SpriteType.GIFS:
			if (isShiny) {
				return (
					sprites.showdownShiny ||
					sprites.showdown ||
					sprites.homeShiny ||
					sprites.home ||
					sprites.shiny ||
					sprites.default ||
					null
				)
			}
			return sprites.showdown || sprites.home || sprites.default || null

		case SpriteType.HOME:
			if (isShiny) {
				return (
					sprites.homeShiny ||
					sprites.home ||
					sprites.officialShiny ||
					sprites.official ||
					sprites.shiny ||
					sprites.default ||
					null
				)
			}
			return sprites.home || sprites.official || sprites.default || null

		case SpriteType.OFFICIAL:
			if (isShiny) {
				return (
					sprites.officialShiny ||
					sprites.official ||
					sprites.homeShiny ||
					sprites.home ||
					sprites.shiny ||
					sprites.default ||
					null
				)
			}
			return sprites.official || sprites.home || sprites.default || null

		case SpriteType.DEFAULT:
			if (isShiny) {
				return sprites.shiny || sprites.default || sprites.homeShiny || sprites.home || null
			}
			return sprites.default || sprites.home || null

		case SpriteType.SPRITES:
		default:
			if (isShiny) {
				return (
					sprites.githubShiny ||
					sprites.github ||
					sprites.showdown ||
					sprites.home ||
					sprites.official ||
					sprites.default ||
					null
				)
			}
			return (
				sprites.github ||
				sprites.githubShiny ||
				sprites.showdown ||
				sprites.home ||
				sprites.official ||
				sprites.default ||
				null
			)
	}
}
