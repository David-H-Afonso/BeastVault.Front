import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ConfirmDialog.scss'

interface ConfirmDialogProps {
	open: boolean
	title?: string
	message: ReactNode
	onConfirm: () => void
	onCancel: () => void
	hideConfirm?: boolean
}

export function ConfirmDialog({
	open,
	title,
	message,
	onConfirm,
	onCancel,
	hideConfirm,
}: ConfirmDialogProps) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel()
		}
		document.addEventListener('keydown', onKey)
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', onKey)
			document.body.style.overflow = ''
		}
	}, [open, onCancel])

	if (!open) return null

	return createPortal(
		<div className='confirm-overlay'>
			<div className='confirm-modal' onClick={(e) => e.stopPropagation()}>
				<div className='confirm-modal__header'>
					<h2>{title}</h2>
					<button className='confirm-modal__close' onClick={onCancel} aria-label='Close'>
						×
					</button>
				</div>
				<div className='confirm-modal__body'>
					<p className='confirm-modal__message'>{message}</p>
					<div className='confirm-modal__actions'>
						<button className='confirm-modal__btn confirm-modal__btn--cancel' onClick={onCancel}>
							Cancel
						</button>
						{!hideConfirm && (
							<button className='confirm-modal__btn confirm-modal__btn--danger' onClick={onConfirm}>
								Delete
							</button>
						)}
					</div>
				</div>
			</div>
		</div>,
		document.body
	)
}
