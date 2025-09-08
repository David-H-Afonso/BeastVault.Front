import { useCallback } from 'react'

// Pokémon generation mapping for different sprite sources
const getGenerationInfo = (speciesId: number) => {
	if (speciesId <= 151) return { gen: 1, maxGen: 8 } // Gen 1
	if (speciesId <= 251) return { gen: 2, maxGen: 8 } // Gen 2
	if (speciesId <= 386) return { gen: 3, maxGen: 8 } // Gen 3
	if (speciesId <= 493) return { gen: 4, maxGen: 8 } // Gen 4
	if (speciesId <= 649) return { gen: 5, maxGen: 8 } // Gen 5
	if (speciesId <= 721) return { gen: 6, maxGen: 8 } // Gen 6
	if (speciesId <= 809) return { gen: 7, maxGen: 8 } // Gen 7
	if (speciesId <= 898) return { gen: 8, maxGen: 8 } // Gen 8
	return { gen: 9, maxGen: 9 } // Gen 9+
}

// Convert species name to sprite filename format
const formatSpeciesNameForSprite = (speciesName: string): string => {
	return speciesName
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric chars with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
		.replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Get the proper Pokemon name for sprites based on species ID and form
const getPokemonNameForSprite = async (speciesId: number, form: number = 0): Promise<string> => {
	try {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
		if (response.ok) {
			const data = await response.json()

			// If form is 0 or Pokemon has no forms, use base name
			if (form === 0 || !data.forms || data.forms.length <= 1) {
				return data.name || `pokemon-${speciesId}`
			}

			// For forms, check if we have the specific form
			if (data.forms && data.forms[form]) {
				const formResponse = await fetch(data.forms[form].url)
				if (formResponse.ok) {
					const formData = await formResponse.json()
					return formData.name || data.name || `pokemon-${speciesId}`
				}
			}

			// Fallback: try to construct form name based on common patterns
			if (form > 0) {
				// Common regional form patterns
				const formNames = [
					`${data.name}`, // 0: normal
					`${data.name}-alola`, // 1: alolan (common pattern)
					`${data.name}-galar`, // 2: galarian
					`${data.name}-hisui`, // 3: hisuian
					`${data.name}-paldea`, // 4: paldean
				]

				if (form < formNames.length) {
					return formNames[form]
				}
			}

			return data.name || `pokemon-${speciesId}`
		}

		return `pokemon-${speciesId}`
	} catch (error) {
		console.warn(`Error fetching Pokemon name for sprites: ${error}`)
		return `pokemon-${speciesId}`
	}
}

export function usePokemonBoxSprites() {
	// Get box sprite URL for a Pokemon using species name and form
	const getBoxSpriteUrl = useCallback(
		async (
			speciesId: number,
			speciesName: string,
			form: number = 0,
			isShiny: boolean = false
		): Promise<string | null> => {
			try {
				const { gen } = getGenerationInfo(speciesId)

				// If we have a proper species name that includes form info, use it
				let spriteName = formatSpeciesNameForSprite(speciesName)

				// If the species name doesn't include form info and form is not 0,
				// we need to get the proper Pokemon name for the sprite
				if (
					form !== 0 &&
					!speciesName.toLowerCase().includes('alolan') &&
					!speciesName.toLowerCase().includes('galarian') &&
					!speciesName.toLowerCase().includes('hisuian') &&
					!speciesName.toLowerCase().includes('paldean')
				) {
					const pokemonName = await getPokemonNameForSprite(speciesId, form)
					spriteName = formatSpeciesNameForSprite(pokemonName)
				}

				// For Gen 1-8: use pokesprite repository with names
				if (gen <= 8) {
					const baseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
					const folder = isShiny ? 'shiny' : 'regular'

					return `${baseUrl}/${folder}/${spriteName}.png`
				}

				// For Gen 9+: use pokemon-sprites repository with names
				else {
					const baseUrl = 'https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon'
					const folder = isShiny ? 'shiny' : 'regular'

					return `${baseUrl}/${folder}/${spriteName}.png`
				}
			} catch (error) {
				console.warn('Error generating box sprite URL:', error)
				return null
			}
		},
		[]
	)

	// Get multiple sprite URLs for fallback
	const getBoxSpriteUrls = useCallback(
		async (
			speciesId: number,
			speciesName: string,
			form: number = 0,
			isShiny: boolean = false
		): Promise<string[]> => {
			const urls: string[] = []
			const { gen } = getGenerationInfo(speciesId)

			// If we have a proper species name that includes form info, use it
			let spriteName = formatSpeciesNameForSprite(speciesName)

			// If the species name doesn't include form info and form is not 0,
			// we need to get the proper Pokemon name for the sprite
			if (
				form !== 0 &&
				!speciesName.toLowerCase().includes('alolan') &&
				!speciesName.toLowerCase().includes('galarian') &&
				!speciesName.toLowerCase().includes('hisuian') &&
				!speciesName.toLowerCase().includes('paldean')
			) {
				const pokemonName = await getPokemonNameForSprite(speciesId, form)
				spriteName = formatSpeciesNameForSprite(pokemonName)
			}

			// For Gen 1-8: try pokesprite variants
			if (gen <= 8) {
				const baseUrl = 'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8'
				const folders = isShiny ? ['shiny', 'regular'] : ['regular']

				for (const folder of folders) {
					urls.push(`${baseUrl}/${folder}/${spriteName}.png`)
				}
			}

			// For Gen 9+: try pokemon-sprites variants
			else {
				const baseUrl = 'https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon'
				const folders = isShiny ? ['shiny', 'regular'] : ['regular']

				for (const folder of folders) {
					urls.push(`${baseUrl}/${folder}/${spriteName}.png`)
				}
			}

			return urls
		},
		[]
	)

	return {
		getBoxSpriteUrl,
		getBoxSpriteUrls,
	}
}
