import { useState } from 'react'
import type { PokemonListItemDto } from '@/models/api/types'

interface ProcessedPokemon {
	pokemon: PokemonListItemDto
	sprite: string | undefined
	type1?: string
	type2?: string
}

interface BoxViewProps {
	processedPokemon: ProcessedPokemon[]
	onPokemonClick?: (pokemon: PokemonListItemDto) => void
	onDelete: (id: number) => void
	onDownload: (id: number) => void
	onManageTags: (pokemon: PokemonListItemDto) => void
	loading: boolean
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

const BOX_SIZE = 30

export const BoxView = ({
	processedPokemon,
	onPokemonClick,
	currentPage,
	totalPages,
	onPageChange,
}: BoxViewProps) => {
	const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)

	// Fill remaining slots to always show BOX_SIZE
	const slots: (ProcessedPokemon | null)[] = [...processedPokemon]
	while (slots.length < BOX_SIZE) {
		slots.push(null)
	}

	return (
		<div>
			<div className='box-view__header'>
				<button
					className='box-view__nav'
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}>
					◀
				</button>
				<span className='box-view__title'>Box {currentPage}</span>
				<button
					className='box-view__nav'
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}>
					▶
				</button>
			</div>

			<div className='box-view__grid'>
				{slots.map((slot, i) => (
					<div
						key={i}
						className={`box-view__slot ${!slot ? 'box-view__slot--empty' : ''}`}
						onClick={() => slot && onPokemonClick?.(slot.pokemon)}
						onMouseEnter={() => setHoveredSlot(i)}
						onMouseLeave={() => setHoveredSlot(null)}>
						{slot && (
							<>
								{slot.sprite ? (
									<img src={slot.sprite} alt={slot.pokemon.nickname || slot.pokemon.speciesName} />
								) : (
									<span style={{ fontSize: '1.5rem', opacity: 0.5 }}>?</span>
								)}
								{hoveredSlot === i && (
									<span className='box-view__slot-name'>
										{slot.pokemon.nickname || slot.pokemon.speciesName}
									</span>
								)}
							</>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
