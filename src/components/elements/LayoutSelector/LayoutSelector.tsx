import React from 'react'
import { useLayout } from '../../../hooks/useLayout'
import type { LayoutType } from '../../../store/layoutSlice'
import './LayoutSelector.scss'

export const LayoutSelector: React.FC = () => {
	const { layoutType, setLayout } = useLayout()

	const layoutOptions: { value: LayoutType; label: string; description: string }[] = [
		{
			value: 'header',
			label: '📱 Header Layout',
			description: 'Navigation header always visible at the top',
		},
		{
			value: 'empty',
			label: '🖼️ Clean Layout',
			description: 'No persistent navigation, clean interface',
		},
	]

	return (
		<div className='layout-selector'>
			<div className='layout-selector__label'>
				<strong>Layout Type</strong>
				<small>Choose how the application interface is structured</small>
			</div>
			<div className='layout-selector__options'>
				{layoutOptions.map((option) => (
					<label
						key={option.value}
						className={`layout-selector__option ${
							layoutType === option.value ? 'layout-selector__option--active' : ''
						}`}>
						<input
							type='radio'
							name='layout'
							value={option.value}
							checked={layoutType === option.value}
							onChange={() => setLayout(option.value)}
							className='layout-selector__radio'
						/>
						<div className='layout-selector__content'>
							<div className='layout-selector__title'>{option.label}</div>
							<div className='layout-selector__description'>{option.description}</div>
						</div>
					</label>
				))}
			</div>
		</div>
	)
}
