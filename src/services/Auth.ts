import type {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	MeResponse,
	UpdatePasswordRequest,
	AdminResetPasswordRequest,
	UserDto,
	RenameUserRequest,
	UpdateRoleRequest,
	UserPreferencesDto,
	UpdatePreferencesRequest,
} from '../models/Auth'
import { customFetch } from '../utils'
import { environment } from '../environments'

/**
 * Login with username and optional password.
 * Default admin user is passwordless on first run.
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
	return customFetch<LoginResponse>(`${environment.baseUrl}/auth/login`, {
		method: 'POST',
		body: request,
		skipAuth: true,
	})
}

/**
 * Register a new user account.
 */
export async function register(request: RegisterRequest): Promise<LoginResponse> {
	return customFetch<LoginResponse>(`${environment.baseUrl}/auth/register`, {
		method: 'POST',
		body: request,
		skipAuth: true,
	})
}

/**
 * Get current authenticated user info.
 */
export async function getMe(): Promise<MeResponse> {
	return customFetch<MeResponse>(`${environment.baseUrl}/auth/me`)
}

/**
 * Update the current user's password.
 */
export async function updatePassword(request: UpdatePasswordRequest): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/auth/password`, {
		method: 'PUT',
		body: request,
	})
}

/**
 * Rename own account.
 */
export async function renameOwnUser(request: RenameUserRequest): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/auth/username`, {
		method: 'PUT',
		body: request,
	})
}

/**
 * Get user display preferences.
 */
export async function getPreferences(): Promise<UserPreferencesDto> {
	return customFetch<UserPreferencesDto>(`${environment.baseUrl}/auth/preferences`)
}

/**
 * Update user display preferences.
 */
export async function updatePreferences(
	request: UpdatePreferencesRequest
): Promise<UserPreferencesDto> {
	return customFetch<UserPreferencesDto>(`${environment.baseUrl}/auth/preferences`, {
		method: 'PUT',
		body: request,
	})
}

/**
 * Get all users (admin only).
 */
export async function getUsers(): Promise<UserDto[]> {
	return customFetch<UserDto[]>(`${environment.baseUrl}/auth/admin/users`)
}

/**
 * Delete a user by ID (admin only).
 */
export async function deleteUser(userId: number): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/auth/admin/users/${userId}`, {
		method: 'DELETE',
	})
}

/**
 * Reset a user's password (admin only).
 */
export async function adminResetPassword(
	userId: number,
	request: AdminResetPasswordRequest
): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/auth/admin/users/${userId}/password`, {
		method: 'PUT',
		body: request,
	})
}

/**
 * Rename any user (admin only).
 */
export async function adminRenameUser(userId: number, request: RenameUserRequest): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/auth/admin/users/${userId}/username`, {
		method: 'PUT',
		body: request,
	})
}

/**
 * Update a user's role (admin only).
 */
export async function adminUpdateRole(userId: number, request: UpdateRoleRequest): Promise<void> {
	return customFetch<void>(`${environment.baseUrl}/auth/admin/users/${userId}/role`, {
		method: 'PUT',
		body: request,
	})
}
