export interface LoginRequest {
	username: string
	password?: string | null
}

export interface LoginResponse {
	userId: number
	username: string
	role: string
	token: string
}

export interface RegisterRequest {
	username: string
	password: string
}

export interface MeResponse {
	userId: number
	username: string
	role: string
}

export interface UpdatePasswordRequest {
	currentPassword?: string | null
	newPassword: string
}

export interface AdminResetPasswordRequest {
	newPassword: string
}

export interface RenameUserRequest {
	newUsername: string
}

export interface UpdateRoleRequest {
	role: string
}

export interface UserPreferencesDto {
	theme: string
	viewMode: string
	spriteType: string
	backgroundType: string
	browseLayout: string
	organizeDensity: string
	kanbanDragMode: string
}

export interface UpdatePreferencesRequest {
	theme?: string | null
	viewMode?: string | null
	spriteType?: string | null
	backgroundType?: string | null
	browseLayout?: string | null
	organizeDensity?: string | null
	kanbanDragMode?: string | null
}

export interface UserDto {
	id: number
	username: string
	role: string
	isDefault: boolean
	createdAt: string
}

export interface AuthState {
	user: {
		userId: number
		username: string
		role: string
	} | null
	token: string | null
	isAuthenticated: boolean
	loading: boolean
	error: string | null
}
