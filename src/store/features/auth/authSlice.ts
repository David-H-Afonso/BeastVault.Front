import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { AuthState, LoginRequest } from '@/models/Auth'
import * as authService from '@/services/Auth'

const initialState: AuthState = {
	token: null,
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
}

export const loginUser = createAsyncThunk('auth/login', async (credentials: LoginRequest) => {
	return authService.login(credentials)
})

export const fetchCurrentUser = createAsyncThunk(
	'auth/fetchCurrentUser',
	async (_, { getState }) => {
		const { auth } = getState() as { auth: AuthState }
		if (!auth.token) throw new Error('No token')
		return authService.getCurrentUser(auth.token)
	}
)

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout(state) {
			state.token = null
			state.user = null
			state.isAuthenticated = false
			state.error = null
		},
		clearError(state) {
			state.error = null
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginUser.pending, (state) => {
				state.isLoading = true
				state.error = null
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.isLoading = false
				state.token = action.payload.token
				state.user = action.payload.user
				state.isAuthenticated = true
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.isLoading = false
				state.error = action.error.message ?? 'Login failed'
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.user = action.payload
				state.isAuthenticated = true
			})
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.token = null
				state.user = null
				state.isAuthenticated = false
			})
	},
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
