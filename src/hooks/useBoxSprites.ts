import { useState, useEffect } from 'react'

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

// Get Pokemon name from PokeAPI for sprite filename
const getPokemonName = async (speciesId: number, form: number = 0): Promise<string> => {
	try {
		// For form 0, get base Pokemon name
		if (form === 0) {
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
			if (response.ok) {
				const data = await response.json()
				return data.name
			}
		} else {
			// For forms > 0, get the species data to find varieties
			const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`)
			if (speciesResponse.ok) {
				const speciesData = await speciesResponse.json()

				// Look for varieties (regional forms)
				if (speciesData.varieties && speciesData.varieties.length > form) {
					const variety = speciesData.varieties[form]
					const pokemonResponse = await fetch(variety.pokemon.url)
					if (pokemonResponse.ok) {
						const pokemonData = await pokemonResponse.json()
						return pokemonData.name
					}
				}
			}

			// Fallback: try the base Pokemon endpoint
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
			if (response.ok) {
				const data = await response.json()
				return data.name
			}
		}

		return `pokemon-${speciesId}`
	} catch (error) {
		console.warn(`Error fetching Pokemon name for ${speciesId}:`, error)
		return `pokemon-${speciesId}`
	}
}

export function useBoxSprites(speciesId: number, form: number = 0, isShiny: boolean = false) {
	const [spriteUrl, setSpriteUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		const loadSprite = async () => {
			setLoading(true)
			try {
				console.log(`Loading sprite for speciesId: ${speciesId}, form: ${form}, shiny: ${isShiny}`)

				const generation = getGeneration(speciesId)
				const pokemonName = await getPokemonName(speciesId, form)

				console.log(`Pokemon name for sprite: ${pokemonName}`)
				console.log(`Generation: ${generation}`)

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
				console.log(`Final sprite URL: ${url}`)
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
