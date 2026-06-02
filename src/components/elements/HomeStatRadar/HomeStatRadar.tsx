export interface HomeStatRadarRow {
	key: string
	label: string
	value: number
	tone?: 'boosted' | 'reduced'
}

interface HomeStatRadarProps {
	rows: HomeStatRadarRow[]
	maxValue?: number
}

export function HomeStatRadar({ rows, maxValue }: HomeStatRadarProps) {
	const ordered = rows.slice(0, 6)
	const center = 120
	const radius = 66
	const resolvedMax = Math.max(maxValue ?? 300, ...ordered.map((row) => row.value), 1)
	const pointFor = (index: number, statScale = 1) => {
		const angle = (-90 + index * 60) * (Math.PI / 180)
		const distance = radius * statScale
		return {
			x: center + Math.cos(angle) * distance,
			y: center + Math.sin(angle) * distance,
		}
	}
	const rings = [1, 0.75, 0.5, 0.25].map((scale) =>
		ordered.map((_, index) => {
			const point = pointFor(index, scale)
			return `${point.x},${point.y}`
		})
	)
	const statPoints = ordered
		.map((row, index) => {
			const point = pointFor(index, Math.min(row.value / resolvedMax, 1))
			return `${point.x},${point.y}`
		})
		.join(' ')

	return (
		<div className='home-stat-radar' aria-label='Battle stats radar'>
			<svg viewBox='0 0 240 240' role='img'>
				{rings.map((points, index) => (
					<polygon key={index} className='home-stat-radar__ring' points={points.join(' ')} />
				))}
				{ordered.map((_, index) => {
					const outer = pointFor(index, 1)
					return (
						<line
							key={index}
							className='home-stat-radar__axis'
							x1={center}
							y1={center}
							x2={outer.x}
							y2={outer.y}
						/>
					)
				})}
				<polygon className='home-stat-radar__fill' points={statPoints} />
				<polygon className='home-stat-radar__line' points={statPoints} />
				{ordered.map((row, index) => {
					const point = pointFor(index, 1.42)
					return (
						<g key={row.key} className='home-stat-radar__label'>
							<text x={point.x} y={point.y - 8}>
								{row.value}
							</text>
							<text
								x={point.x}
								y={point.y + 10}
								className={
									row.tone === 'boosted' ? 'is-boosted' : row.tone === 'reduced' ? 'is-reduced' : ''
								}>
								{row.label}
							</text>
						</g>
					)
				})}
			</svg>
		</div>
	)
}
