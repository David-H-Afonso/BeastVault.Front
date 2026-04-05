export type UserRole = 'Standard' | 'Admin'

export interface AuthUser {
	id: number
	username: string
	role: UserRole
	isDefault: boolean
	hasPassword?: boolean
}

export interface LoginRequest {
	username: string
	password?: string
}

export interface LoginResponse {
	token: string
	user: AuthUser
}

export interface RegisterRequest {
	username: string
	password?: string
	role: UserRole
}

export interface UpdateUserRequest {
	username?: string
	password?: string
	removePassword?: boolean
	role?: UserRole
}

export interface AuthState {
	token: string | null
	user: AuthUser | null
	isAuthenticated: boolean
	isLoading: boolean
	error: string | null
}
