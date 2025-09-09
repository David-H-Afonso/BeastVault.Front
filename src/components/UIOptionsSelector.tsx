import React from 'react'
import { useCardBackgroundType } from '../hooks/useCardBackgroundType'
import { useSpriteType } from '../hooks/useSpriteType'
import { CardBackgroundType, CardBackgroundLabels } from '../enums/CardBackgroundTypes'
import { SPRITE_TYPE_CONFIG } from '../enums/SpriteTypes'
import type { CardBackgroundTypeName } from '../enums/CardBackgroundTypes'
import type { SpriteTypeName } from '../enums/SpriteTypes'
import './UIOptionsSelector.scss'

/**
 * Componente unificado para opciones de UI: fondo de cartas y tipo de sprites
 */
export const UIOptionsSelector: React.FC = () => {
	const { backgroundType, setBackgroundType } = useCardBackgroundType()
	const { spriteType, setSpriteType } = useSpriteType()

	const backgroundOptions = Object.values(CardBackgroundType) as CardBackgroundTypeName[]

	return (
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
	)
}

export default UIOptionsSelector
