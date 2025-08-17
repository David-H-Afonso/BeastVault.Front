// Función para obtener la URL base del API en producción
function getApiBaseUrl(): string {
	// Si estamos en Electron, usar la variable global establecida
	if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
		return (window as any).API_BASE_URL
	}

	// Fallback para producción web
	return 'http://localhost:5000'
}

export const environment = {
	baseUrl: getApiBaseUrl(),
}
