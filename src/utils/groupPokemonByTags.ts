import type { PokemonListItemDto } from '@/models/Pokemon'

export const groupPokemonByTags = (pokemon: PokemonListItemDto[]) => {
	const grouped: { [key: string]: PokemonListItemDto[] } = {}
	const untagged: PokemonListItemDto[] = []

	pokemon.forEach((p) => {
		if (!p.tags || p.tags.length === 0) {
			untagged.push(p)
		} else {
			p.tags.forEach((tag) => {
				if (!grouped[tag.name]) {
					grouped[tag.name] = []
				}
				grouped[tag.name].push(p)
			})
		}
	})

	return { grouped, untagged }
}
