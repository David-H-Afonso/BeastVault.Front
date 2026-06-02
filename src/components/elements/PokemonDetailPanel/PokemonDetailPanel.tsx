import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PokemonDetailDto } from '@/models/Pokemon'
import type { PokemonListItemDto } from '@/models/api/types'
import { getPokemonById } from '@/services'
import { useUISettings } from '@/hooks/useUISettings'
import { getComputedTypeColor } from '@/utils/typeColors'
import { getPreferredSpriteFromDto, resolveSpriteUrl } from '@/utils/spriteUtils'
import { HomeStatRadar } from '@/components/elements/HomeStatRadar/HomeStatRadar'

type Tab = 'summary' | 'stats' | 'battle' | 'origin' | 'tags'

interface DetailStatRow {
	label: 'HP' | 'Atk' | 'Def' | 'SpA' | 'SpD' | 'Spe'
	stat: number
	iv: number
	ev: number
	ht: boolean
	pct: number
	isBoosted: boolean
	isReduced: boolean
}

interface PokemonDetailPanelProps {
	pokemon: PokemonListItemDto
	onDownload?: (id: number) => void
	onDownloadDisk?: (id: number) => void
	onDownloadBackup?: (id: number) => void
	onShowdown?: (id: number) => Promise<void>
	onDelete?: (id: number) => void
	onDeletePermanent?: (id: number) => void
	onToggleFavorite?: (pokemon: PokemonListItemDto) => Promise<void>
	onManageTags?: (pokemon: PokemonListItemDto) => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	if (value == null || value === '' || value === '—') return null
	return (
		<div className='pokemon-detail__row'>
			<span className='pokemon-detail__row-label'>{label}</span>
			<span className='pokemon-detail__row-value'>{value}</span>
		</div>
	)
}

