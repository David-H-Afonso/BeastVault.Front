import type { PokemonListItemDto } from '../models/api/types'
import { usePokeBallIcon } from '../hooks/useCachedAssets'
import { usePokemonInfo } from '../hooks/usePokemonInfo'
import { useCorrectBoxSprite } from '../hooks/useCorrectBoxSprite'
import { usePokemonSpeciesName } from '../hooks/usePokemonSpeciesName'
import { getBallNameFromId } from '../enums/PokemonBalls'
import './PokemonListRow.scss'

interface PokemonListRowProps {
	pokemon: PokemonListItemDto
	sprite?: string
	onDelete: (id: number) => void
	onDownload: (id: number) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	loading?: boolean
}

export function PokemonListRow({
	pokemon,
	sprite,
	onDelete,
	onDownload,
	onManageTags,
	loading = false,
}: PokemonListRowProps) {
	const ballName = getBallNameFromId(pokemon.ballId)
	const { icon: ballIcon } = usePokeBallIcon(ballName)

	// Use the same system as PokemonCard for form info
	const { pokemonInfo } = usePokemonInfo(
		pokemon.speciesId,
		pokemon.form,
		pokemon.canGigantamax || false
	)

	// Get the base species name (form 0 to get the base name)
	const { speciesName } = usePokemonSpeciesName(pokemon.speciesId, 0)

	// Get the correct box sprite using the same system as the working views
	const { spriteUrl: boxSpriteUrl } = useCorrectBoxSprite(
		pokemon.speciesId,
		pokemon.form,
		pokemon.isShiny
	)

	// Create display name: construct full name like "Galarian Moltres"
	let fullSpeciesName = speciesName || `#${pokemon.speciesId.toString().padStart(3, '0')}`

	if (pokemonInfo.formName) {
		// Extract the regional prefix from form name (e.g., "Galarian Form" -> "Galarian")
		const formName = pokemonInfo.formName
		if (formName.includes('Alolan')) {
			fullSpeciesName = `Alolan ${speciesName}`
		} else if (formName.includes('Galarian')) {
			fullSpeciesName = `Galarian ${speciesName}`
		} else if (formName.includes('Hisuian')) {
			fullSpeciesName = `Hisuian ${speciesName}`
		} else if (formName.includes('Paldean')) {
			fullSpeciesName = `Paldean ${speciesName}`
		} else if (formName.includes('Mega')) {
			fullSpeciesName = `Mega ${speciesName}`
		} else {
			// For other forms, show the form name after the species
			fullSpeciesName = `${speciesName} (${formName})`
		}
	}

	// Only show nickname if it's different from the constructed species name
	const shouldShowNickname =
		pokemon.nickname &&
		pokemon.nickname.toLowerCase() !== fullSpeciesName.toLowerCase() &&
		pokemon.nickname.toLowerCase() !== speciesName?.toLowerCase()

	return (
		<div className='pokemon-list-row'>
			{/* Left side: Sprite and basic info */}
			<div className='row-left'>
				{/* Pokemon sprite */}
				<div className='sprite-container'>
					{boxSpriteUrl ? (
						<img
							src={boxSpriteUrl}
							alt={pokemon.nickname || fullSpeciesName}
							className='pokemon-sprite'
							onError={(e) => {
								// Fallback to original sprite if box sprite fails
								if (sprite && e.currentTarget.src !== sprite) {
									e.currentTarget.src = sprite
								}
							}}
						/>
					) : sprite ? (
						<img
							src={sprite}
							alt={pokemon.nickname || fullSpeciesName}
							className='pokemon-sprite'
						/>
					) : (
						<div className='no-sprite'>⚙️</div>
					)}
					{pokemon.isShiny && <div className='shiny-indicator'>✨</div>}
				</div>

				{/* Pokemon info */}
				<div className='pokemon-info'>
					<div className='name-section'>
						<span className='species-name'>{fullSpeciesName}</span>
						{shouldShowNickname && <span className='nickname'>({pokemon.nickname})</span>}
					</div>

					<div className='details-section'>
						{ballIcon && <img src={ballIcon} alt='Ball' className='ball-icon' />}
						<span className='level'>Lv. {pokemon.level}</span>

						{pokemon.originGeneration && (
							<span className='generation'>Gen {pokemon.originGeneration}</span>
						)}

						{pokemon.capturedGeneration &&
							pokemon.capturedGeneration !== pokemon.originGeneration && (
								<span className='generation captured'>
									Caught: Gen {pokemon.capturedGeneration}
								</span>
							)}
					</div>
				</div>
			</div>

			{/* Right side: Actions */}
			<div className='row-actions'>
				<button
					className='action-btn tags-btn'
					onClick={() => onManageTags(pokemon)}
					title='Manage Tags'
					disabled={loading}>
					🏷️
				</button>
				<button
					className='action-btn download-btn'
					onClick={() => onDownload(pokemon.id)}
					title='Download'
					disabled={loading}>
					📥
				</button>
				<button
					className='action-btn delete-btn'
					onClick={() => onDelete(pokemon.id)}
					title='Delete'
					disabled={loading}>
					🗑️
				</button>
			</div>
		</div>
	)
}
