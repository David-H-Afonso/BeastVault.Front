import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface PortalProps {
	children: ReactNode
}

export function AppPortal({ children }: PortalProps) {
	const portalRoot = document.getElementById('portal-root')
	if (!portalRoot) return null
	return createPortal(children, portalRoot)
}
