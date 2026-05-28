import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DexSpeciesDetail, DexOwnedPokemon } from '@/services/DexService'
import { resolveSpriteUrl, getPreferredSpriteFromDto, buildSpritesForId } from '@/utils/spriteUtils'
import type { SpriteType } from '@/models/enums/SpriteTypes'
import './DexSpeciesModal.scss'

// ── Props ─────────────────────────────────────────────────────────────────────

interface DexSpeciesModalProps {
	speciesId: number
	detail: DexSpeciesDetail | null
	loading: boolean
	onClose: () => void
	spriteType: SpriteType
	onNavigateToSpecies?: (speciesId: number) => void
	onViewPokemon?: (pokemon: DexOwnedPokemon) => void
}

// ── Stat display maps ─────────────────────────────────────────────────────────

const STAT_LABELS: Record<string, string> = {
	'hp': 'HP',
	'attack': 'Atk',
	'defense': 'Def',
	'special-attack': 'SpA',
	'special-defense': 'SpD',
	'speed': 'Spe',
}

const STAT_COLORS: Record<string, string> = {
	'hp': '#FF6666',
	'attack': '#F08030',
	'defense': '#F8D030',
	'special-attack': '#6890F0',
	'special-defense': '#78C850',
	'speed': '#F85888',
}

// ── Evolution chain parsing ───────────────────────────────────────────────────

interface EvoStage {
	name: string
	condition: string | null
	speciesId: number | null
}

interface PokeApiChainNode {
	species?: { name: string; url: string }
	evolution_details?: PokeApiEvoDetail[]
	evolves_to?: PokeApiChainNode[]
}

interface PokeApiEvoDetail {
	min_level?: number | null
	item?: { name: string } | null
	trigger?: { name: string } | null
	min_happiness?: number | null
	held_item?: { name: string } | null
	time_of_day?: string
	known_move?: { name: string } | null
	location?: { name: string } | null
}

