import { useUISettings } from '@/hooks/useUISettings'
import './ThemeSelector.scss'
import type { ThemeName } from '@/models/store/StylesSetting'

const AVAILABLE_THEMES: ThemeName[] = ['dark', 'home']
const THEME_LABELS: Record<ThemeName, string> = {
	dark: 'Dark',
	home: 'Home',
}

export const ThemeSelector = () => {
	const { currentTheme, setTheme } = useUISettings()

	return (
		<div className='theme-menu' role='group' aria-label='Theme'>
			<span className='theme-menu__label'>Theme</span>
			{AVAILABLE_THEMES.map((theme) => {
				const active = theme === currentTheme
				return (
					<button
						key={theme}
						type='button'
						role='menuitemradio'
						aria-checked={active}
						data-theme-option={theme}
						className={`theme-menu__option${active ? ' is-active' : ''}`}
						onClick={() => setTheme(theme)}>
						<span
							className={`theme-menu__swatch theme-menu__swatch--${theme}`}
							aria-hidden='true'
						/>
						<span className='theme-menu__name'>{THEME_LABELS[theme]}</span>
						{active && (
							<svg
								className='theme-menu__check'
								width='16'
								height='16'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.5'
								strokeLinecap='round'
								strokeLinejoin='round'
								aria-hidden='true'>
								<polyline points='20 6 9 17 4 12' />
							</svg>
						)}
					</button>
				)
			})}
		</div>
	)
}
