import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Login from '@/components/Login/Login'
import Settings from '@/components/Settings/containers/Settings'
import UserManagement from '@/components/Admin/UserManagement'
import PageNotFound from '@/components/PageNotFound/containers/PageNotFound'
import { AppLayout } from './layouts/AppLayout'
import { PrivateRoute, AdminRoute } from '@/components/Auth/AuthGuards'

export const router = createBrowserRouter([
	{
		path: '/login',
		element: <Login />,
	},
	{
		element: <PrivateRoute />,
		children: [
			{
				path: '/',
				element: <AppLayout />,
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
				],
			},
		],
	},
	{
		element: <AdminRoute />,
		children: [
			{
				path: '/admin/users',
				element: <AppLayout />,
				children: [
					{
						index: true,
						element: <UserManagement />,
					},
				],
			},
		],
	},
	{
		path: '*',
		element: <div>Page not found</div>,
		errorElement: <PageNotFound />,
	},
])
