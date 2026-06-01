import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PokemonDetailDto } from '@/models/Pokemon'
import type { PokemonListItemDto } from '@/models/api/types'
import { getPokemonById } from '@/services'
import { getPreferredSpriteFromDto, resolveSpriteUrl } from '@/utils/spriteUtils'
import { getComputedTypeColor } from '@/utils/typeColors'
import { useUISettings } from '@/hooks/useUISettings'

type Tab = 'summary' | 'battle' | 'tags'

interface PokemonDetailPanelProps {
	pokemon: PokemonListItemDto
	onDownload?: (id: number) => void
	onDelete?: (id: number) => void
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
	onDelete,
	onManageTags,
}: PokemonDetailPanelProps) {
	const [detail, setDetail] = useState<PokemonDetailDto | null>(null)
	const [loading, setLoading] = useState(false)
	const [tab, setTab] = useState<Tab>('summary')
	const { spriteType } = useUISettings()
	const navigate = useNavigate()

	useEffect(() => {
		setLoading(true)
		setDetail(null)
		getPokemonById(pokemon.id)
			.then(setDetail)
			.catch(() => setDetail(null))
			.finally(() => setLoading(false))
	}, [pokemon.id])

	const sprite = getPreferredSpriteFromDto(pokemon.sprites, spriteType, pokemon.isShiny)

	const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
		e.currentTarget.style.display = 'none'
	}, [])

	const tabs: { key: Tab; label: string }[] = [
		{ key: 'summary', label: 'Summary' },
		{ key: 'battle', label: 'Battle & Moves' },
		{ key: 'tags', label: 'Tags' },
	]

	return (
		<div>
			{/* Hero */}
			<div className='pokemon-detail__hero'>
				<div className='pokemon-detail__hero-sprite'>
					{sprite ? (
						<img src={sprite} alt={pokemon.speciesName} onError={handleImgError} />
					) : (
						<span style={{ fontSize: '2rem', opacity: 0.3 }}>?</span>
					)}
				</div>
				<div className='pokemon-detail__hero-info'>
					<h3 className='pokemon-detail__name'>{pokemon.nickname || pokemon.speciesName}</h3>
					<p className='pokemon-detail__subtitle'>
						#{pokemon.speciesId?.toString().padStart(3, '0')}
						{pokemon.nickname ? ` · ${pokemon.speciesName}` : ''}
						{detail?.displayFormName ? ` (${detail.displayFormName})` : ''}
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
						<span className='pokemon-detail__badge pokemon-detail__badge--level'>
							Lv.{pokemon.level}
						</span>
						{pokemon.isShiny && (
							<span className='pokemon-detail__badge pokemon-detail__badge--shiny'>Shiny</span>
						)}
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className='pokemon-detail__actions'>
				{onDownload && (
					<button className='action-btn' onClick={() => onDownload(pokemon.id)}>
						Download
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
				{onDelete && (
					<button className='action-btn action-btn--danger' onClick={() => onDelete(pokemon.id)}>
						Delete
					</button>
				)}
			</div>

			{/* Tabs */}
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

			{/* Content */}
			{loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</p>}

			{detail && tab === 'summary' && (
				<div className='pokemon-detail__section'>
					<div className='pokemon-detail__section-title'>Identity</div>
					<Row label='OT' value={detail.otName} />
					<Row
						label='Nature'
						value={
							<>
								{detail.natureName}
								{detail.natureBoostedStat && (
									<span style={{ color: '#e57373', marginLeft: 4, fontSize: '0.7rem' }}>
										+{detail.natureBoostedStat}
									</span>
								)}
								{detail.natureReducedStat && (
									<span style={{ color: '#64b5f6', marginLeft: 4, fontSize: '0.7rem' }}>
										-{detail.natureReducedStat}
									</span>
								)}
							</>
						}
					/>
					<Row label='Ability' value={detail.abilityName} />
					<Row label='Gender' value={detail.genderName} />
					<Row
						label='Ball'
						value={
							<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
								{detail.ballSpriteUrl && (
									<img
										src={resolveSpriteUrl(detail.ballSpriteUrl) ?? ''}
										alt=''
										style={{ width: 16, height: 16 }}
										onError={handleImgError}
									/>
								)}
								{detail.ballName}
							</span>
						}
					/>
					{detail.heldItemName && detail.heldItemName !== '(None)' && (
						<Row
							label='Held Item'
							value={
								<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
									{detail.heldItemSpriteUrl && (
										<img
											src={resolveSpriteUrl(detail.heldItemSpriteUrl) ?? ''}
											alt=''
											style={{ width: 16, height: 16 }}
											onError={handleImgError}
										/>
									)}
									{detail.heldItemName}
								</span>
							}
						/>
					)}
					{detail.teraTypeName && <Row label='Tera Type' value={detail.teraTypeName} />}
					<Row label='Language' value={detail.languageName} />
					<Row label='Friendship' value={`${detail.effectiveFriendship}/255`} />

					<div className='pokemon-detail__section-title' style={{ marginTop: 12 }}>
						Origin
					</div>
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
					<Row label='Fateful' value={detail.fatefulEncounter ? 'Yes' : 'No'} />
					{detail.isEgg && <Row label='Egg' value='Yes' />}

					<div className='pokemon-detail__section-title' style={{ marginTop: 12 }}>
						Technical
					</div>
					<Row label='TID' value={detail.tid} />
					<Row label='SID' value={detail.sid} />
					<Row label='PID' value={detail.personalityIdHex} />
					<Row label='EC' value={detail.encryptionConstantHex} />
					{detail.displayFormName && <Row label='Form' value={detail.displayFormName} />}
					{detail.formArgument > 0 && <Row label='Form Arg' value={detail.formArgument} />}
					{detail.scale > 0 && <Row label='Scale' value={detail.scale} />}
					{detail.heightScalar > 0 && <Row label='Height' value={detail.heightScalar} />}
					{detail.weightScalar > 0 && <Row label='Weight' value={detail.weightScalar} />}
					{detail.pokerusStrain > 0 && (
						<Row
							label='Pokérus'
							value={`Strain ${detail.pokerusStrain} / ${detail.pokerusDays}d`}
						/>
					)}

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

			{detail && tab === 'battle' && (
				<>
					{/* Stats */}
					<div className='pokemon-detail__section'>
						<div className='pokemon-detail__section-title'>Stats</div>
						{detail.stats &&
							(['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'] as const).map((label) => {
								const keyMap: Record<string, { stat: string; iv: string; ev: string; ht: string }> =
									{
										HP: { stat: 'statHp', iv: 'ivHp', ev: 'evHp', ht: 'hyperTrainedHp' },
										Atk: { stat: 'statAtk', iv: 'ivAtk', ev: 'evAtk', ht: 'hyperTrainedAtk' },
										Def: { stat: 'statDef', iv: 'ivDef', ev: 'evDef', ht: 'hyperTrainedDef' },
										SpA: { stat: 'statSpa', iv: 'ivSpa', ev: 'evSpa', ht: 'hyperTrainedSpa' },
										SpD: { stat: 'statSpd', iv: 'ivSpd', ev: 'evSpd', ht: 'hyperTrainedSpd' },
										Spe: { stat: 'statSpe', iv: 'ivSpe', ev: 'evSpe', ht: 'hyperTrainedSpe' },
									}
								const k = keyMap[label]
								const stat = (detail.stats as any)[k.stat] as number
								const iv = (detail.stats as any)[k.iv] as number
								const ev = (detail.stats as any)[k.ev] as number
								const ht = (detail.stats as any)[k.ht] as boolean
								const pct = Math.min((stat / 255) * 100, 100)
								const isBoosted = detail.natureBoostedStat === label
								const isReduced = detail.natureReducedStat === label

								return (
									<div key={label} className='pokemon-detail__stat'>
										<span
											className='pokemon-detail__stat-name'
											style={{
												color: isBoosted ? '#e57373' : isReduced ? '#64b5f6' : undefined,
											}}>
											{label}
										</span>
										<div className='pokemon-detail__stat-bar'>
											<div
												className='pokemon-detail__stat-fill'
												style={{
													width: `${pct}%`,
													background: isBoosted
														? '#e57373'
														: isReduced
															? '#64b5f6'
															: 'var(--color-primary)',
												}}
											/>
										</div>
										<span className='pokemon-detail__stat-value'>{stat}</span>
										<span
											style={{
												fontSize: '0.6rem',
												color: 'var(--text-muted)',
												width: 50,
												textAlign: 'right',
											}}>
											{ht ? '★' : iv}
											{detail.originGeneration > 2 ? `/${ev}` : ''}
										</span>
									</div>
								)
							})}
					</div>

					{/* Moves */}
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

						{detail.relearnMoves && detail.relearnMoves.length > 0 && (
							<>
								<div className='pokemon-detail__section-title' style={{ marginTop: 12 }}>
									Relearn Moves
								</div>
								{detail.relearnMoves.map((m, i) => (
									<div key={i} className='pokemon-detail__move'>
										<span className='pokemon-detail__move-name'>{m.moveName}</span>
									</div>
								))}
							</>
						)}
					</div>
				</>
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
