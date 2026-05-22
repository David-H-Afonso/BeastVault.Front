import { useEffect, useState } from 'react'
import type { PokemonDetailDto } from '@/models/Pokemon'
import type { PokemonListItemDto } from '@/models/api/types'
import { getPokemonById } from '@/services'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import { getTypeIconUrl } from '@/utils'
import { getComputedTypeColor } from '@/utils/typeColors'
import { Modal } from '@/components/elements/Modal/Modal'
import { useUISettings } from '@/hooks/useUISettings'
import './PokemonDetailModal.scss'

interface PokemonDetailModalProps {
	pokemon: PokemonListItemDto | null
	isOpen: boolean
	onClose: () => void
}

export function PokemonDetailModal({ pokemon, isOpen, onClose }: PokemonDetailModalProps) {
	const [detail, setDetail] = useState<PokemonDetailDto | null>(null)
	const [loading, setLoading] = useState(false)
	const { spriteType } = useUISettings()

	useEffect(() => {
		if (!isOpen || !pokemon) {
			setDetail(null)
			return
		}

		setLoading(true)
		getPokemonById(pokemon.id)
			.then(setDetail)
			.catch(() => setDetail(null))
			.finally(() => setLoading(false))
	}, [isOpen, pokemon?.id])

	if (!pokemon) return null

	const sprite = getPreferredSpriteFromDto(pokemon.sprites, spriteType, pokemon.isShiny)
	const type1 = pokemon.type1
	const type2 = pokemon.type2

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			hasActions
			header={pokemon.nickname || pokemon.speciesName}
			className='pokemon-detail-modal'>
			<div className='detail-content'>
				{/* Header with sprite and basic info */}
				<div className='detail-header'>
					<div className='detail-sprite-container'>
						{sprite ? (
							<img src={sprite} alt={pokemon.speciesName} className='detail-sprite' />
						) : (
							<div className='detail-no-sprite'>?</div>
						)}
						{pokemon.isShiny && <span className='detail-shiny-badge'>✨</span>}
					</div>

					<div className='detail-basic-info'>
						<div className='detail-species'>
							#{pokemon.speciesId?.toString().padStart(3, '0')} {pokemon.speciesName}
						</div>
						{pokemon.nickname && <div className='detail-nickname'>"{pokemon.nickname}"</div>}
						<div className='detail-level'>Lv. {pokemon.level}</div>

						<div className='detail-types'>
							{type1 && (
								<span
									className='detail-type-badge'
									style={{ backgroundColor: getComputedTypeColor(type1) }}>
									<img src={getTypeIconUrl(type1)} alt={type1} className='detail-type-icon' />
									{type1}
								</span>
							)}
							{type2 && (
								<span
									className='detail-type-badge'
									style={{ backgroundColor: getComputedTypeColor(type2) }}>
									<img src={getTypeIconUrl(type2)} alt={type2} className='detail-type-icon' />
									{type2}
								</span>
							)}
						</div>

						{pokemon.ballSpriteUrl && (
							<div className='detail-ball'>
								<img src={pokemon.ballSpriteUrl} alt='Ball' className='detail-ball-icon' />
								{pokemon.ballName}
							</div>
						)}
					</div>
				</div>

				{/* Detail data (loaded from API) */}
				{loading && <div className='detail-loading'>Loading details...</div>}

				{detail && (
					<div className='detail-sections'>
						{/* Identity */}
						<section className='detail-section'>
							<h4>Identity</h4>
							<div className='detail-grid'>
								<div className='detail-field'>
									<span className='label'>OT</span>
									<span className='value'>{detail.otName || '—'}</span>
								</div>
								<div className='detail-field'>
									<span className='label'>TID</span>
									<span className='value'>{detail.tid}</span>
								</div>
								<div className='detail-field'>
									<span className='label'>SID</span>
									<span className='value'>{detail.sid}</span>
								</div>
								<div className='detail-field'>
									<span className='label'>Nature</span>
									<span className='value'>{detail.natureName}</span>
								</div>
								<div className='detail-field'>
									<span className='label'>Ability</span>
									<span className='value'>{detail.abilityName}</span>
								</div>
								<div className='detail-field'>
									<span className='label'>Gender</span>
									<span className='value'>{detail.genderName}</span>
								</div>
								{detail.heldItemName && (
									<div className='detail-field'>
										<span className='label'>Held Item</span>
										<span className='value'>{detail.heldItemName}</span>
									</div>
								)}
								{detail.teraTypeName && (
									<div className='detail-field'>
										<span className='label'>Tera Type</span>
										<span className='value'>{detail.teraTypeName}</span>
									</div>
								)}
								<div className='detail-field'>
									<span className='label'>Language</span>
									<span className='value'>{detail.languageName}</span>
								</div>
							</div>
						</section>

						{/* Stats */}
						{detail.stats && (
							<section className='detail-section'>
								<h4>Stats</h4>
								<div className='stats-table'>
									<StatRow
										label='HP'
										stat={detail.stats.statHp}
										iv={detail.stats.ivHp}
										ev={detail.stats.evHp}
										ht={detail.stats.hyperTrainedHp}
									/>
									<StatRow
										label='Atk'
										stat={detail.stats.statAtk}
										iv={detail.stats.ivAtk}
										ev={detail.stats.evAtk}
										ht={detail.stats.hyperTrainedAtk}
									/>
									<StatRow
										label='Def'
										stat={detail.stats.statDef}
										iv={detail.stats.ivDef}
										ev={detail.stats.evDef}
										ht={detail.stats.hyperTrainedDef}
									/>
									<StatRow
										label='SpA'
										stat={detail.stats.statSpa}
										iv={detail.stats.ivSpa}
										ev={detail.stats.evSpa}
										ht={detail.stats.hyperTrainedSpa}
									/>
									<StatRow
										label='SpD'
										stat={detail.stats.statSpd}
										iv={detail.stats.ivSpd}
										ev={detail.stats.evSpd}
										ht={detail.stats.hyperTrainedSpd}
									/>
									<StatRow
										label='Spe'
										stat={detail.stats.statSpe}
										iv={detail.stats.ivSpe}
										ev={detail.stats.evSpe}
										ht={detail.stats.hyperTrainedSpe}
									/>
								</div>
							</section>
						)}

						{/* Moves */}
						{detail.moves && detail.moves.length > 0 && (
							<section className='detail-section'>
								<h4>Moves</h4>
								<div className='moves-list'>
									{detail.moves.map((m) => (
										<div key={m.slot} className='move-item'>
											<span className='move-name'>{m.moveName}</span>
											<span className='move-pp'>
												PP {m.currentPp}/{m.currentPp + m.ppUps}
											</span>
										</div>
									))}
								</div>
							</section>
						)}

						{/* Origin */}
						<section className='detail-section'>
							<h4>Origin</h4>
							<div className='detail-grid'>
								{detail.metLocation && (
									<div className='detail-field'>
										<span className='label'>Met Location</span>
										<span className='value'>{detail.metLocation}</span>
									</div>
								)}
								{detail.metDate && (
									<div className='detail-field'>
										<span className='label'>Met Date</span>
										<span className='value'>{detail.metDate}</span>
									</div>
								)}
								<div className='detail-field'>
									<span className='label'>Friendship</span>
									<span className='value'>{detail.currentFriendship}</span>
								</div>
								{detail.fatefulEncounter && (
									<div className='detail-field'>
										<span className='label'>Fateful</span>
										<span className='value'>Yes</span>
									</div>
								)}
							</div>
						</section>
					</div>
				)}
			</div>
		</Modal>
	)
}

function StatRow({
	label,
	stat,
	iv,
	ev,
	ht,
}: {
	label: string
	stat: number
	iv: number
	ev: number
	ht: boolean
}) {
	const maxStat = 255
	const barWidth = Math.min((stat / maxStat) * 100, 100)
	const ivClass = iv === 31 ? 'perfect' : iv === 0 ? 'zero' : ''

	return (
		<div className='stat-row'>
			<span className='stat-label'>{label}</span>
			<span className='stat-value'>{stat}</span>
			<div className='stat-bar-container'>
				<div className='stat-bar' style={{ width: `${barWidth}%` }} />
			</div>
			<span className={`stat-iv ${ivClass}`}>{ht ? '★' : iv}</span>
			<span className='stat-ev'>{ev > 0 ? ev : '—'}</span>
		</div>
	)
}
