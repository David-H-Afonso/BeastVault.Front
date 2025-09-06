// Función para obtener la URL base del API
function getApiBaseUrl(): string {
	// Si estamos en Electron, usar la variable global establecida
	if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
		return (window as any).API_BASE_URL
	}

	// Si tenemos configuración en runtime (Docker)
	if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV.VITE_API_URL) {
		return (window as any).ENV.VITE_API_URL
	}

	// Si estamos en desarrollo web normal
	if (import.meta.env.DEV) {
		return 'https://localhost:7178'
	}

	// Fallback para producción web
	return 'http://localhost:5000'
}

export const environment = {
	baseUrl: getApiBaseUrl(),
}
