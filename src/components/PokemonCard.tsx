import type { PokemonListItemDto } from '../models/Pokemon'
import { usePokeBallIcon } from '../hooks/useCachedAssets'
import { usePokemonInfo } from '../hooks/usePokemonInfo'
import { getTypeIconUrl } from '../services/Pokeapi'
import { getTypeNameFromId } from '../enums/PokemonTypes'
import { useCardBackgroundType } from '../hooks/useCardBackgroundType'
import { CardBackgroundType } from '../enums/CardBackgroundTypes'
import './PokemonCard.scss'

interface PokemonCardProps {
	pokemon: PokemonListItemDto
	sprite?: string
	onDelete: (id: number) => void
	onDownload: (id: number) => void
	loading?: boolean
}

// Helper to get gender symbol
function getGenderSymbol(gender?: number): string {
	switch (gender) {
		case 0:
			return '♂' // Male
		case 1:
			return '♀' // Female
		default:
			return '' // Genderless or unknown
	}
}

// Helper to get gender color
function getGenderColor(gender?: number): string {
	switch (gender) {
		case 0:
			return '#6890F0' // Blue for male
		case 1:
			return '#EE99AC' // Pink for female
		default:
			return '#68A090' // Neutral for genderless
	}
}

// Helper to get type class name for CSS
function getTypeClassName(type: string): string {
	return `type${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}`
}

