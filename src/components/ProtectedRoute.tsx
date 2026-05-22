import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/hooks'
import { selectIsAuthenticated } from '@/store/features/auth'

interface ProtectedRouteProps {
	children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const isAuthenticated = useAppSelector(selectIsAuthenticated)
	const location = useLocation()

	if (!isAuthenticated) {
		return <Navigate to='/login' state={{ from: location }} replace />
	}

	return <>{children}</>
}
