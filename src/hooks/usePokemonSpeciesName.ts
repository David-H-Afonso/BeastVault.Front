import { useState, useEffect } from 'react'

// Cache for species names to avoid repeated API calls
const speciesNameCache = new Map<string, string>()

export function usePokemonSpeciesName(speciesId: number, form: number = 0) {
	const [speciesName, setSpeciesName] = useState<string>('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		// Create a unique cache key for species + form combination
		const cacheKey = `${speciesId}-${form}`

		// Check cache first
		if (speciesNameCache.has(cacheKey)) {
			setSpeciesName(speciesNameCache.get(cacheKey)!)
			return
		}

		// Set default to formatted ID while loading
		const defaultName = `#${speciesId.toString().padStart(3, '0')}`
		setSpeciesName(defaultName)

		// Fetch from PokeAPI
		const fetchSpeciesName = async () => {
			setLoading(true)
			try {
				// If form is 0 (normal form), use species endpoint
				if (form === 0) {
					const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`)
					if (response.ok) {
						const data = await response.json()
						// Get English name
						const englishName = data.names?.find((name: any) => name.language.name === 'en')
						if (englishName) {
							const name = englishName.name
							speciesNameCache.set(cacheKey, name)
							setSpeciesName(name)
						}
					}
				} else {
					// For regional forms, we need to get the Pokemon data first to find the form
					// First try to get the specific form name using a more direct approach
					let pokemonName = ''

					// Try direct Pokemon endpoint with form suffix
					const directFormResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
					if (directFormResponse.ok) {
						const directFormData = await directFormResponse.json()

						// Check if this Pokemon has multiple forms
						if (
							directFormData.forms &&
							directFormData.forms.length > 1 &&
							form < directFormData.forms.length
						) {
							// Get the specific form data
							const formResponse = await fetch(directFormData.forms[form].url)
							if (formResponse.ok) {
								const formData = await formResponse.json()
								const englishName = formData.names?.find((name: any) => name.language.name === 'en')
								if (englishName) {
									pokemonName = englishName.name
								} else {
									// Fallback to formatting the form name
									pokemonName = formData.name
										.split('-')
										.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ')
								}
							}
						} else {
							// Single form or invalid form index, use base Pokemon name
							pokemonName = directFormData.name
								.split('-')
								.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
								.join(' ')
						}
					}

					if (pokemonName) {
						speciesNameCache.set(cacheKey, pokemonName)
						setSpeciesName(pokemonName)
					}
				}
			} catch (error) {
				console.warn(`Failed to fetch species name for ID ${speciesId} form ${form}:`, error)
			} finally {
				setLoading(false)
			}
		}

		// Only fetch if we have a valid species ID
		if (speciesId > 0) {
			fetchSpeciesName()
		}
	}, [speciesId, form])

	return {
		speciesName,
		loading,
	}
}
