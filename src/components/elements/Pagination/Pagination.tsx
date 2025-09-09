import { useMemo } from 'react'
import './Pagination.scss'

interface PaginationProps {
	currentPage: number
	totalPages: number
	totalItems: number
	itemsPerPage: number
	onPageChange: (page: number) => void
	onItemsPerPageChange: (itemsPerPage: number) => void
	loading?: boolean
	disabled?: boolean
}

/**
 * Componente de paginación completo con navegación y selector de elementos por página
 */
export function Pagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
	loading = false,
	disabled = false,
}: PaginationProps) {
	/**
	 * Calcula las páginas a mostrar en la navegación
	 * Muestra un máximo de 7 páginas con lógica inteligente
	 */
	const visiblePages = useMemo(() => {
		const delta = 2 // Páginas a mostrar a cada lado de la actual
		const range = []
		const rangeWithDots = []

		// Siempre incluir la primera página
		range.push(1)

		// Calcular rango alrededor de la página actual
		for (
			let i = Math.max(2, currentPage - delta);
			i <= Math.min(totalPages - 1, currentPage + delta);
			i++
		) {
			range.push(i)
		}

		// Siempre incluir la última página si hay más de una
		if (totalPages > 1) {
			range.push(totalPages)
		}

		// Agregar puntos suspensivos donde sea necesario
		let prev: number | undefined
		for (const i of range) {
			if (prev !== undefined) {
				if (i - prev === 2) {
					rangeWithDots.push(prev + 1)
				} else if (i - prev !== 1) {
					rangeWithDots.push('...')
				}
			}
			rangeWithDots.push(i)
			prev = i
		}

		return rangeWithDots
	}, [currentPage, totalPages])

	/**
	 * Información de la página actual
	 */
	const pageInfo = useMemo(() => {
		const startItem = (currentPage - 1) * itemsPerPage + 1
		const endItem = Math.min(currentPage * itemsPerPage, totalItems)
		return { startItem, endItem }
	}, [currentPage, itemsPerPage, totalItems])

	/**
	 * Opciones para elementos por página
	 */
	const itemsPerPageOptions = [10, 25, 50, 100, 200]

	if (totalItems === 0) {
		return null // No mostrar paginación si no hay elementos
	}

	return (
		<div
			className={`pagination-container ${loading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}>
			{/* Información de la página */}
			<div className='pagination-info'>
				<span>
					Showing {pageInfo.startItem}-{pageInfo.endItem} of {totalItems} results
				</span>
			</div>

			{/* Selector de elementos por página */}
			<div className='pagination-page-size'>
				<label htmlFor='page-size-select'>Show:</label>
				<select
					id='page-size-select'
					value={itemsPerPage}
					onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
					disabled={loading || disabled}
					className='page-size-select'>
					{itemsPerPageOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<span>per page</span>
			</div>

			{/* Navegación de páginas */}
			<div className='pagination-nav'>
				{/* Botón Primera página */}
				<button
					onClick={() => onPageChange(1)}
					disabled={currentPage === 1 || loading || disabled}
					className='pagination-btn pagination-first'
					title='First page'>
					«
				</button>

				{/* Botón Página anterior */}
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1 || loading || disabled}
					className='pagination-btn pagination-prev'
					title='Previous page'>
					‹
				</button>

				{/* Números de página */}
				<div className='pagination-pages'>
					{visiblePages.map((page, index) => {
						if (page === '...') {
							return (
								<span key={`dots-${index}`} className='pagination-dots'>
									...
								</span>
							)
						}

						const pageNumber = page as number
						return (
							<button
								key={pageNumber}
								onClick={() => onPageChange(pageNumber)}
								disabled={loading || disabled}
								className={`pagination-btn pagination-page ${
									pageNumber === currentPage ? 'active' : ''
								}`}>
								{pageNumber}
							</button>
						)
					})}
				</div>

				{/* Botón Página siguiente */}
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages || loading || disabled}
					className='pagination-btn pagination-next'
					title='Next page'>
					›
				</button>

				{/* Botón Última página */}
				<button
					onClick={() => onPageChange(totalPages)}
					disabled={currentPage === totalPages || loading || disabled}
					className='pagination-btn pagination-last'
					title='Last page'>
					»
				</button>
			</div>

			{/* Indicador de carga */}
			{loading && (
				<div className='pagination-loading'>
					<div className='pagination-spinner'>⚙️</div>
				</div>
			)}
		</div>
	)
}
