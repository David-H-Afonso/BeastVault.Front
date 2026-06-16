import { PokemonCard } from '@/components/elements'
import { useUISettings } from '@/hooks'
import {
	CardBackgroundLabels,
	type CardBackgroundTypeName,
} from '@/models/enums/CardBackgroundTypes'
import { SPRITE_TYPE_CONFIG } from '@/models/enums/SpriteTypes'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'
import type { FC } from 'react'

interface Props {
	spriteURL: (isShiny: boolean) => string
	defaultPokemon: {
		id: number
		speciesId: number
		form: number
		formName: string
		canGigantamax: boolean
		speciesName: string
		nickname: string
		level: number
		isShiny: boolean
		favorite: boolean
		isEgg: boolean
		ballId: number
		heldItemId: number
		gender: number
		spriteKey: string
		originGeneration: number
		capturedGeneration: number
		hasMegaStone: boolean
	}[]
	backgroundOptions: CardBackgroundTypeName[]
	boxIconPreviewUrls: { bulbapedia: string; home: string }
}

const SettingComponent: FC<Props> = (props) => {
	const { defaultPokemon, spriteURL, backgroundOptions, boxIconPreviewUrls } = props
	const {
		backgroundType,
		setBackgroundType,
		spriteType,
		setSpriteType,
		boxIconStyle,
		setBoxIconStyle,
	} = useUISettings()

	return (
		<div className='settings-page'>
			<div className='settings-container'>
				<header className='settings-header'>
					<h1 className='settings-title'>
						<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
							<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
							<circle cx='12' cy='12' r='3' />
						</svg>
						Application Settings
					</h1>
					<p className='settings-description'>
						Configure your BeastVault experience to your preferences
					</p>
				</header>

				{/* Preview Section */}
				<section className='settings-section' style={{ marginBottom: '20px' }}>
					<h2 className='section-title'>
						<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
							<path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' />
							<circle cx='12' cy='12' r='3' />
						</svg>
						Preview
					</h2>
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
						<h2 className='section-title'>
							<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<rect width='18' height='18' x='3' y='3' rx='2' ry='2' />
								<circle cx='9' cy='9' r='2' />
								<path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' />
							</svg>
							Display Options
						</h2>
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

					{/* Box Icons */}
					<section className='settings-section'>
						<h2 className='section-title'>
							<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
								<path d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z' />
								<path d='m3.3 7 8.7 5 8.7-5' />
								<path d='M12 22V12' />
							</svg>
							Box Icons
						</h2>
						<div className='section-content'>
							<div className='ui-options-selector'>
								<div className='options-flex'>
									<div className='option-group'>
										<label className='option-label'>Icon style</label>
										<label className='settings-toggle'>
											<input
												type='checkbox'
												checked={boxIconStyle === 'bulbapedia'}
												onChange={(e) => setBoxIconStyle(e.target.checked ? 'bulbapedia' : 'home')}
											/>
											<span className='settings-toggle__track' />
											<span className='settings-toggle__label'>
												{boxIconStyle === 'bulbapedia'
													? 'Bulbapedia HOME icons'
													: 'PokeAPI HOME icons'}
											</span>
										</label>
									</div>
									<div className='option-group'>
										<label className='option-label'>Preview (Charizard)</label>
										<div className='settings-box-icon-preview'>
											<div
												className={`settings-box-icon-preview__item${boxIconStyle === 'bulbapedia' ? ' settings-box-icon-preview__item--active' : ''}`}>
												<img src={boxIconPreviewUrls.bulbapedia} alt='Bulbapedia HOME icon' />
												<small>Bulbapedia</small>
											</div>
											<div
												className={`settings-box-icon-preview__item${boxIconStyle === 'home' ? ' settings-box-icon-preview__item--active' : ''}`}>
												<img src={boxIconPreviewUrls.home} alt='PokeAPI HOME icon' />
												<small>PokeAPI HOME</small>
											</div>
										</div>
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

export default SettingComponent
