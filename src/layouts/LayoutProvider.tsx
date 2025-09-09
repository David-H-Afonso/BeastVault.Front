import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { EmptyLayout, HeaderLayout } from '../layouts'

interface LayoutProviderProps {
	children: React.ReactNode
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
	const layoutType = useSelector((state: RootState) => state.layout.layoutType)

	switch (layoutType) {
		case 'empty':
			return <EmptyLayout>{children}</EmptyLayout>
		case 'header':
			return <HeaderLayout>{children}</HeaderLayout>
		default:
			return <HeaderLayout>{children}</HeaderLayout>
	}
}
