import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import './ThemeSelector.scss'
import type { ThemeName } from '@/models/store/StylesSetting'

const AVAILABLE_THEMES: ThemeName[] = [
	'dark',
	'light',
	'pokemon',
	'water',
	'fire',
	'grass',
	'electric',
	'psychic',
]

interface ThemeSelectorProps {
	compact?: boolean
}

export const ThemeSelector = ({ compact = false }: ThemeSelectorProps) => {
	const { currentTheme, setTheme } = useTheme()
	const [isOpen, setIsOpen] = useState(false)

	const handleThemeChange = (theme: ThemeName) => {
		setTheme(theme)
		setIsOpen(false)
	}

	const cycleTheme = () => {
		const currentIndex = AVAILABLE_THEMES.indexOf(currentTheme)
		const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length
		setTheme(AVAILABLE_THEMES[nextIndex])
	}

	if (compact) {
		return (
			<button
				className='theme-selector-compact'
				onClick={cycleTheme}
				title={`Current theme: ${currentTheme}. Click to cycle themes.`}
				aria-label={`Current theme: ${currentTheme}. Click to cycle themes.`}>
				<div className={`theme-preview theme-preview--${currentTheme}`} />
			</button>
		)
	}

	return (
		<div className='theme-selector'>
			<button
				className='theme-selector__trigger'
				onClick={() => setIsOpen(!isOpen)}
				aria-label='Open theme selector'>
				<div className={`theme-preview theme-preview--${currentTheme}`} />
				<span className='theme-selector__label'>Theme</span>
				<span className={`theme-selector__arrow ${isOpen ? 'theme-selector__arrow--open' : ''}`}>
					▼
				</span>
			</button>

			{isOpen && (
				<div className='theme-selector__dropdown'>
					{AVAILABLE_THEMES.map((theme) => (
						<button
							key={theme}
							className={`theme-selector__option ${
								theme === currentTheme ? 'theme-selector__option--active' : ''
							}`}
							onClick={() => handleThemeChange(theme)}>
							<div className={`theme-preview theme-preview--${theme}`} />
							<span className='theme-selector__option-label'>
								{theme.charAt(0).toUpperCase() + theme.slice(1)}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
