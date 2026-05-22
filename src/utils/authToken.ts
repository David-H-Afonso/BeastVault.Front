const TOKEN_KEY = 'bv_auth_token'

let cachedToken: string | null = null

export function getAuthToken(): string | null {
	if (cachedToken) return cachedToken
	cachedToken = localStorage.getItem(TOKEN_KEY)
	return cachedToken
}

export function setAuthToken(token: string | null): void {
	cachedToken = token
	if (token) {
		localStorage.setItem(TOKEN_KEY, token)
	} else {
		localStorage.removeItem(TOKEN_KEY)
	}
}

export function clearAuthToken(): void {
	cachedToken = null
	localStorage.removeItem(TOKEN_KEY)
}
