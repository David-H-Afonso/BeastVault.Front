import '../components/Settings.scss'
import React from 'react'
import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'
import { CardBackgroundType, CardBackgroundLabels } from '@/models/enums/CardBackgroundTypes'
import { SPRITE_TYPE_CONFIG } from '@/models/enums/SpriteTypes'
import { useUISettings } from '@/hooks/useUISettings'
import { PokemonCard } from '@/components/elements'
import { getBestSpriteByType } from '@/utils'

const CHARIZARD_DEFAULT_SPRITES = {
	back_default:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
	back_shiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/6.png',
	default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
	dreamWorld:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/6.svg',
	githubRegular:
		'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/charizard.png',
	githubShiny:
		'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/shiny/charizard.png',
	home: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/6.png',
	homeShiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/6.png',
	official:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
	officialShiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/6.png',
	shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/6.png',
	showdown:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif',
	showdownShiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/6.gif',
}

const CHARIZARD_DEFAULT_VALUES = {
	id: 6,
	speciesId: 6,
	form: 0,
	formName: 'Standard',
	canGigantamax: false,
	speciesName: 'Charizard',
	nickname: 'Charizard',
	level: 100,
	isShiny: false,
	ballId: 0,
	spriteKey: '1025_n_0',
	originGeneration: 1,
	capturedGeneration: 9,
	hasMegaStone: true,
}

const Settings: React.FC = () => {
	const { backgroundType, setBackgroundType, spriteType, setSpriteType } = useUISettings()

	const backgroundOptions = Object.values(CardBackgroundType) as CardBackgroundTypeName[]

	const defaultPokemon = [
		{
			...CHARIZARD_DEFAULT_VALUES,
		},
		{
			...CHARIZARD_DEFAULT_VALUES,
			isShiny: true,
		},
	]
	const spriteURL = (isShiny: boolean) =>
		getBestSpriteByType(CHARIZARD_DEFAULT_SPRITES, spriteType, isShiny) || ''

	return (
		<div className='settings-page'>
			<div className='settings-container'>
				<header className='settings-header'>
					<h1 className='settings-title'>⚙️ Application Settings</h1>
					<p className='settings-description'>
						Configure your BeastVault experience to your preferences
					</p>
				</header>

				{/* Preview Section */}
				<section className='settings-section' style={{ marginBottom: '20px' }}>
					<h2 className='section-title'>👁️ Preview</h2>
					<div className='section-content' style={{ gap: '20px', display: 'flex' }}>
						{defaultPokemon.map((pokemon, index) => (
							<PokemonCard
								key={index}
								pokemon={pokemon}
								sprite={spriteURL(pokemon.isShiny)}
								onDownload={() => {}}
								onDelete={() => {}}
								onManageTags={() => {}}
							/>
						))}
					</div>
				</section>

				<div className='settings-content'>
					{/* Display Options */}
					<section className='settings-section'>
						<h2 className='section-title'>🖼️ Display Options</h2>
						<div className='section-content'>
							<div className='ui-options-selector'>
								<div className='options-flex'>
									{/* Card Background Selector */}
									<div className='option-group'>
										<label className='option-label' htmlFor='background-select'>
											Cards style
										</label>
										<select
											id='background-select'
											className='option-select'
											value={backgroundType}
											onChange={(e) => setBackgroundType(e.target.value as CardBackgroundTypeName)}>
											{backgroundOptions.map((option) => (
												<option key={option} value={option}>
													{CardBackgroundLabels[option]}
												</option>
											))}
										</select>
									</div>

									{/* Sprite Type Selector */}
									<div className='option-group'>
										<label className='option-label' htmlFor='option-select'>
											Pokemon Images
										</label>
										<select
											id='option-select'
											className='option-select'
											value={spriteType}
											onChange={(e) => setSpriteType(e.target.value as SpriteTypeName)}>
											{Object.entries(SPRITE_TYPE_CONFIG).map(([type, config]) => (
												<option key={type} value={type}>
													{config.name}
												</option>
											))}
										</select>
									</div>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}

export default Settings
