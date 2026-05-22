import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Settings from '@/components/Settings/containers/Settings'
import AdminPanel from '@/components/AdminPanel/AdminPanel'
import PageNotFound from '@/components/PageNotFound/containers/PageNotFound'
import Login from '@/components/Login/Login'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
	{
		path: '/login',
		element: <Login />,
	},
	{
		path: '/',
		element: (
			<ProtectedRoute>
				<AppLayout />
			</ProtectedRoute>
		),
		errorElement: <PageNotFound />,
		children: [
			{
				index: true,
				element: <App />,
			},
			{
				path: 'settings',
				element: <Settings />,
			},
			{
				path: 'admin',
				element: <AdminPanel />,
			},
		],
	},
	{
		path: '*',
		element: <div>Page not found</div>,
		errorElement: <PageNotFound />,
	},
])
