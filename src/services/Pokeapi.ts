import type { PokeApiPokemon, PokeApiSprites } from '../models/Pokeapi'
import { simpleFetcher } from '../utils/simpleFetcher'
import { environment } from '../environments'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/'

/**
 * Fetches Pokémon data from PokeAPI by species ID and form with enhanced caching.
 * @param speciesId Pokémon species ID (e.g. 132 for Ditto)
 * @param form Form number (0 = base form, 1+ = alternate forms)
 * @param canGigantamax Whether this Pokemon can Gigantamax (affects naming)
 * @param hasMegaStone Whether this Pokemon has a Mega Stone equipped (affects naming)
 */
export async function getPokeApiPokemon(
	speciesId: number,
	form: number = 0,
	canGigantamax: boolean = false,
	hasMegaStone: boolean = false
): Promise<PokeApiPokemon> {
	// Special handling for Gigantamax Pokemon
	if (canGigantamax) {
		try {
			// First get the base Pokemon to know its name
			const baseUrl = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
			const basePokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(baseUrl)

			// Try to fetch the Gigantamax variant
			const gmaxName = `${basePokemon.name}-gmax`

			try {
				const gmaxUrl = `${POKEAPI_BASE_URL}pokemon/${gmaxName}`
				const gmaxPokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(gmaxUrl)
				return gmaxPokemon
			} catch (gmaxError) {
				// If Gigantamax variant doesn't exist, fall back to base form
				return basePokemon
			}
		} catch (error) {
			throw new Error(`Failed to fetch Pokemon ${speciesId} for Gigantamax: ${error}`)
		}
	}

	// Special handling for Mega Evolution Pokemon
	if (hasMegaStone && form > 0) {
		try {
			// First get the base Pokemon to know its name
			const baseUrl = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
			const basePokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(baseUrl)

			// Build mega form name based on the form number
			let megaSuffix = '-mega'

			// Special cases for Pokemon with multiple mega forms
			if (speciesId === 6) {
				// Charizard: form 1 = Mega X, form 2 = Mega Y
				megaSuffix = form === 1 ? '-mega-x' : '-mega-y'
			} else if (speciesId === 26) {
				// Raichu: form 1 = Mega X, form 2 = Mega Y (not Alola forms)
				megaSuffix = form === 1 ? '-mega-x' : '-mega-y'
			} else if (speciesId === 150) {
				// Mewtwo: form 1 = Mega X, form 2 = Mega Y
				megaSuffix = form === 1 ? '-mega-x' : '-mega-y'
			}

			// For mega evolutions, always use the base species name (not alternate forms like alola)
			const baseName = basePokemon.species.name
			const megaName = `${baseName}${megaSuffix}`

			try {
				const megaUrl = `${POKEAPI_BASE_URL}pokemon/${megaName}`
				const megaPokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(megaUrl)

				// Check if the mega form actually has sprites
				const megaSpriteUrl = getBestSpriteUrl(megaPokemon.sprites)
				if (megaSpriteUrl) {
					return megaPokemon
				}

				// Try custom fallback sprites if PokeAPI has none
				const customDefaultSprite = getCustomMegaSpriteUrl(megaName, false)
				const customShinySprite = getCustomMegaSpriteUrl(megaName, true) || customDefaultSprite

				if (customDefaultSprite) {
					console.warn(`Mega form ${megaName} missing sprites on PokeAPI, using custom fallback`)
					const patchedMegaPokemon: PokeApiPokemon = {
						...megaPokemon,
						sprites: {
							...megaPokemon.sprites,
							front_default: megaPokemon.sprites.front_default || customDefaultSprite,
							front_shiny: megaPokemon.sprites.front_shiny || customShinySprite,
							other: {
								...megaPokemon.sprites.other,
								['official-artwork']: {
									...megaPokemon.sprites.other?.['official-artwork'],
									front_default:
										megaPokemon.sprites.other?.['official-artwork']?.front_default ||
										customDefaultSprite,
									front_shiny:
										megaPokemon.sprites.other?.['official-artwork']?.front_shiny ||
										customShinySprite,
								},
								home: {
									...megaPokemon.sprites.other?.home,
									front_default:
										megaPokemon.sprites.other?.home?.front_default || customDefaultSprite,
									front_shiny: megaPokemon.sprites.other?.home?.front_shiny || customShinySprite,
								},
								showdown: {
									...megaPokemon.sprites.other?.showdown,
									front_default:
										megaPokemon.sprites.other?.showdown?.front_default || customDefaultSprite,
									front_shiny:
										megaPokemon.sprites.other?.showdown?.front_shiny || customShinySprite,
								},
								dream_world: {
									...megaPokemon.sprites.other?.dream_world,
									front_default:
										megaPokemon.sprites.other?.dream_world?.front_default || customDefaultSprite,
									front_female: megaPokemon.sprites.other?.dream_world?.front_female || undefined,
								},
							},
						},
					}

					return patchedMegaPokemon
				}

				console.warn(`Mega form ${megaName} has no sprites available, using base form`)
				return basePokemon
			} catch (megaError) {
				console.warn(`Failed to fetch mega form ${megaName}, falling back to base form:`, megaError)
				// If mega variant doesn't exist, fall back to base form
				return basePokemon
			}
		} catch (error) {
			throw new Error(`Failed to fetch Pokemon ${speciesId} for Mega Evolution: ${error}`)
		}
	}

	// For form 0 (base form), use the standard pokemon endpoint
	if (form === 0) {
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(url)
		return pokemon
	}

	// For alternate forms, try direct ID calculation first (most reliable)
	try {
		// Most Pokemon use a simple calculation: baseId + form
		// For example: Pikachu (25) has forms at 10025-10032 for different cosplay forms
		// Try standard form naming first
		const formId = Number(speciesId) + form * 10000

		try {
			const formUrl = `${POKEAPI_BASE_URL}pokemon/${formId}`
			const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(formUrl)
			return pokemon
		} catch {
			// If direct ID doesn't work, fall back to varieties lookup
			const speciesUrl = `${POKEAPI_BASE_URL}pokemon-species/${speciesId}`
			const speciesData = await simpleFetcher.fetchWithCache<any>(speciesUrl)
			const varieties = speciesData.varieties || []

			// Try to match by form index
			// Note: varieties array order may not match PKHeX form numbers
			if (varieties.length > form) {
				const varietyUrl = varieties[form].pokemon.url
				const pokemonId = varietyUrl.split('/').filter(Boolean).pop()
				const pokemonUrl = `${POKEAPI_BASE_URL}pokemon/${pokemonId}`
				const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(pokemonUrl)
				return pokemon
			}
		}

		// Fallback to base form if specific form not found
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(url)
		return pokemon
	} catch (error) {
		console.warn(
			`Failed to fetch form ${form} for species ${speciesId}, falling back to base form:`,
			error
		)
		// Fallback to base form
		const url = `${POKEAPI_BASE_URL}pokemon/${speciesId}`
		const pokemon = await simpleFetcher.fetchWithCache<PokeApiPokemon>(url)
		return pokemon
	}
}

