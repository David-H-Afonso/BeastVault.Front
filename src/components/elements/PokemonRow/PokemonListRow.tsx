import type { PokemonListItemDto } from '../../../models/api/types'
import { usePokeBallIcon } from '../../../hooks/useCachedAssets'
import { getBallNameFromId } from '../../../models/enums/PokemonBalls'
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

	// Use species name and form name directly from backend - no API calls needed!
	const speciesName = pokemon.speciesName
	const formName = pokemon.formName

	let fullSpeciesName = speciesName

	// Handle forms using the backend formName
	if (formName) {
		const formNameLower = formName.toLowerCase()
		// Handle different form naming patterns
		if (formNameLower.includes('gigantamax') || pokemon.canGigantamax) {
			fullSpeciesName = `Gigantamax ${speciesName}`
		} else if (formNameLower.includes('mega')) {
			fullSpeciesName = `Mega ${speciesName}`
		} else if (['galar', 'galarian'].some((term) => formNameLower.includes(term))) {
			fullSpeciesName = `Galarian ${speciesName}`
		} else if (['alola', 'alolan'].some((term) => formNameLower.includes(term))) {
			fullSpeciesName = `Alolan ${speciesName}`
		} else if (['hisui', 'hisuian'].some((term) => formNameLower.includes(term))) {
			fullSpeciesName = `Hisuian ${speciesName}`
		} else if (['paldea', 'paldean'].some((term) => formNameLower.includes(term))) {
			fullSpeciesName = `Paldean ${speciesName}`
		} else {
			// For other forms like "Crowned", "Dada", etc., show as suffix
			fullSpeciesName = `${speciesName} (${formName})`
		}
	}

	// Only show nickname if it's different from the species name
	const shouldShowNickname =
		pokemon.nickname &&
		fullSpeciesName &&
		speciesName &&
		pokemon.nickname.toLowerCase() !== fullSpeciesName.toLowerCase() &&
		pokemon.nickname.toLowerCase() !== speciesName.toLowerCase()

	return (
		<div className='pokemon-list-row'>
			{/* Left side: Sprite and basic info */}
			<div className='row-left'>
				{/* Pokemon sprite */}
				<div className='sprite-container'>
					{sprite && (
						<img
							src={sprite}
							alt={pokemon.nickname || fullSpeciesName}
							className='pokemon-sprite'
						/>
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
