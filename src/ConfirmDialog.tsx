import type { ReactNode } from 'react'
import { Modal } from '@/components/elements/Modal/Modal'
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
	if (!open) return null
	return (
		<Modal
			isOpen={open}
			onClose={onCancel}
			header={title}
			hasActions
			closeOnBackdropClick={false}
			closeOnEscape={false}>
			<div className='confirm-dialog-body'>
				<div className='confirm-dialog-message'>{message}</div>
				<div className='confirm-dialog-actions'>
					<button className='confirm-dialog-btn confirm-dialog-btn--cancel' onClick={onCancel}>
						Cancel
					</button>
					{!hideConfirm && (
						<button className='confirm-dialog-btn confirm-dialog-btn--danger' onClick={onConfirm}>
							Delete
						</button>
					)}
				</div>
			</div>
		</Modal>
	)
}
