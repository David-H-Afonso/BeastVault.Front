import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Settings from '@/components/Settings/containers/Settings'
import PageNotFound from '@/components/PageNotFound/containers/PageNotFound'
import { AppLayout } from './components/AppLayout'

export const router = createBrowserRouter([
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
	{
		path: '*',
		element: <div>Page not found</div>,
		errorElement: <PageNotFound />,
	},
])
