import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export function PrivateRoute() {
	const { isAuthenticated } = useAppSelector((state) => state.auth)

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />
	}

	return <Outlet />
}

export function AdminRoute() {
	const { isAuthenticated, user } = useAppSelector((state) => state.auth)

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />
	}

	if (user?.role !== 'Admin') {
		return <Navigate to='/' replace />
	}

	return <Outlet />
}