export function PokemonCard({
	pokemon,
	sprite,
	onDelete,
	onDownload,
	loading = false,
}: PokemonCardProps) {
	// Use the cached pokeball icon hook
	const { icon: ballIcon } = usePokeBallIcon(pokemon.ballName || '')

	// Get Pokemon information from PokeAPI cache (types and form)
	const { pokemonInfo } = usePokemonInfo(
		pokemon.pokedexNumber || pokemon.speciesId, 
		pokemon.form,
		pokemon.canGigantamax || false
	)

	// Get card background type preference
	const { backgroundType } = useCardBackgroundType()

	// Use PokeAPI data if available, otherwise fallback to backend data
	const finalType1 = pokemonInfo.type1 || pokemon.type1
	const finalType2 = pokemonInfo.type2 || pokemon.type2
	const finalFormName = pokemonInfo.formName || pokemon.formName
	const type1Color = pokemonInfo.colors.type1 || '#68A090'
	const type2Color = pokemonInfo.colors.type2 || '#68A090'	// Helper function for getting type colors (for tera types that don't use PokeAPI)
	const getTypeColor = (typeName: string): string => {
		switch (typeName.toLowerCase()) {
			case 'normal':
				return '#A8A878'
			case 'fire':
				return '#F08030'
			case 'water':
				return '#6890F0'
			case 'electric':
				return '#F8D030'
			case 'grass':
				return '#78C850'
			case 'ice':
				return '#98D8D8'
			case 'fighting':
				return '#C03028'
			case 'poison':
				return '#A040A0'
			case 'ground':
				return '#E0C068'
			case 'flying':
				return '#A890F0'
			case 'psychic':
				return '#F85888'
			case 'bug':
				return '#A8B820'
			case 'rock':
				return '#B8A038'
			case 'ghost':
				return '#705898'
			case 'dragon':
				return '#7038F8'
			case 'dark':
				return '#705848'
			case 'steel':
				return '#B8B8D0'
			case 'fairy':
				return '#EE99AC'
			default:
				return '#68A090'
		}
	}

	// Generate CSS class and style for dual type borders
	const getCardClassName = () => {
		let className = 'pokemonCardModern'

		// Add background type class
		className += ` background-${backgroundType}`

		if (finalType1) {
			className += ` ${getTypeClassName(finalType1)}`
		}
		if (finalType2 && backgroundType !== CardBackgroundType.NO_TYPE_COLOR) {
			className += ' dualType'
		}
		return className
	}

	const getCardStyle = () => {
		const style: Record<string, string> = {}

		if (backgroundType !== CardBackgroundType.NO_TYPE_COLOR) {
			style['--type1-color'] = type1Color
			if (finalType2) {
				style['--type2-color'] = type2Color
			}
		}

		return style as React.CSSProperties
	}

	return (
		<div className={getCardClassName()} style={getCardStyle()}>
			{/* Card Header */}
			<div className='cardHeader'>
				<div className='cardActions'>
					<button
						className='actionBtn downloadBtn'
						onClick={() => onDownload(pokemon.id)}
						title='Download original file'
						disabled={loading}>
						<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z' />
						</svg>
					</button>
					<button
						className='actionBtn deleteBtn'
						onClick={() => onDelete(pokemon.id)}
						title='Delete Pokémon'
						disabled={loading}>
						<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
						</svg>
					</button>
				</div>

				<div className='cardHeaderGenInfo'>
					{/* Pokedex number */}
					{pokemon.speciesId && (
						<div className='pokedexBadge'>#{pokemon.speciesId.toString().padStart(3, '0')}</div>
					)}
				</div>
			</div>

			{/* Generation badges */}
			<div className='generationBadges'>
				{pokemon.originGeneration && (
					<div className='generationBadge originBadge'>
						<span className='badgeLabel'>Origin</span>
						<span className='badgeValue'>Gen {pokemon.originGeneration}</span>
					</div>
				)}
				{pokemon.capturedGeneration && pokemon.capturedGeneration !== pokemon.originGeneration && (
					<div className='generationBadge captureBadge'>
						<span className='badgeValue'>Gen {pokemon.capturedGeneration}</span>
					</div>
				)}
			</div>

			{/* Pokemon Image */}
			<div className='pokemonImageContainer'>
				{sprite ? (
					<img
						src={sprite}
						alt={pokemon.nickname || pokemon.speciesName || 'Pokemon'}
						className='pokemonSprite'
					/>
				) : (
					<div className='noImage'>
						<span>⚙️</span>
					</div>
				)}

				{/* Shiny indicator */}
				{pokemon.isShiny && (
					<div className='shinyIndicator' title='Shiny Pokemon'>
						✨
					</div>
				)}
			</div>

			{/* Pokemon Info */}
			<div className='pokemonInfoContainer'>
				{/* Name, Ball and Level */}
				<div className='nameSection'>
					<div className='nameContainer'>
						<div className='nameAndBall'>
							{ballIcon && <img src={ballIcon} alt={pokemon.ballName} className='ballIconInline' />}
							<h3 className='pokemonName'>
								{pokemon.nickname || pokemon.speciesName || 'No Name'}
								{pokemon.gender !== undefined && (
									<span className='genderSymbol' style={{ color: getGenderColor(pokemon.gender) }}>
										{getGenderSymbol(pokemon.gender)}
									</span>
								)}
							</h3>
						</div>
						<div className='levelBadge'>Lv. {pokemon.level}</div>
					</div>

					<div className='additionalNameContainer'>
						{/* Additional Info */}
						<div className='additionalInfo'>
							{/* Form */}
							{finalFormName && (
								<div className='infoItem'>
									<span className='infoText'>{finalFormName}</span>
								</div>
							)}

							{/* Egg indicator */}
							{pokemon.isEgg && (
								<div className='infoItem eggItem'>
									<span className='infoIcon'>🥚</span>
									<span className='infoText'>Egg</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Types and Tera Type */}
				<div className='typesContainer'>
					<div className='pokemon-types'>
						{finalType1 && (
							<span className='typeBadge' style={{ backgroundColor: type1Color }}>
								<img
									src={getTypeIconUrl(finalType1)}
									alt={finalType1}
									className='typeIcon'
									onError={(e) => {
										// Hide image on error and just show text
										e.currentTarget.style.display = 'none'
									}}
								/>
								<span className='typeText'>{finalType1}</span>
							</span>
						)}
						{finalType2 && (
							<span className='typeBadge' style={{ backgroundColor: type2Color }}>
								<img
									src={getTypeIconUrl(finalType2)}
									alt={finalType2}
									className='typeIcon'
									onError={(e) => {
										// Hide image on error and just show text
										e.currentTarget.style.display = 'none'
									}}
								/>
								<span className='typeText'>{finalType2}</span>
							</span>
						)}
					</div>
					<div className='pokemon-teratypes'>
						{pokemon.teraType !== undefined && pokemon.teraType !== null && (
							<span
								className='teraTypeBadge'
								style={{ backgroundColor: getTypeColor(getTypeNameFromId(pokemon.teraType)) }}>
								<img
									src={getTypeIconUrl(getTypeNameFromId(pokemon.teraType))}
									alt={getTypeNameFromId(pokemon.teraType)}
									className='typeIcon'
									onError={(e) => {
										// Hide image on error and just show text
										e.currentTarget.style.display = 'none'
									}}
								/>
								<span className='typeText'>{getTypeNameFromId(pokemon.teraType)}</span>
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
