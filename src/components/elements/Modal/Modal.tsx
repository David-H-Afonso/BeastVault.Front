import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.scss'

interface ModalProps {
	children: React.ReactNode
	className?: string
	closeOnBackdropClick?: boolean
	closeOnEscape?: boolean
	hasActions?: boolean
	header?: string
	isOpen: boolean
	onClose?: () => void
}

export const Modal: React.FC<ModalProps> = ({
	children,
	className = '',
	closeOnBackdropClick = true,
	closeOnEscape = true,
	hasActions,
	header,
	isOpen,
	onClose,
}) => {
	// Handle escape key
	useEffect(() => {
		if (!isOpen || !closeOnEscape || !onClose) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [isOpen, closeOnEscape, onClose])

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			return () => {
				document.body.style.overflow = 'unset'
			}
		}
	}, [isOpen])

	if (!isOpen) return null

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
			onClose()
		}
	}

	const getPortalContainer = () => {
		let container = document.getElementById('modal-portal')
		if (!container) {
			container = document.createElement('div')
			container.id = 'modal-portal'
			document.body.appendChild(container)
		}
		return container
	}

	return createPortal(
		<div className={`modal ${className}`}>
			<div className='modal-backdrop' onClick={handleBackdropClick} />
			<div className='modal-content'>
				<div className='modal-header'>
					{header && <h3>{header}</h3>}
					{hasActions && (
						<div className='modal-header-actions'>
							<button className='modal-close' onClick={onClose} aria-label='Close modal'>
								✕
							</button>
						</div>
					)}
				</div>
				<div className='modal-body'>{children}</div>
			</div>
		</div>,
		getPortalContainer()
	)
}
