import React from 'react';
import { useTheme, type ThemeType } from '../services/ThemeService';

interface ThemeSelectorProps {
	className?: string;
	showLabels?: boolean;
	compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
	className = '',
	showLabels = true,
	compact = false
}) => {
	const { currentTheme, availableThemes, changeTheme, cycleTheme } = useTheme();

	const handleThemeChange = (themeId: ThemeType) => {
		changeTheme(themeId);
	};

	if (compact) {
		return (
			<button
				onClick={cycleTheme}
				className={`theme-cycle-button ${className}`}
				title={`Tema actual: ${availableThemes.find(t => t.id === currentTheme)?.name}. Clic para cambiar.`}
			>
				🎨
			</button>
		);
	}

	return (
		<div className={`theme-selector ${className}`}>
			{showLabels && (
				<label className="theme-selector-label">
					Tema:
				</label>
			)}
			<div className="theme-options">
				{availableThemes.map((theme) => (
					<button
						key={theme.id}
						onClick={() => handleThemeChange(theme.id)}
						className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
						title={theme.description}
						data-theme={theme.id}
					>
						{showLabels ? theme.name : getThemeIcon(theme.id)}
					</button>
				))}
			</div>
		</div>
	);
};

function getThemeIcon(themeId: ThemeType): string {
	const icons: Record<ThemeType, string> = {
		dark: '🌙',
		light: '☀️',
		pokemon: '⚡',
		water: '💧',
		fire: '🔥',
		grass: '🌿',
		electric: '⚡',
		psychic: '🔮'
	};
	return icons[themeId] || '🎨';
}

export default ThemeSelector;
