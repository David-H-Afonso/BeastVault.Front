import type { PokemonSpritesDto } from '@/models/api/types'
import { SpriteType } from '@/models/enums/SpriteTypes'
import { environment } from '@/environments'

/**
 * Builds a PokemonSpritesDto from a pokemon ID.
 * Mirrors the backend's PokemonSpritesDto.ForPokemonId() method.
 * All URLs point to local endpoints — sprites are downloaded and cached in DB.
 */
export function buildSpritesForId(id: number, _name?: string): PokemonSpritesDto {
	return {
		default: `/sprites/pokemon/${id}.png`,
		shiny: `/sprites/pokemon/shiny/${id}.png`,
		official: `/sprites/pokemon/artwork/${id}.png`,
		officialShiny: `/sprites/pokemon/artwork/shiny/${id}.png`,
		home: `/sprites/pokemon/home/${id}.png`,
		homeShiny: `/sprites/pokemon/home/shiny/${id}.png`,
		showdown: `/sprites/pokemon/showdown/${id}.gif`,
		showdownShiny: `/sprites/pokemon/showdown/shiny/${id}.gif`,
		github: `/sprites/pokemon/github/${id}.png`,
		githubShiny: `/sprites/pokemon/github/shiny/${id}.png`,
	}
}

/**
 * Resolves a sprite URL to an absolute URL. Backend returns relative paths
 * like "/sprites/pokemon/25.png" — those must be prefixed with the API base
 * URL so the browser hits the backend, not the Vite dev server.
 * Returns absolute URLs (http://, https://, data:) unchanged.
 */
export function resolveSpriteUrl(url: string | null | undefined): string | null {
	if (!url) return null
	// Already absolute or data URI
	if (/^(https?:|data:|blob:)/i.test(url)) return url
	// Backend-served relative paths
	if (url.startsWith('/sprites/') || url.startsWith('/custom-sprites/')) {
		return `${environment.baseUrl}${url}`
	}
	return url
}

/**
 * Selects the best sprite URL from a PokemonSpritesDto based on user's sprite type preference.
 * Works with the enriched sprite data from the backend list endpoint.
 */
export function getPreferredSpriteFromDto(
	sprites: PokemonSpritesDto | undefined | null,
	spriteType: SpriteType,
	isShiny: boolean = false
): string | null {
	const url = pickSpriteFromDto(sprites, spriteType, isShiny)
	return resolveSpriteUrl(url)
}

function pickSpriteFromDto(
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
