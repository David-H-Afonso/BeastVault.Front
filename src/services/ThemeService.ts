/**
 * Beast Vault - Theme Service
 * ===========================
 * 
 * Servicio para gestionar el cambio de temas dinámicamente
 */

export type ThemeType = 
	| 'dark' 
	| 'light' 
	| 'pokemon' 
	| 'water' 
	| 'fire' 
	| 'grass' 
	| 'electric' 
	| 'psychic';

export interface ThemeConfig {
	id: ThemeType;
	name: string;
	description: string;
	preview?: string; // URL de imagen de preview opcional
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
	{
		id: 'dark',
		name: 'Oscuro',
		description: 'Tema oscuro por defecto'
	},
	{
		id: 'light',
		name: 'Claro',
		description: 'Tema claro moderno'
	},
	{
		id: 'pokemon',
		name: 'Pokemon',
		description: 'Inspirado en los juegos Pokemon'
	},
	{
		id: 'water',
		name: 'Agua',
		description: 'Inspirado en Pokemon tipo Agua'
	},
	{
		id: 'fire',
		name: 'Fuego',
		description: 'Inspirado en Pokemon tipo Fuego'
	},
	{
		id: 'grass',
		name: 'Hierba',
		description: 'Inspirado en Pokemon tipo Hierba'
	},
	{
		id: 'electric',
		name: 'Eléctrico',
		description: 'Inspirado en Pokemon tipo Eléctrico'
	},
	{
		id: 'psychic',
		name: 'Psíquico',
		description: 'Inspirado en Pokemon tipo Psíquico'
	}
];

class ThemeService {
	private currentTheme: ThemeType = 'dark';
	private readonly STORAGE_KEY = 'beastvault_theme';

	constructor() {
		this.loadSavedTheme();
	}

	/**
	 * Obtiene el tema actual
	 */
	getCurrentTheme(): ThemeType {
		return this.currentTheme;
	}

	/**
	 * Cambia el tema de la aplicación
	 */
	setTheme(theme: ThemeType): void {
		// Remover tema anterior del documento
		this.removeThemeFromDocument();
		
		// Aplicar nuevo tema
		this.currentTheme = theme;
		this.applyThemeToDocument();
		
		// Guardar en localStorage
		this.saveTheme();
		
		// Disparar evento personalizado para notificar el cambio
		window.dispatchEvent(new CustomEvent('themeChanged', { 
			detail: { theme } 
		}));
	}

	/**
	 * Cambia al siguiente tema disponible
	 */
	cycleTheme(): void {
		const currentIndex = AVAILABLE_THEMES.findIndex(t => t.id === this.currentTheme);
		const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
		this.setTheme(AVAILABLE_THEMES[nextIndex].id);
	}

	/**
	 * Obtiene la configuración del tema actual
	 */
	getCurrentThemeConfig(): ThemeConfig {
		return AVAILABLE_THEMES.find(t => t.id === this.currentTheme) || AVAILABLE_THEMES[0];
	}

	/**
	 * Verifica si un tema está disponible
	 */
	isThemeAvailable(theme: string): boolean {
		return AVAILABLE_THEMES.some(t => t.id === theme);
	}

	/**
	 * Detecta el tema preferido del sistema
	 */
	getSystemPreferredTheme(): 'dark' | 'light' {
		if (typeof window !== 'undefined' && window.matchMedia) {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		return 'dark';
	}

	/**
	 * Usa el tema preferido del sistema si no hay uno guardado
	 */
	useSystemTheme(): void {
		const systemTheme = this.getSystemPreferredTheme();
		this.setTheme(systemTheme);
	}

	// Métodos privados

	private applyThemeToDocument(): void {
		const documentElement = document.documentElement;
		
		// Limpiar clases de tema anteriores
		documentElement.classList.remove(
			...AVAILABLE_THEMES.map(t => `theme-${t.id}`)
		);
		
		// Aplicar nueva clase de tema y atributo data-theme
		if (this.currentTheme !== 'dark') {
			documentElement.classList.add(`theme-${this.currentTheme}`);
			documentElement.setAttribute('data-theme', this.currentTheme);
		} else {
			// El tema oscuro es el por defecto, no necesita clase adicional
			documentElement.removeAttribute('data-theme');
		}
	}

	private removeThemeFromDocument(): void {
		const documentElement = document.documentElement;
		documentElement.classList.remove(
			...AVAILABLE_THEMES.map(t => `theme-${t.id}`)
		);
		documentElement.removeAttribute('data-theme');
	}

	private saveTheme(): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
		} catch (error) {
			console.warn('No se pudo guardar el tema en localStorage:', error);
		}
	}

	private loadSavedTheme(): void {
		try {
			const savedTheme = localStorage.getItem(this.STORAGE_KEY) as ThemeType;
			if (savedTheme && this.isThemeAvailable(savedTheme)) {
				this.currentTheme = savedTheme;
				this.applyThemeToDocument();
			} else {
				// Si no hay tema guardado, usar el preferido del sistema
				this.useSystemTheme();
			}
		} catch (error) {
			console.warn('No se pudo cargar el tema desde localStorage:', error);
			this.useSystemTheme();
		}
	}
}

// Exportar instancia singleton
export const themeService = new ThemeService();

// Hook de React para usar el servicio de temas
export function useTheme() {
	const [currentTheme, setCurrentTheme] = React.useState<ThemeType>(themeService.getCurrentTheme());

	React.useEffect(() => {
		const handleThemeChange = (event: CustomEvent<{ theme: ThemeType }>) => {
			setCurrentTheme(event.detail.theme);
		};

		window.addEventListener('themeChanged', handleThemeChange as EventListener);
		
		return () => {
			window.removeEventListener('themeChanged', handleThemeChange as EventListener);
		};
	}, []);

	const changeTheme = React.useCallback((theme: ThemeType) => {
		themeService.setTheme(theme);
	}, []);

	const cycleTheme = React.useCallback(() => {
		themeService.cycleTheme();
	}, []);

	return {
		currentTheme,
		availableThemes: AVAILABLE_THEMES,
		themeConfig: themeService.getCurrentThemeConfig(),
		changeTheme,
		cycleTheme,
		isThemeAvailable: themeService.isThemeAvailable.bind(themeService),
		systemPreferred: themeService.getSystemPreferredTheme()
	};
}

// Importar React para el hook
import React from 'react';
