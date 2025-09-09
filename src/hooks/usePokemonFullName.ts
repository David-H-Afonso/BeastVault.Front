import { useState, useEffect } from 'react'

// Cache for species names
const nameCache = new Map<string, string>()

export function usePokemonFullName(speciesId: number, form: number = 0) {
	const [fullName, setFullName] = useState<string>('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		const cacheKey = `${speciesId}-${form}`

		// Check cache first
		if (nameCache.has(cacheKey)) {
			setFullName(nameCache.get(cacheKey)!)
			return
		}

		const loadName = async () => {
			setLoading(true)
			try {
				console.log(`Loading name for speciesId: ${speciesId}, form: ${form}`)
				let finalName = ''

				// For form 0, get the base species name
				if (form === 0) {
					const speciesResponse = await fetch(
						`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`
					)
					if (speciesResponse.ok) {
						const speciesData = await speciesResponse.json()
						const englishName = speciesData.names?.find((name: any) => name.language.name === 'en')
						finalName = englishName?.name || speciesData.name
						console.log(`Base species name: ${finalName}`)
					}
				} else {
					// For forms > 0, we need to find the specific Pokemon variant
					console.log(`Looking for form ${form} of species ${speciesId}`)

					// First, try the species endpoint to get all varieties
					const speciesResponse = await fetch(
						`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`
					)
					if (speciesResponse.ok) {
						const speciesData = await speciesResponse.json()
						console.log(`Species data varieties:`, speciesData.varieties)

						const baseEnglishName = speciesData.names?.find(
							(name: any) => name.language.name === 'en'
						)
						const baseName = baseEnglishName?.name || speciesData.name
						console.log(`Base name: ${baseName}`)

						// Look for varieties (regional forms)
						if (speciesData.varieties && speciesData.varieties.length > form) {
							const variety = speciesData.varieties[form]
							console.log(`Found variety:`, variety)

							const pokemonResponse = await fetch(variety.pokemon.url)
							if (pokemonResponse.ok) {
								const pokemonData = await pokemonResponse.json()
								const pokemonName = pokemonData.name
								console.log(`Pokemon name from variety: ${pokemonName}`)

								// Parse the Pokemon name to construct proper display name
								if (pokemonName.includes('-')) {
									const parts = pokemonName.split('-')
									if (parts.length >= 2) {
										const formPart = parts[1]
										console.log(`Form part: ${formPart}`)

										switch (formPart.toLowerCase()) {
											case 'alola':
												finalName = `Alolan ${baseName}`
												break
											case 'galar':
												finalName = `Galarian ${baseName}`
												break
											case 'hisui':
												finalName = `Hisuian ${baseName}`
												break
											case 'paldea':
												finalName = `Paldean ${baseName}`
												break
											case 'mega':
												finalName = `Mega ${baseName}`
												break
											default:
												finalName = baseName
										}
										console.log(`Constructed name: ${finalName}`)
									}
								} else {
									finalName = baseName
								}
							}
						} else {
							console.log(`No varieties found or form index out of range`)
							finalName = baseName
						}
					}
				}

				// Final fallback
				if (!finalName) {
					finalName = `#${speciesId.toString().padStart(3, '0')}`
				}

				console.log(`Final name: ${finalName}`)
				nameCache.set(cacheKey, finalName)
				setFullName(finalName)
			} catch (error) {
				console.warn(`Error loading Pokemon name for ${speciesId}:`, error)
				const fallback = `#${speciesId.toString().padStart(3, '0')}`
				setFullName(fallback)
			} finally {
				setLoading(false)
			}
		}

		if (speciesId > 0) {
			loadName()
		}
	}, [speciesId, form])

	return { fullName, loading }
}
