import { type ReactNode, useEffect, useRef } from 'react'

interface DetailShellProps {
	children: ReactNode
	panel: ReactNode | null
	onClosePanel: () => void
}

export function DetailShell({ children, panel, onClosePanel }: DetailShellProps) {
	const panelRef = useRef<HTMLDivElement>(null)

	// Escape key to close
	useEffect(() => {
		if (!panel) return
		const handler = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return
			if (document.querySelector('.tag-manager-overlay')) return
			onClosePanel()
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [panel, onClosePanel])

	useEffect(() => {
		if (!panel) return
		document.body.classList.add('detail-panel-open')
		return () => document.body.classList.remove('detail-panel-open')
	}, [panel])

	// Click outside to close
	useEffect(() => {
		if (!panel) return
		const handler = (e: MouseEvent) => {
			const target = e.target
			if (target instanceof Element && target.closest('.tag-manager-overlay')) return
			if (panelRef.current && target instanceof Node && !panelRef.current.contains(target)) {
				onClosePanel()
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [panel, onClosePanel])

	return (
		<>
			{children}
			{panel && (
				<aside ref={panelRef} className='detail-shell__detail' role='dialog' aria-modal='true'>
					<button
						type='button'
						className='detail-shell__close'
						onClick={onClosePanel}
						aria-label='Close detail panel'>
						×
					</button>
					{panel}
				</aside>
			)}
		</>
	)
}
