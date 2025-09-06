// environment.prod.ts

function getApiBaseUrl(): string {
	// Si estamos en Electron
	if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
		return (window as any).API_BASE_URL
	}

	// Si tenemos configuración en runtime (Docker)
	if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV.VITE_API_URL) {
		return (window as any).ENV.VITE_API_URL
	}

	// Si definimos la URL en tiempo de build (Docker/Vite)
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL as string
	}

	// Fallback por si acaso
	return 'http://localhost:5000'
}

export const environment = {
	baseUrl: getApiBaseUrl(),
}
