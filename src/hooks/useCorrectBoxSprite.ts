import { useState, useEffect } from 'react'
import { getPokeApiPokemon } from '../services/Pokeapi'

// Get generation info to determine which repository to use
const getGeneration = (speciesId: number): number => {
	if (speciesId <= 151) return 1 // Gen 1
	if (speciesId <= 251) return 2 // Gen 2
	if (speciesId <= 386) return 3 // Gen 3
	if (speciesId <= 493) return 4 // Gen 4
	if (speciesId <= 649) return 5 // Gen 5
	if (speciesId <= 721) return 6 // Gen 6
	if (speciesId <= 809) return 7 // Gen 7
	if (speciesId <= 898) return 8 // Gen 8
	return 9 // Gen 9+
}

export function useCorrectBoxSprite(speciesId: number, form: number = 0, isShiny: boolean = false) {
	const [spriteUrl, setSpriteUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		const loadSprite = async () => {
			setLoading(true)
			try {
				// Use the same method as the working system
				const pokemonData = await getPokeApiPokemon(speciesId, form, false)
				const pokemonName = pokemonData.name

				const generation = getGeneration(speciesId)
				let baseUrl: string
				const folder = isShiny ? 'shiny' : 'regular'

				if (generation <= 8) {
					// Use pokesprite for Gen 1-8
					baseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
				} else {
					// Use pokemon-sprites for Gen 9+
					baseUrl = 'https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon'
				}

				const url = `${baseUrl}/${folder}/${pokemonName}.png`
				setSpriteUrl(url)
			} catch (error) {
				console.warn('Error loading box sprite:', error)
				setSpriteUrl(null)
			} finally {
				setLoading(false)
			}
		}

		if (speciesId > 0) {
			loadSprite()
		}
	}, [speciesId, form, isShiny])

	return { spriteUrl, loading }
}
