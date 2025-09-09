import { useState, useEffect } from 'react'
import { SpriteType } from '../models/enums/SpriteTypes'

interface SpriteSettings {
	selectedType: SpriteType
	enableGifPagination: boolean // Limitar paginado cuando se usan GIFs
	maxGifsPerPage: number // Máximo de GIFs por página
}

const DEFAULT_SETTINGS: SpriteSettings = {
	selectedType: SpriteType.SPRITES,
	enableGifPagination: true,
	maxGifsPerPage: 20,
}

const STORAGE_KEY = 'pokemon-sprite-settings'

/**
 * Hook para gestionar la configuración de tipos de sprites
 * Permite al usuario elegir qué tipo de sprites mostrar en toda la aplicación
 */
export function useSpriteSettings() {
	const [settings, setSettings] = useState<SpriteSettings>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
		} catch {
			return DEFAULT_SETTINGS
		}
	})

	// Persistir cambios en localStorage
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
		} catch (error) {
			console.warn('No se pudo guardar configuración de sprites:', error)
		}
	}, [settings])

	const updateSettings = (newSettings: Partial<SpriteSettings>) => {
		setSettings((prev) => ({ ...prev, ...newSettings }))
	}

	const setSpriteType = (type: SpriteType) => {
		updateSettings({ selectedType: type })

		// Si se activan GIFs, habilitar automáticamente la paginación limitada
		if (type === SpriteType.GIFS && !settings.enableGifPagination) {
			updateSettings({
				selectedType: type,
				enableGifPagination: true,
			})
		}
	}

	const resetToDefaults = () => {
		setSettings(DEFAULT_SETTINGS)
	}

	// Helper para saber si se debe limitar la paginación
	const shouldLimitPagination = () => {
		return settings.selectedType === SpriteType.GIFS && settings.enableGifPagination
	}

	// Helper para obtener el máximo de elementos por página
	const getMaxItemsPerPage = (defaultMax: number = 50) => {
		if (shouldLimitPagination()) {
			return settings.maxGifsPerPage
		}
		return defaultMax
	}

	return {
		settings,
		updateSettings,
		setSpriteType,
		resetToDefaults,
		shouldLimitPagination,
		getMaxItemsPerPage,
		selectedType: settings.selectedType,
		isUsingGifs: settings.selectedType === SpriteType.GIFS,
	}
}

export default useSpriteSettings
