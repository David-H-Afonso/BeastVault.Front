import React from 'react'
import { Outlet } from 'react-router-dom'
import { LayoutProvider } from './LayoutProvider'

export const AppLayout: React.FC = () => {
	return (
		<LayoutProvider>
			<Outlet />
		</LayoutProvider>
	)
}
