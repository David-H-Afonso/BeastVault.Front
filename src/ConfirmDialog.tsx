import type { ReactNode } from 'react'
import { Modal } from '@/components/elements/Modal/Modal'
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
		<Modal isOpen={open} onClose={onCancel} closeOnBackdropClick={false} closeOnEscape={false}>
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					height: '100vh',
					background: 'rgba(0,0,0,0.3)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1000,
				}}>
				<div
					style={{
						background: '#fff',
						color: '#000',
						borderRadius: 8,
						padding: 24,
						minWidth: 300,
						boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
					}}>
					{title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
					<div>{message}</div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
						<button onClick={onCancel} style={{ padding: '6px 16px' }}>
							Cancel
						</button>
						{!hideConfirm && (
							<button
								onClick={onConfirm}
								style={{
									padding: '6px 16px',
									background: '#c00',
									color: '#fff',
									border: 'none',
									borderRadius: 4,
								}}>
								Delete
							</button>
						)}
					</div>
				</div>
			</div>
		</Modal>
	)
}
