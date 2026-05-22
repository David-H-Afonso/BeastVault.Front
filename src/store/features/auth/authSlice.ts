import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { AuthState, LoginRequest, RegisterRequest } from '@/models/Auth'
import { login as loginApi, register as registerApi, getMe as getMeApi } from '@/services/Auth'
import { setAuthToken, clearAuthToken } from '@/utils/authToken'
import type { RootState } from '@/store'

const initialState: AuthState = {
	user: null,
	token: null,
	isAuthenticated: false,
	loading: false,
	error: null,
}

export const loginUser = createAsyncThunk(
	'auth/login',
	async (request: LoginRequest, { rejectWithValue }) => {
		try {
			const response = await loginApi(request)
			setAuthToken(response.token)
			return response
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'Login failed')
		}
	}
)

export const registerUser = createAsyncThunk(
	'auth/register',
	async (request: RegisterRequest, { rejectWithValue }) => {
		try {
			const response = await registerApi(request)
			setAuthToken(response.token)
			return response
		} catch (error) {
			return rejectWithValue(error instanceof Error ? error.message : 'Registration failed')
		}
	}
)

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
	try {
		return await getMeApi()
	} catch (error) {
		return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user info')
	}
})

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout(state) {
			clearAuthToken()
			state.user = null
			state.token = null
			state.isAuthenticated = false
			state.error = null
		},
		clearAuthError(state) {
			state.error = null
		},
		restoreAuth(state, action) {
			// Called when rehydrating from persist - restore token to localStorage
			if (state.token) {
				setAuthToken(state.token)
			}
		},
	},
	extraReducers: (builder) => {
		// Login
		builder.addCase(loginUser.pending, (state) => {
			state.loading = true
			state.error = null
		})
		builder.addCase(loginUser.fulfilled, (state, action) => {
			state.loading = false
			state.isAuthenticated = true
			state.token = action.payload.token
			state.user = {
				userId: action.payload.userId,
				username: action.payload.username,
				role: action.payload.role,
			}
		})
		builder.addCase(loginUser.rejected, (state, action) => {
			state.loading = false
			state.error = action.payload as string
		})
		// Register
		builder.addCase(registerUser.pending, (state) => {
			state.loading = true
			state.error = null
		})
		builder.addCase(registerUser.fulfilled, (state, action) => {
			state.loading = false
			state.isAuthenticated = true
			state.token = action.payload.token
			state.user = {
				userId: action.payload.userId,
				username: action.payload.username,
				role: action.payload.role,
			}
		})
		builder.addCase(registerUser.rejected, (state, action) => {
			state.loading = false
			state.error = action.payload as string
		})
		// Fetch Me
		builder.addCase(fetchMe.fulfilled, (state, action) => {
			state.user = {
				userId: action.payload.userId,
				username: action.payload.username,
				role: action.payload.role,
			}
			state.isAuthenticated = true
		})
		builder.addCase(fetchMe.rejected, (state) => {
			clearAuthToken()
			state.user = null
			state.token = null
			state.isAuthenticated = false
		})
	},
})

export const { logout, clearAuthError, restoreAuth } = authSlice.actions

// Selectors
export const selectAuth = (state: RootState) => state.auth
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectUser = (state: RootState) => state.auth.user
export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthError = (state: RootState) => state.auth.error
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'Admin'

export default authSlice.reducer
