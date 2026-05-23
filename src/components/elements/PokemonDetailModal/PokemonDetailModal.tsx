import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PokemonDetailDto } from '@/models/Pokemon'
import type { PokemonListItemDto } from '@/models/api/types'
import { getPokemonById } from '@/services'
import { getPreferredSpriteFromDto } from '@/utils/spriteUtils'
import { getTypeIconUrl } from '@/utils'
import { getComputedTypeColor } from '@/utils/typeColors'
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
	const [isClosing, setIsClosing] = useState(false)
	const { spriteType } = useUISettings()
	const panelRef = useRef<HTMLDivElement>(null)

	// Load detail data when opened
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

	// Close with animation
	const handleClose = () => {
		setIsClosing(true)
		setTimeout(() => {
			setIsClosing(false)
			onClose()
		}, 280)
	}

	// Escape key
	useEffect(() => {
		if (!isOpen) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') handleClose()
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [isOpen])

	// Lock body scroll
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			return () => {
				document.body.style.overflow = ''
			}
		}
	}, [isOpen])

	if (!isOpen && !isClosing) return null
	if (!pokemon) return null

	const sprite = getPreferredSpriteFromDto(pokemon.sprites, spriteType, pokemon.isShiny)
	const type1 = pokemon.type1
	const type2 = pokemon.type2

	const portal =
		document.getElementById('detail-drawer-portal') ??
		(() => {
			const el = document.createElement('div')
			el.id = 'detail-drawer-portal'
			document.body.appendChild(el)
			return el
		})()

	return createPortal(
		<div className={`pokemon-detail-drawer ${isClosing ? 'closing' : ''}`}>
			{/* Backdrop */}
			<div className='detail-drawer-backdrop' onClick={handleClose} />

			{/* Panel */}
			<div ref={panelRef} className='detail-drawer-panel'>
				{/* Close button */}
				<button className='detail-drawer-close' onClick={handleClose} aria-label='Close'>
					✕
				</button>

				{/* Hero section: sprite + basic info */}
				<div className='detail-hero'>
					<div className='detail-sprite-wrap'>
						{sprite ? (
							<img src={sprite} alt={pokemon.speciesName} className='detail-sprite' />
						) : (
							<div className='detail-no-sprite'>?</div>
						)}
						{pokemon.isShiny && <span className='detail-shiny'>✨</span>}
					</div>

					<div className='detail-hero-info'>
						<div className='detail-dex-number'>
							#{pokemon.speciesId?.toString().padStart(3, '0')}
						</div>
						<h3 className='detail-name'>{pokemon.nickname || pokemon.speciesName}</h3>
						{pokemon.nickname && <div className='detail-species-sub'>{pokemon.speciesName}</div>}
						<div className='detail-level'>Lv. {pokemon.level}</div>

						<div className='detail-types'>
							{type1 && (
								<span
									className='detail-type-badge'
									style={{ backgroundColor: getComputedTypeColor(type1) }}>
									<img src={getTypeIconUrl(type1)} alt={type1} />
									{type1}
								</span>
							)}
							{type2 && (
								<span
									className='detail-type-badge'
									style={{ backgroundColor: getComputedTypeColor(type2) }}>
									<img src={getTypeIconUrl(type2)} alt={type2} />
									{type2}
								</span>
							)}
						</div>

						{pokemon.ballSpriteUrl && (
							<div className='detail-ball'>
								<img src={pokemon.ballSpriteUrl} alt='Ball' />
								<span>{pokemon.ballName}</span>
							</div>
						)}
					</div>
				</div>

				{/* Body */}
				{loading && <div className='detail-loading'>Loading details…</div>}

				{detail && (
					<div className='detail-body'>
						{/* Two-column top: Identity + Stats */}
						<div className='detail-cols'>
							<section className='detail-section'>
								<h4>Identity</h4>
								<div className='detail-fields'>
									<Field label='OT' value={detail.otName || '—'} />
									<Field label='TID' value={String(detail.tid)} />
									<div className='detail-field'>
										<span className='field-label'>Nature</span>
										<span className='field-value'>
											{detail.natureName}
											{detail.natureBoostedStat && detail.natureReducedStat && (
												<span className='nature-stats'>
													{' '}
													<span className='nature-boost'>+{detail.natureBoostedStat}</span>{' '}
													<span className='nature-reduce'>-{detail.natureReducedStat}</span>
												</span>
											)}
										</span>
									</div>
									<Field label='Ability' value={detail.abilityName} />
									<Field label='Gender' value={detail.genderName} />
									{detail.heldItemName && <Field label='Held Item' value={detail.heldItemName} />}
									{detail.teraTypeName && <Field label='Tera Type' value={detail.teraTypeName} />}
									<Field label='Language' value={detail.languageName} />
									{detail.metLocation && <Field label='Met' value={detail.metLocation} />}
									{detail.metDate && (
										<Field
											label='Date'
											value={new Date(detail.metDate).toLocaleDateString(undefined, {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											})}
										/>
									)}
									<div className='detail-field'>
										<span className='field-label'>Happiness</span>
										<span className='field-value happiness-value'>
											{detail.currentFriendship}
											<span className='happiness-bar-bg'>
												<span
													className='happiness-bar-fill'
													style={{ width: `${(detail.currentFriendship / 255) * 100}%` }}
												/>
											</span>
										</span>
									</div>
								</div>
							</section>

							{detail.stats && (
								<section className='detail-section'>
									<h4>
										Stats{' '}
										{detail.originGeneration > 2 && <span className='stat-legend'>IV / EV</span>}
										{detail.originGeneration <= 2 && <span className='stat-legend'>IV</span>}
									</h4>
									<div className='stats-table'>
										<StatRow
											label='HP'
											stat={detail.stats.statHp}
											iv={detail.stats.ivHp}
											ev={detail.stats.evHp}
											ht={detail.stats.hyperTrainedHp}
											hideEv={detail.originGeneration <= 2}
										/>
										<StatRow
											label='Atk'
											stat={detail.stats.statAtk}
											iv={detail.stats.ivAtk}
											ev={detail.stats.evAtk}
											ht={detail.stats.hyperTrainedAtk}
											hideEv={detail.originGeneration <= 2}
											nature={
												detail.natureBoostedStat === 'Atk'
													? 'boost'
													: detail.natureReducedStat === 'Atk'
														? 'reduce'
														: undefined
											}
										/>
										<StatRow
											label='Def'
											stat={detail.stats.statDef}
											iv={detail.stats.ivDef}
											ev={detail.stats.evDef}
											ht={detail.stats.hyperTrainedDef}
											hideEv={detail.originGeneration <= 2}
											nature={
												detail.natureBoostedStat === 'Def'
													? 'boost'
													: detail.natureReducedStat === 'Def'
														? 'reduce'
														: undefined
											}
										/>
										<StatRow
											label='SpA'
											stat={detail.stats.statSpa}
											iv={detail.stats.ivSpa}
											ev={detail.stats.evSpa}
											ht={detail.stats.hyperTrainedSpa}
											hideEv={detail.originGeneration <= 2}
											nature={
												detail.natureBoostedStat === 'SpA'
													? 'boost'
													: detail.natureReducedStat === 'SpA'
														? 'reduce'
														: undefined
											}
										/>
										<StatRow
											label='SpD'
											stat={detail.stats.statSpd}
											iv={detail.stats.ivSpd}
											ev={detail.stats.evSpd}
											ht={detail.stats.hyperTrainedSpd}
											hideEv={detail.originGeneration <= 2}
											nature={
												detail.natureBoostedStat === 'SpD'
													? 'boost'
													: detail.natureReducedStat === 'SpD'
														? 'reduce'
														: undefined
											}
										/>
										<StatRow
											label='Spe'
											stat={detail.stats.statSpe}
											iv={detail.stats.ivSpe}
											ev={detail.stats.evSpe}
											ht={detail.stats.hyperTrainedSpe}
											hideEv={detail.originGeneration <= 2}
											nature={
												detail.natureBoostedStat === 'Spe'
													? 'boost'
													: detail.natureReducedStat === 'Spe'
														? 'reduce'
														: undefined
											}
										/>
									</div>
								</section>
							)}
						</div>

						{/* Moves */}
						{detail.moves && detail.moves.length > 0 && (
							<section className='detail-section'>
								<h4>Moves</h4>
								<div className='moves-grid'>
									{detail.moves.map((m) => (
										<div key={m.slot} className='move-item'>
											<span className='move-name'>{m.moveName}</span>
											<span className='move-pp'>PP {m.currentPp}</span>
										</div>
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>
		</div>,
		portal
	)
}

function Field({ label, value }: { label: string; value: string }) {
	return (
		<div className='detail-field'>
			<span className='field-label'>{label}</span>
			<span className='field-value'>{value}</span>
		</div>
	)
}

function StatRow({
	label,
	stat,
	iv,
	ev,
	ht,
	hideEv,
	nature,
}: {
	label: string
	stat: number
	iv: number
	ev: number
	ht: boolean
	hideEv?: boolean
	nature?: 'boost' | 'reduce'
}) {
	const pct = Math.min((stat / 255) * 100, 100)
	const natureClass =
		nature === 'boost' ? ' nature-boost' : nature === 'reduce' ? ' nature-reduce' : ''
	return (
		<div className={`stat-row${natureClass}`}>
			<span className='stat-label'>{label}</span>
			<span className='stat-val'>{stat}</span>
			<div className='stat-bar-bg'>
				<div className='stat-bar-fill' style={{ width: `${pct}%` }} />
			</div>
			<span className={`stat-iv${iv === 31 ? ' perfect' : iv === 0 ? ' zero' : ''}`}>
				{ht ? '★' : iv}
			</span>
			{!hideEv && <span className='stat-ev'>{ev > 0 ? ev : '—'}</span>}
		</div>
	)
}
