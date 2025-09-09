import React from 'react'

interface EmptyLayoutProps {
	children: React.ReactNode
}

export const EmptyLayout: React.FC<EmptyLayoutProps> = ({ children }) => {
	return <>{children}</>
}
