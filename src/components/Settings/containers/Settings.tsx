import '../components/Settings.scss'
import React from 'react'
import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'
import { CardBackgroundType, CardBackgroundLabels } from '@/models/enums/CardBackgroundTypes'
import { SPRITE_TYPE_CONFIG } from '@/models/enums/SpriteTypes'
import { useCardBackgroundType } from '@/hooks/useCardBackgroundType'
import { useSpriteType } from '@/hooks/useSpriteType'

const Settings: React.FC = () => {
	const { backgroundType, setBackgroundType } = useCardBackgroundType()
	const { spriteType, setSpriteType } = useSpriteType()

	const backgroundOptions = Object.values(CardBackgroundType) as CardBackgroundTypeName[]

	return (
		<div className='settings-page'>
			<div className='settings-container'>
				<header className='settings-header'>
					<h1 className='settings-title'>⚙️ Application Settings</h1>
					<p className='settings-description'>
						Configure your BeastVault experience to your preferences
					</p>
				</header>

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
