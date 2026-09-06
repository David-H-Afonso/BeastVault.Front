import { useEffect, useRef, type PropsWithChildren } from 'react'

interface DexHuntDialogProps extends PropsWithChildren {
	title: string
	description?: string
	onClose: () => void
	wide?: boolean
}

export function DexHuntDialog({ title, description, onClose, wide, children }: DexHuntDialogProps) {
	const dialogRef = useRef<HTMLElement>(null)
	const titleId = `dex-hunt-dialog-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

	useEffect(() => {
		const previous = document.activeElement as HTMLElement | null
		const dialog = dialogRef.current
		dialog?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose()
			if (event.key !== 'Tab' || !dialog) return
			const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href]'))
			if (focusable.length === 0) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}
		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			previous?.focus()
		}
	}, [onClose])

	return (
		<div className='dex-hunt-modal' onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
			<section ref={dialogRef} className={`dex-hunt-dialog${wide ? ' dex-hunt-dialog--wide' : ''}`} role='dialog' aria-modal='true' aria-labelledby={titleId}>
				<header className='dex-hunt-dialog__header'>
					<div>
						<h2 id={titleId}>{title}</h2>
						{description && <p>{description}</p>}
					</div>
					<button type='button' className='dex-hunt-icon-button' onClick={onClose} aria-label='Close dialog'>×</button>
				</header>
				{children}
			</section>
		</div>
	)
}
