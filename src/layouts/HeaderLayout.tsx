import React from 'react'
import { Header } from './elements'

interface HeaderLayoutProps {
	children: React.ReactNode
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ children }) => {
	return (
		<div className='header-layout'>
			<Header />
			<main className='header-layout__content'>{children}</main>
		</div>
	)
}