export function PokemonDetailPanel({
	pokemon,
	onDownload,
	onDownloadDisk,
	onDownloadBackup,
	onShowdown,
	onDelete,
	onDeletePermanent,
	onToggleFavorite,
	onManageTags,
}: PokemonDetailPanelProps) {
	const [detail, setDetail] = useState<PokemonDetailDto | null>(null)
	const [loading, setLoading] = useState(false)
	const [tab, setTab] = useState<Tab>('summary')
	const [actionsOpen, setActionsOpen] = useState(false)
	const [showdownCopied, setShowdownCopied] = useState(false)
	const navigate = useNavigate()
	const { spriteType } = useUISettings()

	useEffect(() => {
		setLoading(true)
		setDetail(null)
		getPokemonById(pokemon.id)
			.then(setDetail)
			.catch(() => setDetail(null))
			.finally(() => setLoading(false))
	}, [pokemon.id])

	const sprite = getPreferredSpriteFromDto(pokemon.sprites, spriteType, pokemon.isShiny)
	const isFavorite = detail?.favorite ?? pokemon.favorite

	const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
		e.currentTarget.style.display = 'none'
	}, [])

	const tabs: { key: Tab; label: string }[] = [
		{ key: 'summary', label: 'Summary' },
		{ key: 'stats', label: 'Stats' },
		{ key: 'battle', label: 'Battle' },
		{ key: 'origin', label: 'Trainer' },
		{ key: 'tags', label: 'Tags' },
	]

	const statRows = useMemo<DetailStatRow[]>(() => {
		if (!detail?.stats) return []
		const keyMap: Record<string, { stat: string; iv: string; ev: string; ht: string }> = {
			HP: { stat: 'statHp', iv: 'ivHp', ev: 'evHp', ht: 'hyperTrainedHp' },
			Atk: { stat: 'statAtk', iv: 'ivAtk', ev: 'evAtk', ht: 'hyperTrainedAtk' },
			Def: { stat: 'statDef', iv: 'ivDef', ev: 'evDef', ht: 'hyperTrainedDef' },
			SpA: { stat: 'statSpa', iv: 'ivSpa', ev: 'evSpa', ht: 'hyperTrainedSpa' },
			SpD: { stat: 'statSpd', iv: 'ivSpd', ev: 'evSpd', ht: 'hyperTrainedSpd' },
			Spe: { stat: 'statSpe', iv: 'ivSpe', ev: 'evSpe', ht: 'hyperTrainedSpe' },
		}

		return (['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'] as const).map((label) => {
			const k = keyMap[label]
			const stat = (detail.stats as any)[k.stat] as number
			const iv = (detail.stats as any)[k.iv] as number
			const ev = (detail.stats as any)[k.ev] as number
			const ht = (detail.stats as any)[k.ht] as boolean
			const pct = Math.min((stat / 255) * 100, 100)
			const isBoosted = detail.natureBoostedStat === label
			const isReduced = detail.natureReducedStat === label

			return {
				label,
				stat,
				iv,
				ev,
				ht,
				pct,
				isBoosted,
				isReduced,
			}
		})
	}, [detail])

	const radarRows = useMemo(() => {
		const displayLabel: Record<DetailStatRow['label'], string> = {
			HP: 'HP',
			Atk: 'Attack',
			Def: 'Defense',
			SpA: 'Sp. Atk',
			SpD: 'Sp. Def',
			Spe: 'Speed',
		}
		const byLabel = new Map(statRows.map((row) => [row.label, row]))
		return (['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA'] as const)
			.map((label) => byLabel.get(label))
			.filter(Boolean)
			.map((row) => ({
				key: row!.label,
				label: displayLabel[row!.label],
				value: row!.stat,
				tone: row!.isBoosted
					? ('boosted' as const)
					: row!.isReduced
						? ('reduced' as const)
						: undefined,
			}))
	}, [statRows])

	const handleShowdown = async () => {
		if (!onShowdown) return
		await onShowdown(pokemon.id)
		setShowdownCopied(true)
		window.setTimeout(() => setShowdownCopied(false), 1600)
	}

	const handleToggleFavorite = async () => {
		if (!onToggleFavorite) return
		const nextFavorite = !isFavorite
		await onToggleFavorite(pokemon)
		setDetail((current) => (current ? { ...current, favorite: nextFavorite } : current))
	}

	return (
		<div className='pokemon-detail pokemon-detail--home'>
			<div className='pokemon-detail__hero'>
				<div className='pokemon-detail__hero-sprite'>
					{sprite ? (
						<img src={sprite} alt={pokemon.speciesName} onError={handleImgError} />
					) : (
						<span style={{ fontSize: '2rem', opacity: 0.3 }}>?</span>
					)}
				</div>
				<div className='pokemon-detail__hero-info'>
					<div className='pokemon-detail__hero-topline'>
						<p className='pokemon-detail__hero-meta'>
							#{pokemon.speciesId?.toString().padStart(4, '0')}
							{detail?.displayFormName ? ` · ${detail.displayFormName}` : ''}
						</p>
						<div className='pokemon-detail__hero-flags'>
							<span className='pokemon-detail__badge pokemon-detail__badge--level'>
								Lv.{pokemon.level}
							</span>
							{detail?.languageName && (
								<span className='pokemon-detail__badge pokemon-detail__badge--level'>
									{detail.languageName}
								</span>
							)}
							{detail?.genderName && (
								<span className='pokemon-detail__badge pokemon-detail__badge--level'>
									{detail.genderName}
								</span>
							)}
						</div>
					</div>
					<h3 className='pokemon-detail__name'>{pokemon.nickname || pokemon.speciesName}</h3>
					<p className='pokemon-detail__subtitle'>
						{pokemon.nickname ? pokemon.speciesName : detail?.originGameName || 'Vault Pokémon'}
					</p>
					<div className='pokemon-detail__badges'>
						{pokemon.type1 && (
							<span
								className='pokemon-detail__badge pokemon-detail__badge--type'
								style={{ backgroundColor: getComputedTypeColor(pokemon.type1) }}>
								{pokemon.type1}
							</span>
						)}
						{pokemon.type2 && (
							<span
								className='pokemon-detail__badge pokemon-detail__badge--type'
								style={{ backgroundColor: getComputedTypeColor(pokemon.type2) }}>
								{pokemon.type2}
							</span>
						)}
						{pokemon.isShiny && (
							<span className='pokemon-detail__badge pokemon-detail__badge--shiny'>Shiny</span>
						)}
						{isFavorite && (
							<span className='pokemon-detail__badge pokemon-detail__badge--favorite'>
								Favorite
							</span>
						)}
					</div>
				</div>
			</div>

			<div className='pokemon-detail__actions'>
				{onToggleFavorite && (
					<button className='action-btn' onClick={handleToggleFavorite}>
						{isFavorite ? 'Unfavorite' : 'Favorite'}
					</button>
				)}
				{onShowdown && (
					<button className='action-btn' onClick={handleShowdown}>
						{showdownCopied ? 'Copied' : 'Showdown'}
					</button>
				)}
				{onManageTags && (
					<button className='action-btn' onClick={() => onManageTags(pokemon)}>
						Tags
					</button>
				)}
				<button className='action-btn' onClick={() => navigate(`/dex/${pokemon.speciesId}`)}>
					Pokédex
				</button>
				{onDownload && (
					<button className='action-btn' onClick={() => onDownload(pokemon.id)}>
						Download
					</button>
				)}
				{(onDownloadDisk || onDownloadBackup || onDeletePermanent) && (
					<div className='pokemon-detail__more'>
						<button className='action-btn' onClick={() => setActionsOpen((open) => !open)}>
							More
						</button>
						{actionsOpen && (
							<div className='pokemon-detail__more-menu'>
								{onDownloadDisk && (
									<button onClick={() => onDownloadDisk(pokemon.id)}>Download disk file</button>
								)}
								{onDownloadBackup && (
									<button onClick={() => onDownloadBackup(pokemon.id)}>Download backup</button>
								)}
								{onDeletePermanent && (
									<button
										className='pokemon-detail__danger-action'
										onClick={() => onDeletePermanent(pokemon.id)}>
										Delete permanently
									</button>
								)}
							</div>
						)}
					</div>
				)}
				{onDelete && (
					<button className='action-btn action-btn--danger' onClick={() => onDelete(pokemon.id)}>
						Delete
					</button>
				)}
			</div>

			<div className='pokemon-detail__tabs'>
				{tabs.map((t) => (
					<button
						key={t.key}
						className={`pokemon-detail__tab ${tab === t.key ? 'pokemon-detail__tab--active' : ''}`}
						onClick={() => setTab(t.key)}>
						{t.label}
					</button>
				))}
			</div>

			{loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</p>}

			{detail && tab === 'summary' && (
				<div className='pokemon-detail__home-summary'>
					<div className='pokemon-detail__home-id-strip'>
						<span>No. {pokemon.speciesId?.toString().padStart(4, '0')}</span>
						<strong>{pokemon.nickname || pokemon.speciesName}</strong>
						<span>{detail.ballName || detail.languageName}</span>
					</div>

					<div className='pokemon-detail__home-markings' aria-hidden='true'>
						<span />
						<span />
						<span />
						<span />
						<span />
						<span />
					</div>

					<div className='pokemon-detail__home-battle-card'>
						<HomeStatRadar rows={radarRows} />
						<div className='pokemon-detail__home-moves'>
							{detail.moves && detail.moves.length > 0 ? (
								detail.moves.map((m, index) => {
									const moveType = index % 2 === 0 ? pokemon.type1 : pokemon.type2 || pokemon.type1
									return (
										<div key={m.slot} className='pokemon-detail__home-move-pill'>
											<span
												className='pokemon-detail__home-move-type'
												style={{
													backgroundColor: moveType ? getComputedTypeColor(moveType) : undefined,
												}}
											/>
											<span className='pokemon-detail__move-name'>{m.moveName}</span>
											<span className='pokemon-detail__move-pp'>PP {m.currentPp}</span>
										</div>
									)
								})
							) : (
								<p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No moves data</p>
							)}
						</div>
					</div>

					<div className='pokemon-detail__home-pill-grid'>
						<div className='pokemon-detail__home-data-pill'>
							<span>Ability</span>
							<strong>{detail.abilityName || 'Unknown'}</strong>
						</div>
						<div className='pokemon-detail__home-data-pill'>
							<span>Nature</span>
							<strong>
								{detail.natureName || 'Unknown'}
								{detail.natureBoostedStat && <em> +{detail.natureBoostedStat}</em>}
								{detail.natureReducedStat && (
									<em className='is-reduced'> -{detail.natureReducedStat}</em>
								)}
							</strong>
						</div>
					</div>

					<div className='pokemon-detail__home-ot-strip'>
						<span>OT</span>
						<strong>{detail.otName || 'Unknown'}</strong>
						<span>ID No.</span>
						<strong>{detail.tid}</strong>
					</div>

					<div className='pokemon-detail__home-notes'>
						<div className='pokemon-detail__section-title'>Trainer notes</div>
						<p>
							{detail.natureName && (
								<>
									Nature: <strong>{detail.natureName}</strong>.{' '}
								</>
							)}
							{detail.metLocationName && (
								<>
									Seems to have been first met in <strong>{detail.metLocationName}</strong>
								</>
							)}
							{detail.metDate && (
								<>
									{' '}
									on{' '}
									{new Date(detail.metDate).toLocaleDateString(undefined, {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
									})}
									.
								</>
							)}
						</p>
						<Row label='First Met' value={detail.originGameName} />
						<Row label='Friendship' value={`${detail.effectiveFriendship}/255`} />
						{detail.heldItemName && detail.heldItemName !== '(None)' && (
							<Row label='Held Item' value={detail.heldItemName} />
						)}
					</div>
				</div>
			)}
			{detail && tab === 'stats' && (
				<div className='pokemon-detail__section pokemon-detail__home-stats-panel'>
					<div className='pokemon-detail__section-title'>Battle Stats</div>
					<HomeStatRadar rows={radarRows} />
					{statRows.map((row) => (
						<div key={row.label} className='pokemon-detail__stat'>
							<span
								className='pokemon-detail__stat-name'
								style={{
									color: row.isBoosted ? '#e57373' : row.isReduced ? '#64b5f6' : undefined,
								}}>
								{row.label}
							</span>
							<div className='pokemon-detail__stat-bar'>
								<div
									className='pokemon-detail__stat-fill'
									style={{
										width: `${row.pct}%`,
										background: row.isBoosted
											? '#e57373'
											: row.isReduced
												? '#64b5f6'
												: 'var(--color-primary)',
									}}
								/>
							</div>
							<span className='pokemon-detail__stat-value'>{row.stat}</span>
							<span className='pokemon-detail__stat-train'>
								{row.ht ? '★' : row.iv}
								{detail.originGeneration > 2 ? `/${row.ev}` : ''}
							</span>
						</div>
					))}
				</div>
			)}

			{detail && tab === 'battle' && (
				<>
					<div className='pokemon-detail__section'>
						<div className='pokemon-detail__section-title'>Moves</div>
						{detail.moves && detail.moves.length > 0 ? (
							detail.moves.map((m) => (
								<div key={m.slot} className='pokemon-detail__move'>
									<span className='pokemon-detail__move-name'>{m.moveName}</span>
									<span className='pokemon-detail__move-pp'>
										PP {m.currentPp}/{m.ppUps > 0 ? `+${m.ppUps}` : '0'}
									</span>
								</div>
							))
						) : (
							<p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No moves data</p>
						)}
					</div>

					{detail.relearnMoves && detail.relearnMoves.length > 0 && (
						<div className='pokemon-detail__section'>
							<div className='pokemon-detail__section-title'>Relearn Moves</div>
							{detail.relearnMoves.map((m, i) => (
								<div key={i} className='pokemon-detail__move'>
									<span className='pokemon-detail__move-name'>{m.moveName}</span>
								</div>
							))}
						</div>
					)}

					<div className='pokemon-detail__section'>
						<div className='pokemon-detail__section-title'>Technical</div>
						<Row label='PID' value={detail.personalityIdHex} />
						<Row label='EC' value={detail.encryptionConstantHex} />
						{detail.displayFormName && <Row label='Form' value={detail.displayFormName} />}
						{detail.formArgument > 0 && <Row label='Form Arg' value={detail.formArgument} />}
						{detail.scale > 0 && <Row label='Scale' value={detail.scale} />}
						{detail.heightScalar > 0 && <Row label='Height Scalar' value={detail.heightScalar} />}
						{detail.weightScalar > 0 && <Row label='Weight Scalar' value={detail.weightScalar} />}
					</div>
				</>
			)}

			{detail && tab === 'origin' && (
				<div className='pokemon-detail__section'>
					<div className='pokemon-detail__section-title'>Trainer Notes</div>
					<Row label='Game' value={detail.originGameName} />
					<Row label='Generation' value={`Gen ${detail.originGeneration}`} />
					<Row label='Met Level' value={`Lv.${detail.metLevel}`} />
					<Row label='Met Location' value={detail.metLocationName} />
					{detail.metDate && (
						<Row
							label='Met Date'
							value={new Date(detail.metDate).toLocaleDateString(undefined, {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
							})}
						/>
					)}
					<Row label='OT Gender' value={detail.otGenderName} />
					<Row label='OT Language' value={detail.otLanguageName} />
					<Row label='Fateful' value={detail.fatefulEncounter ? 'Yes' : 'No'} />
					{detail.pokerusStrain > 0 && (
						<Row
							label='Pokérus'
							value={`Strain ${detail.pokerusStrain} / ${detail.pokerusDays}d`}
						/>
					)}
					{detail.isEgg && <Row label='Egg' value='Yes' />}
					{(detail.contestCool > 0 ||
						detail.contestBeauty > 0 ||
						detail.contestCute > 0 ||
						detail.contestSmart > 0 ||
						detail.contestTough > 0) && (
						<>
							<div className='pokemon-detail__section-title' style={{ marginTop: 12 }}>
								Contest
							</div>
							<Row label='Cool' value={detail.contestCool} />
							<Row label='Beauty' value={detail.contestBeauty} />
							<Row label='Cute' value={detail.contestCute} />
							<Row label='Smart' value={detail.contestSmart} />
							<Row label='Tough' value={detail.contestTough} />
							<Row label='Sheen' value={detail.contestSheen} />
						</>
					)}
				</div>
			)}

			{tab === 'tags' && (
				<div className='pokemon-detail__section'>
					<div className='pokemon-detail__section-title'>Tags</div>
					{pokemon.tags && pokemon.tags.length > 0 ? (
						<div className='pokemon-detail__tags'>
							{pokemon.tags.map((tag) => (
								<span key={tag.id} className='pokemon-detail__tag'>
									{tag.colorHex && (
										<span
											className='pokemon-detail__tag-dot'
											style={{ background: tag.colorHex }}
										/>
									)}
									{tag.name}
								</span>
							))}
						</div>
					) : (
						<p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No tags assigned</p>
					)}

					{detail?.ballSpriteUrl && (
						<div className='pokemon-detail__section' style={{ marginTop: 12 }}>
							<div className='pokemon-detail__section-title'>Visual Data</div>
							<Row
								label='Ball'
								value={
									<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
										<img
											src={resolveSpriteUrl(detail.ballSpriteUrl) ?? ''}
											alt=''
											style={{ width: 18, height: 18 }}
											onError={handleImgError}
										/>
										{detail.ballName}
									</span>
								}
							/>
							{detail.heldItemName && detail.heldItemName !== '(None)' && (
								<Row
									label='Held Item'
									value={
										<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
											{detail.heldItemSpriteUrl && (
												<img
													src={resolveSpriteUrl(detail.heldItemSpriteUrl) ?? ''}
													alt=''
													style={{ width: 18, height: 18 }}
													onError={handleImgError}
												/>
											)}
											{detail.heldItemName}
										</span>
									}
								/>
							)}
						</div>
					)}

					{onManageTags && (
						<button
							className='action-btn'
							style={{ marginTop: 8 }}
							onClick={() => onManageTags(pokemon)}>
							Edit Tags
						</button>
					)}
				</div>
			)}
		</div>
	)
}
