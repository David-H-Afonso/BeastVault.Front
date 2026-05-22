// environment.prod.ts

function getApiBaseUrl(): string {
	// Si estamos en Electron
	if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
		return (window as any).API_BASE_URL
	}

	// Si tenemos configuración en runtime (Docker)
	// Usamos 'in' para detectar si config.js se cargó correctamente,
	// aunque VITE_API_URL sea string vacío (= nginx proxy same-origin).
	if (
		typeof window !== 'undefined' &&
		(window as any).ENV !== undefined &&
		'VITE_API_URL' in (window as any).ENV
	) {
		return (window as any).ENV.VITE_API_URL || ''
	}

	// Si definimos la URL en tiempo de build (Docker/Vite)
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL as string
	}

	// Fallback (nginx proxy on same origin)
	return ''
}

export const environment = {
	baseUrl: getApiBaseUrl(),
}