/**
 * Fetches Pokéball icon from PokeAPI items endpoint
 *  * @param ballName Pokéball name (e.g., "Poké Ball", "Beast Ball")
 */
export async function getPokeBallIcon(ballName: string): Promise<string | null> {
	try {
		if (!ballName) {
			console.warn('Ball name is null or undefined')
			return null
		}

		// Convert ball name to URL-friendly format
		// "Poké Ball" -> "poke-ball", "Beast Ball" -> "beast-ball", etc.
		const urlFriendlyName = ballName
			.toLowerCase()
			.replace(/é/g, 'e') // Replace é with e
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/[^a-z0-9-]/g, '') // Remove any other non-alphanumeric characters except hyphens

		const itemUrl = `${POKEAPI_BASE_URL}item/${urlFriendlyName}`
		const itemData = await simpleFetcher.fetchWithCache<any>(itemUrl)
		const iconUrl = itemData?.sprites?.default || null

		return iconUrl
	} catch (error) {
		console.warn(`Failed to fetch pokeball icon for name ${ballName}:`, error)
		return null
	}
}

/**
 * Gets Tera type icon from external source (GitHub)
 * @param teraTypeName Tera type name (e.g., "Fire", "Water")
 */
export async function getTeraTypeIcon(teraTypeName: string): Promise<string | null> {
	if (!teraTypeName) {
		console.warn('Tera type name is null or undefined')
		return null
	}

	// Using icons from a reliable Pokemon resource
	const typeNameLower = teraTypeName.toLowerCase()
	const iconUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeNameLower}.png`

	return iconUrl
}

/**
 * Gets the best available sprite URL for a Pokémon from the PokeAPI response.
 * Prioritizes official artwork, then home, then default sprite.
 */
export function getBestSpriteUrl(sprites: PokeApiSprites, shiny = false): string | undefined {
	if (sprites.other?.['official-artwork']) {
		return shiny
			? sprites.other['official-artwork'].front_shiny ||
					sprites.other['official-artwork'].front_default
			: sprites.other['official-artwork'].front_default
	}
	if (sprites.other?.home) {
		return shiny
			? sprites.other.home.front_shiny || sprites.other.home.front_default
			: sprites.other.home.front_default
	}
	return shiny ? sprites.front_shiny : sprites.front_default
}

type CustomSpriteEntry = {
	default: string
	shiny?: string
}

// Place fallback sprites under BeastVault.Api/assets/ folder (backend serves them via /custom-sprites endpoint)
const CUSTOM_MEGA_SPRITES: Record<string, CustomSpriteEntry> = {
	// Legends Z-A Mega Evolutions
	'clefable-mega': {
		default: `${environment.baseUrl}/custom-sprites/36_mega-clefable_1760484025612.webp`,
	},
	'victreebel-mega': {
		default: `${environment.baseUrl}/custom-sprites/71_mega-victreebel_1760484123720.webp`,
	},
	'starmie-mega': {
		default: `${environment.baseUrl}/custom-sprites/121_mega-starmie_1760484135090.webp`,
	},
	'dragonite-mega': {
		default: `${environment.baseUrl}/custom-sprites/149_mega-dragonite_1760484143585.webp`,
	},
	'meganium-mega': {
		default: `${environment.baseUrl}/custom-sprites/154_mega-meganium_1760367015127.webp`,
	},
	'feraligatr-mega': {
		default: `${environment.baseUrl}/custom-sprites/160_mega-feraligatr_1760484150852.webp`,
	},
	'skarmory-mega': {
		default: `${environment.baseUrl}/custom-sprites/227_mega-skarmory_1760484157325.webp`,
	},
	'froslass-mega': {
		default: `${environment.baseUrl}/custom-sprites/478_mega-froslass_1760484163866.webp`,
	},
	'emboar-mega': {
		default: `${environment.baseUrl}/custom-sprites/500_mega-emboar_1760464599152.webp`,
	},
	'excadrill-mega': {
		default: `${environment.baseUrl}/custom-sprites/530_mega-excadrill_1760464624208.webp`,
	},
	'scolipede-mega': {
		default: `${environment.baseUrl}/custom-sprites/545_mega-scolipede_1760484189183.webp`,
	},
	'scrafty-mega': {
		default: `${environment.baseUrl}/custom-sprites/560_mega-scrafty_1760484177561.webp`,
	},
	'eelektross-mega': {
		default: `${environment.baseUrl}/custom-sprites/604_mega-eelektross_1760484195823.webp`,
	},
	'chandelure-mega': {
		default: `${environment.baseUrl}/custom-sprites/609_mega-chandelure_1760484203247.webp`,
	},
	'chesnaught-mega': {
		default: `${environment.baseUrl}/custom-sprites/652_mega-chesnaught_1760484209811.webp`,
	},
	'delphox-mega': {
		default: `${environment.baseUrl}/custom-sprites/655_mega-delphox_1760484216465.webp`,
	},
	'greninja-mega': {
		default: `${environment.baseUrl}/custom-sprites/658_mega-greninja_1757719243487.webp`,
	},
	'pyroar-mega': {
		default: `${environment.baseUrl}/custom-sprites/668_mega-pyroar_1760484223264.webp`,
	},
	'floette-mega': {
		default: `${environment.baseUrl}/custom-sprites/670_mega-eternal-floette_1765373045490.webp`,
	},
	'malamar-mega': {
		default: `${environment.baseUrl}/custom-sprites/687_mega-malamar_1757512139162.webp`,
	},
	'barbaracle-mega': {
		default: `${environment.baseUrl}/custom-sprites/689_mega-barbaracle_1760484231321.webp`,
	},
	'dragalge-mega': {
		default: `${environment.baseUrl}/custom-sprites/691_mega-dragalge_1760484237432.webp`,
	},
	'hawlucha-mega': {
		default: `${environment.baseUrl}/custom-sprites/701_mega-hawlucha_1756387839966.webp`,
	},
	'zygarde-mega': {
		default: `${environment.baseUrl}/custom-sprites/718_mega-complete-zygarde_1760367373383.webp`,
	},
	'drampa-mega': {
		default: `${environment.baseUrl}/custom-sprites/780_mega-drampa_1760367082784.webp`,
	},
	'falinks-mega': {
		default: `${environment.baseUrl}/custom-sprites/870_mega-falinks_1760484249620.webp`,
	},

	// Mega Dimension DLC Mega Evolutions
	'raichu-mega-x': {
		default: `${environment.baseUrl}/custom-sprites/26_26-mega-x_1765752742692.webp`,
	},
	'raichu-mega-y': {
		default: `${environment.baseUrl}/custom-sprites/26_26-mega-y_1765752750640.webp`,
	},
	'chimecho-mega': {
		default: `${environment.baseUrl}/custom-sprites/358_mega-chimecho_1765752770941.webp`,
	},
	'absol-mega': {
		default: `${environment.baseUrl}/custom-sprites/359_mega-absol-z_1765753377851.webp`,
	}, // Z-form
	'staraptor-mega': {
		default: `${environment.baseUrl}/custom-sprites/398_mega-staraptor_1765753169150.webp`,
	},
	'garchomp-mega': {
		default: `${environment.baseUrl}/custom-sprites/445_mega-garchomp-z_1765752806987.webp`,
	}, // Z-form
	'lucario-mega': {
		default: `${environment.baseUrl}/custom-sprites/448_mega-lucario-z_1765755593541.webp`,
	}, // Z-form
	'golurk-mega': {
		default: `${environment.baseUrl}/custom-sprites/623_mega-golurk_1765755623864.webp`,
	},
	'meowstic-mega': {
		default: `${environment.baseUrl}/custom-sprites/678_mega-meowstic_1765752824435.webp`,
	},
	'crabominable-mega': {
		default: `${environment.baseUrl}/custom-sprites/740_mega-crabominable_1765752840768.webp`,
	},
	'golisopod-mega': {
		default: `${environment.baseUrl}/custom-sprites/768_mega-golisopod_1765752868935.webp`,
	},
	'magearna-mega': {
		default: `${environment.baseUrl}/custom-sprites/801_mega-magearna_1765752905883.webp`,
	},
	'zeraora-mega': {
		default: `${environment.baseUrl}/custom-sprites/807_mega-zeraora_1765755637530.webp`,
	},
	'scovillain-mega': {
		default: `${environment.baseUrl}/custom-sprites/952_mega-scovillain_1765752946606.webp`,
	},
	'baxcalibur-mega': {
		default: `${environment.baseUrl}/custom-sprites/998_mega-baxcalibur_1765755840504.webp`,
	},
	'tatsugiri-mega': {
		default: `${environment.baseUrl}/custom-sprites/978_mega-tatsugiri-curly_1765755684330.webp`,
	},
	'glimmora-mega': {
		default: `${environment.baseUrl}/custom-sprites/970_mega-glimmora_1765752953521.webp`,
	},
	'heatran-mega': {
		default: `${environment.baseUrl}/custom-sprites/485_mega-heatran_1765808495163.webp`,
	},
	'darkrai-mega': {
		default: `${environment.baseUrl}/custom-sprites/491_mega-darkrai_1765755608419.webp`,
	},
}

function getCustomMegaSpriteUrl(megaName: string, shiny: boolean): string | undefined {
	const entry = CUSTOM_MEGA_SPRITES[megaName]
	if (!entry) return undefined
	if (shiny && entry.shiny) return entry.shiny
	return entry.default
}
