import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks'
import {
	loginUser,
	registerUser,
	fetchMe,
	logout,
	clearAuthError,
	selectIsAuthenticated,
	selectUser,
	selectAuthLoading,
	selectAuthError,
	selectIsAdmin,
} from '@/store/features/auth'
import type { LoginRequest, RegisterRequest } from '@/models/Auth'

export const useAuth = () => {
	const dispatch = useAppDispatch()

	const isAuthenticated = useAppSelector(selectIsAuthenticated)
	const user = useAppSelector(selectUser)
	const loading = useAppSelector(selectAuthLoading)
	const error = useAppSelector(selectAuthError)
	const isAdmin = useAppSelector(selectIsAdmin)

	const login = useCallback((request: LoginRequest) => dispatch(loginUser(request)), [dispatch])

	const register = useCallback(
		(request: RegisterRequest) => dispatch(registerUser(request)),
		[dispatch]
	)

	const checkAuth = useCallback(() => dispatch(fetchMe()), [dispatch])

	const doLogout = useCallback(() => {
		dispatch(logout())
	}, [dispatch])

	const clearError = useCallback(() => {
		dispatch(clearAuthError())
	}, [dispatch])

	return {
		isAuthenticated,
		user,
		loading,
		error,
		isAdmin,
		login,
		register,
		checkAuth,
		logout: doLogout,
		clearError,
	}
}