function extractId(url?: string): number | null {
	if (!url) return null
	const match = url.match(/\/pokemon-species\/(\d+)\//i)
	return match ? Number(match[1]) : null
}

function buildCondition(details?: PokeApiEvoDetail[]): string | null {
	if (!details || details.length === 0) return null
	const d = details[0]
	if (d.min_level) return `Lv. ${d.min_level}`
	if (d.item) return d.item.name.replace(/-/g, ' ')
	if (d.trigger?.name === 'trade') return 'Trade'
	if (d.min_happiness) return `Happiness ${d.min_happiness}`
	if (d.held_item) return `w/ ${d.held_item.name.replace(/-/g, ' ')}`
	if (d.known_move) return `Learn ${d.known_move.name.replace(/-/g, ' ')}`
	if (d.location) return d.location.name.replace(/-/g, ' ')
	return d.trigger?.name?.replace(/-/g, ' ') ?? null
}

// Returns ALL root-to-leaf paths so every branch of the chain is shown
function getAllPaths(node: PokeApiChainNode, path: EvoStage[]): EvoStage[][] {
	const stage: EvoStage = {
		name: node.species?.name ?? '?',
		condition: buildCondition(node.evolution_details),
		speciesId: extractId(node.species?.url),
	}
	const next = [...path, stage]
	if (!node.evolves_to?.length) return [next]
	return node.evolves_to.flatMap((child) => getAllPaths(child, next))
}

function buildEvoPaths(chainJson: string): EvoStage[][] {
	try {
		const root: PokeApiChainNode = JSON.parse(chainJson)
		// Only keep paths with more than one stage (i.e. there are evolutions)
		return getAllPaths(root, []).filter((p) => p.length > 1)
	} catch {
		return []
	}
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DexSpeciesModal({
	speciesId,
	detail,
	loading,
	onClose,
	spriteType,
	onNavigateToSpecies,
	onViewPokemon,
}: DexSpeciesModalProps) {
	const [showShiny, setShowShiny] = useState(false)

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handleKey)
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', handleKey)
			document.body.style.overflow = ''
		}
	}, [onClose])

	const evoPaths = useMemo<EvoStage[][]>(() => {
		if (!detail?.evolutionChainJson) return []
		return buildEvoPaths(detail.evolutionChainJson)
	}, [detail?.evolutionChainJson])

	const hasShinySprite = !!(
		detail?.sprites?.shiny ||
		detail?.sprites?.homeShiny ||
		detail?.sprites?.showdownShiny
	)

	const imageUrl =
		getPreferredSpriteFromDto(detail?.sprites, spriteType, showShiny) ||
		resolveSpriteUrl(detail?.sprites?.official) ||
		resolveSpriteUrl(detail?.sprites?.home) ||
		resolveSpriteUrl(detail?.sprites?.default) ||
		null

	return createPortal(
		<div className='dex-modal-overlay' onClick={onClose}>
			<div className='dex-modal' onClick={(e) => e.stopPropagation()}>
				<button className='dex-modal__close' onClick={onClose} aria-label='Close'>
					×
				</button>

				{loading && <div className='dex-modal__loading'>Loading species data…</div>}
				{!loading && !detail && (
					<div className='dex-modal__loading'>Species data not available.</div>
				)}

				{detail && (
					<>
						{/* ── Header ── */}
						<div className='dex-modal__header'>
							<div className='dex-modal__artwork-wrap'>
								{imageUrl ? (
									<img className='dex-modal__artwork' src={imageUrl} alt={detail.name} />
								) : (
									<div className='dex-modal__artwork-placeholder'>?</div>
								)}{' '}
								{hasShinySprite && (
									<button
										type='button'
										className={`dex-modal__shiny-toggle${showShiny ? ' active' : ''}`}
										onClick={() => setShowShiny((v) => !v)}
										title='Toggle shiny sprite'>
										★
									</button>
								)}{' '}
								{!detail.isUnlocked && <span className='dex-modal__locked-badge'>Not owned</span>}
							</div>
							<div className='dex-modal__title-block'>
								<span className='dex-modal__dex-num'>
									#{String(detail.speciesId).padStart(4, '0')}
								</span>
								<h2 className='dex-modal__name'>{detail.name}</h2>
								<p className='dex-modal__genus'>{detail.genus}</p>
								<div className='dex-modal__types'>
									{detail.types.map((t) => (
										<span key={t} className={`dex-modal__type type-${t.toLowerCase()}`}>
											{t}
										</span>
									))}
								</div>
								<div className='dex-modal__badges'>
									{detail.isLegendary && (
										<span className='dex-modal__badge dex-modal__badge--legendary'>Legendary</span>
									)}
									{detail.isMythical && (
										<span className='dex-modal__badge dex-modal__badge--mythical'>Mythical</span>
									)}
									{detail.isBaby && <span className='dex-modal__badge'>Baby</span>}
								</div>
							</div>
						</div>

						{/* ── Flavor text ── */}
						{detail.flavorText && <p className='dex-modal__flavor'>{detail.flavorText}</p>}

						{/* ── Base Stats ── */}
						<section className='dex-modal__section'>
							<h3 className='dex-modal__section-title'>Base Stats</h3>
							<div className='dex-modal__stats'>
								{Object.entries(detail.baseStats).map(([stat, val]) => (
									<div key={stat} className='dex-modal__stat-row'>
										<span className='dex-modal__stat-name'>{STAT_LABELS[stat] ?? stat}</span>
										<span className='dex-modal__stat-val'>{val}</span>
										<div className='dex-modal__stat-bar-wrap'>
											<div
												className='dex-modal__stat-bar'
												style={{
													width: `${Math.min((val / 255) * 100, 100)}%`,
													background: STAT_COLORS[stat] ?? '#888',
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</section>

						{/* ── Abilities ── */}
						{Array.isArray(detail.abilities) && detail.abilities.length > 0 && (
							<section className='dex-modal__section'>
								<h3 className='dex-modal__section-title'>Abilities</h3>
								<div className='dex-modal__abilities'>
									{(detail.abilities as { name: string; isHidden: boolean }[]).map((a) => (
										<span
											key={a.name}
											className={`dex-modal__ability${a.isHidden ? ' dex-modal__ability--hidden' : ''}`}>
											{a.name.replace(/-/g, ' ')}
											{a.isHidden && <em> (Hidden)</em>}
										</span>
									))}
								</div>
							</section>
						)}

						{/* ── Evolution Chain ── */}
						{evoPaths.length > 0 && (
							<section className='dex-modal__section'>
								<h3 className='dex-modal__section-title'>Evolution</h3>
								<div className='dex-modal__evo-chains'>
									{evoPaths.map((path, pi) => (
										<div key={pi} className='dex-modal__evo-chain'>
											{path.map((stage, i) => (
												<React.Fragment key={stage.name + i}>
													{i > 0 && (
														<div className='dex-modal__evo-arrow-wrap'>
															<span className='dex-modal__evo-arrow'>→</span>
															{stage.condition && (
																<span className='dex-modal__evo-condition'>{stage.condition}</span>
															)}
														</div>
													)}
													<div
														className={`dex-modal__evo-stage${stage.speciesId === speciesId ? ' dex-modal__evo-stage--current' : ''}${onNavigateToSpecies && stage.speciesId != null && stage.speciesId !== speciesId ? ' dex-modal__evo-stage--clickable' : ''}`}
														onClick={() => {
															if (
																onNavigateToSpecies &&
																stage.speciesId != null &&
																stage.speciesId !== speciesId
															)
																onNavigateToSpecies(stage.speciesId)
														}}
														role={
															onNavigateToSpecies &&
															stage.speciesId != null &&
															stage.speciesId !== speciesId
																? 'button'
																: undefined
														}
														tabIndex={
															onNavigateToSpecies &&
															stage.speciesId != null &&
															stage.speciesId !== speciesId
																? 0
																: undefined
														}>
														<img
															className='dex-modal__evo-sprite'
															src={
																getPreferredSpriteFromDto(
																	stage.speciesId != null
																		? buildSpritesForId(stage.speciesId, stage.name)
																		: null,
																	spriteType,
																	false
																) ?? ''
															}
															alt={stage.name}
															onError={(e) => {
																;(e.target as HTMLImageElement).style.display = 'none'
															}}
														/>
														<span className='dex-modal__evo-name'>{stage.name}</span>
													</div>
												</React.Fragment>
											))}
										</div>
									))}
								</div>
							</section>
						)}

						{/* ── Info ── */}
						<section className='dex-modal__section'>
							<h3 className='dex-modal__section-title'>Info</h3>
							<div className='dex-modal__info-grid'>
								<span className='dex-modal__info-label'>Capture Rate</span>
								<span>{detail.captureRate}</span>
								<span className='dex-modal__info-label'>Base Happiness</span>
								<span>{detail.baseHappiness}</span>
								<span className='dex-modal__info-label'>Gender Ratio</span>
								<span>
									{detail.genderRate === -1
										? 'Genderless'
										: `${Math.round((detail.genderRate / 8) * 100)}% ♀`}
								</span>
								<span className='dex-modal__info-label'>Egg Groups</span>
								<span>{detail.eggGroups.join(', ')}</span>
								<span className='dex-modal__info-label'>Generation</span>
								<span>{detail.generation}</span>
								<span className='dex-modal__info-label'>Color</span>
								<span style={{ textTransform: 'capitalize' }}>{detail.color}</span>
							</div>
						</section>

						{/* ── Owned Pokémon ── */}
						{detail.ownedPokemon.length > 0 && (
							<section className='dex-modal__section'>
								<h3 className='dex-modal__section-title'>
									Your Pokémon ({detail.ownedPokemon.length})
								</h3>
								<div className='dex-modal__owned-list'>
									{detail.ownedPokemon.map((p) => (
										<div
											key={p.id}
											className={`dex-modal__owned-card${p.isShiny ? ' dex-modal__owned-card--shiny' : ''}${onViewPokemon ? ' dex-modal__owned-card--clickable' : ''}`}
											onClick={() => onViewPokemon?.(p)}
											role={onViewPokemon ? 'button' : undefined}
											tabIndex={onViewPokemon ? 0 : undefined}>
											{p.spriteUrl && (
												<img
													className='dex-modal__owned-sprite'
													src={p.spriteUrl}
													alt={p.nickname || p.formName}
												/>
											)}
											<div className='dex-modal__owned-info'>
												<span className='dex-modal__owned-name'>
													{p.nickname || p.formName}
													{p.isShiny && <span className='dex-modal__shiny-star'>★</span>}
												</span>
												<span className='dex-modal__owned-detail'>
													Lv.{p.level} · {p.originGame}
												</span>
											</div>
											{onViewPokemon && <span className='dex-modal__owned-arrow'>›</span>}
										</div>
									))}
								</div>
							</section>
						)}
					</>
				)}
			</div>
		</div>,
		document.body
	)
}
