import type { PokemonListItemDto } from '@/models/api/types'
import { usePokeBallIcon } from '@/hooks/useCachedAssets'
import { usePokemonData } from '@/hooks/usePokemonData'
import { getTypeIconUrl } from '@/utils'
import { getTypeNameFromId } from '@/models/enums/PokemonTypes'
import { getBallNameFromId } from '@/models/enums/PokemonBalls'
import { useUISettings } from '@/hooks/useUISettings'
import { CardBackgroundType } from '@/models/enums/CardBackgroundTypes'
import { getComputedTypeColor } from '@/utils/typeColors'
import './PokemonCard.scss'
import { useEffect, useState } from 'react'

interface PokemonCardProps {
	pokemon: PokemonListItemDto
	sprite?: string
	onDelete: (id: number) => void
	onDownload: (id: number) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	loading?: boolean
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
	onManageTags,
	loading = false,
}: PokemonCardProps) {
	// Note: ballName and teraTypeName need to be retrieved from PokeAPI using IDs
	// Backend provides ballId and teraType (ID), not names
	const ballName = getBallNameFromId(pokemon.ballId)
	const { icon: ballIcon, loading: ballIconLoading } = usePokeBallIcon(ballName)

	// Get Pokemon information from consolidated hooks (only for types and colors)
	const {
		type1: finalType1,
		type2: finalType2,
		colors,
		loading: pokemonInfoLoading,
	} = usePokemonData(pokemon.speciesId, pokemon.form, pokemon.canGigantamax || false)

	// Use species name and form name directly from backend
	const speciesName = pokemon.speciesName
	const finalFormName = pokemon.formName

	// Get card background type preference
	const { backgroundType } = useUISettings()

	// Check if all essential data is loaded
	const [isDataLoading, setIsDataLoading] = useState(true)

	useEffect(() => {
		setIsDataLoading(pokemonInfoLoading || ballIconLoading || loading)
	}, [pokemonInfoLoading, ballIconLoading, loading])

	// Use PokeAPI data (types and form names come from consolidated hook)
	const type1Color = colors?.type1 || '#68A090'
	const type2Color = colors?.type2 || '#68A090'

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

		if (backgroundType !== CardBackgroundType.NO_TYPE_COLOR && !isDataLoading) {
			style['--type1-color'] = type1Color
			if (finalType2) {
				style['--type2-color'] = type2Color
			}
		}

		return style as React.CSSProperties
	}

	return (
		<>
			{isDataLoading ? (
				// Skeleton content with same structure
				<div className='pokemonCardModern pokemonCardSkeleton'>
					<div className='skeletonContent'>
						<div className='skeletonHeader'>
							<div className='skeletonActions'></div>
							<div className='skeletonBadge'></div>
						</div>
						<div className='skeletonImage'></div>
						<div className='skeletonInfo'>
							<div className='skeletonName'></div>
							<div className='skeletonTypes'></div>
						</div>
					</div>
				</div>
			) : (
				<div className={getCardClassName()} style={getCardStyle()}>
					{/* Card Header */}
					<div className='cardHeader'>
						<div className='cardActions'>
							<button
								className='actionBtn tagsBtn'
								onClick={() => onManageTags(pokemon)}
								title='Manage tags'
								disabled={loading}>
								<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
									<path d='M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h11c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z' />
								</svg>
							</button>
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
						{pokemon.capturedGeneration &&
							pokemon.capturedGeneration !== pokemon.originGeneration && (
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
								alt={pokemon.nickname || speciesName}
								className='pokemonSprite'
								loading='lazy'
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
									{ballIcon && <img src={ballIcon} alt='Pokeball' className='ballIconInline' />}
									<h3 className='pokemonName'>
										{pokemon.nickname || speciesName}
										{/* TODO: Gender information needs to be retrieved from PokeAPI or backend */}
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
									{/* TODO: Backend doesn't provide isEgg field */}
									{/*pokemon.isEgg && (
								<div className='infoItem eggItem'>
									<span className='infoIcon'>🥚</span>
									<span className='infoText'>Egg</span>
								</div>
							)*/}
								</div>
							</div>
						</div>

						{/* Types and Tera Type */}
						<div className='typesContainer'>
							<div className='pokemon-types'>
								{finalType1 && (
									<>
										<img
											src={getTypeIconUrl(finalType1)}
											alt={finalType1}
											className='typeIcon'
											style={{ maxWidth: '60px', maxHeight: '60px' }}
											onError={(e) => {
												// Hide image on error and just show text
												e.currentTarget.style.display = 'none'
												;(e.currentTarget.nextElementSibling as HTMLElement)!.style.display =
													'inline-block'
											}}
										/>
										<span
											className='typeBadge'
											style={{
												backgroundColor: type1Color,
												display: 'none', // Initially hidden, shown only if image fails
											}}>
											<span className='typeText'>{finalType1}</span>
										</span>
									</>
								)}
								{finalType2 && (
									<>
										<img
											src={getTypeIconUrl(finalType2)}
											alt={finalType2}
											className='typeIcon'
											style={{ maxWidth: '60px', maxHeight: '60px' }}
											onError={(e) => {
												// Hide image on error and just show text
												e.currentTarget.style.display = 'none'
												;(e.currentTarget.nextElementSibling as HTMLElement)!.style.display =
													'inline-block'
											}}
										/>
										<span
											className='typeBadge'
											style={{
												backgroundColor: type2Color,
												display: 'none', // Initially hidden, shown only if image fails
											}}>
											<span className='typeText'>{finalType2}</span>
										</span>
									</>
								)}
							</div>
							<div className='pokemon-teratypes'>
								{pokemon.teraType !== undefined && pokemon.teraType !== null && (
									<>
										<img
											src={getTypeIconUrl(getTypeNameFromId(pokemon.teraType))}
											alt={getTypeNameFromId(pokemon.teraType)}
											className='typeIcon'
											style={{ maxWidth: '60px', maxHeight: '60px' }}
											onError={(e) => {
												// Hide image on error and just show text
												e.currentTarget.style.display = 'none'
												;(e.currentTarget.nextElementSibling as HTMLElement)!.style.display =
													'inline-block'
											}}
										/>
										<span
											className='typeBadge'
											style={{
												backgroundColor: getComputedTypeColor(getTypeNameFromId(pokemon.teraType)),
												display: 'none', // Initially hidden, shown only if image fails
											}}>
											<span className='typeText'>{getTypeNameFromId(pokemon.teraType)}</span>
										</span>
									</>
								)}
							</div>
						</div>
					</div>{' '}
				</div>
			)}
		</>
	)
}
