import type {
	AuthUser,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	UpdateUserRequest,
} from '../models/Auth'
import { environment } from '../environments'

const AUTH_BASE = `${environment.baseUrl}/users`

function authHeaders(token: string): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`,
	}
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
	const response = await fetch(`${AUTH_BASE}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(text || `Login failed (${response.status})`)
	}

	return response.json()
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
	const response = await fetch(`${AUTH_BASE}/me`, {
		headers: authHeaders(token),
	})

	if (!response.ok) {
		throw new Error('Failed to fetch current user')
	}

	return response.json()
}

export async function getUsers(token: string): Promise<AuthUser[]> {
	const response = await fetch(AUTH_BASE, {
		headers: authHeaders(token),
	})

	if (!response.ok) {
		throw new Error('Failed to fetch users')
	}

	return response.json()
}

export async function createUser(token: string, request: RegisterRequest): Promise<AuthUser> {
	const response = await fetch(AUTH_BASE, {
		method: 'POST',
		headers: authHeaders(token),
		body: JSON.stringify(request),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(text || 'Failed to create user')
	}

	return response.json()
}

export async function updateUser(
	token: string,
	userId: number,
	request: UpdateUserRequest
): Promise<AuthUser> {
	const response = await fetch(`${AUTH_BASE}/${userId}`, {
		method: 'PUT',
		headers: authHeaders(token),
		body: JSON.stringify(request),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(text || 'Failed to update user')
	}

	return response.json()
}

export async function deleteUser(token: string, userId: number): Promise<void> {
	const response = await fetch(`${AUTH_BASE}/${userId}`, {
		method: 'DELETE',
		headers: authHeaders(token),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(text || 'Failed to delete user')
	}
}
