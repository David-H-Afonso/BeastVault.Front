import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DexSpeciesDetail, DexOwnedPokemon, DexGenerationSprites } from '@/services/DexService'
import { getComputedTypeColor } from '@/utils/typeColors'
import { formatSlugName } from '@/utils/formatSlugName'
import { resolveSpriteUrl } from '@/utils/spriteUtils'
import { HomeStatRadar } from '@/components/elements/HomeStatRadar/HomeStatRadar'

type DexTab = 'info' | 'entries' | 'locations' | 'sprites' | 'owned'

const STAT_LABELS: Record<string, string> = {
	'hp': 'HP',
	'attack': 'Atk',
	'defense': 'Def',
	'special-attack': 'Sp. Atk',
	'special-defense': 'Sp. Def',
	'speed': 'Spe',
}

const GAME_LABELS: Record<string, string> = {
	// Individual games
	'red': 'Red',
	'blue': 'Blue',
	'yellow': 'Yellow',
	'gold': 'Gold',
	'silver': 'Silver',
	'crystal': 'Crystal',
	'ruby': 'Ruby',
	'sapphire': 'Sapphire',
	'emerald': 'Emerald',
	'firered': 'FireRed',
	'leafgreen': 'LeafGreen',
	'diamond': 'Diamond',
	'pearl': 'Pearl',
	'platinum': 'Platinum',
	'heartgold': 'HeartGold',
	'soulsilver': 'SoulSilver',
	'black': 'Black',
	'white': 'White',
	'black-2': 'Black 2',
	'white-2': 'White 2',
	'x': 'X',
	'y': 'Y',
	'omega-ruby': 'Omega Ruby',
	'alpha-sapphire': 'Alpha Sapphire',
	'sun': 'Sun',
	'moon': 'Moon',
	'ultra-sun': 'Ultra Sun',
	'ultra-moon': 'Ultra Moon',
	'sword': 'Sword',
	'shield': 'Shield',
	'brilliant-diamond': 'Brilliant Diamond',
	'shining-pearl': 'Shining Pearl',
	'legends-arceus': 'Legends: Arceus',
	'scarlet': 'Scarlet',
	'violet': 'Violet',
	'legends-za': 'Legends: Z-A',
	'pokopia': 'Pokopia',
	'stadium': 'Stadium',
	'stadium-2': 'Stadium 2',
	'lets-go-pikachu': "Let's Go Pikachu",
	'lets-go-eevee': "Let's Go Eevee",
	'the-teal-mask': 'The Teal Mask',
	'the-indigo-disk': 'The Indigo Disk',
	'paldean-fates': 'Paldean Fates',
	// PokeAPI version group keys (used in sprites.versions)
	'red-blue': 'Red / Blue',
	'gold-silver': 'Gold / Silver',
	'ruby-sapphire': 'Ruby / Sapphire',
	'firered-leafgreen': 'FireRed / LeafGreen',
	'diamond-pearl': 'Diamond / Pearl',
	'heartgold-soulsilver': 'HeartGold / SoulSilver',
	'black-white': 'Black / White',
	'x-y': 'X / Y',
	'omegaruby-alphasapphire': 'Omega Ruby / Alpha Sapphire',
	'sun-moon': 'Sun / Moon',
	'ultra-sun-ultra-moon': 'Ultra Sun / Ultra Moon',
	'icons': 'Icons',
	'generation-viii': 'Gen 8',
	'generation-ix': 'Gen 9',
	'scarlet-violet': 'Scarlet / Violet',
	'brilliant-diamond-shining-pearl': 'Brilliant Diamond / Shining Pearl',
}

/** Canonical game release order for sorting sprites and entries */
const GAME_RELEASE_ORDER: string[] = [
	'red',
	'blue',
	'red-blue',
	'yellow',
	'stadium',
	'gold',
	'silver',
	'gold-silver',
	'crystal',
	'stadium-2',
	'ruby',
	'sapphire',
	'ruby-sapphire',
	'emerald',
	'firered',
	'leafgreen',
	'firered-leafgreen',
	'diamond',
	'pearl',
	'diamond-pearl',
	'platinum',
	'heartgold',
	'soulsilver',
	'heartgold-soulsilver',
	'black',
	'white',
	'black-white',
	'black-2',
	'white-2',
	'x',
	'y',
	'x-y',
	'omega-ruby',
	'alpha-sapphire',
	'omegaruby-alphasapphire',
	'sun',
	'moon',
	'sun-moon',
	'ultra-sun',
	'ultra-moon',
	'ultra-sun-ultra-moon',
	'lets-go-pikachu',
	'lets-go-eevee',
	'sword',
	'shield',
	'brilliant-diamond',
	'shining-pearl',
	'brilliant-diamond-shining-pearl',
	'legends-arceus',
	'scarlet',
	'violet',
	'scarlet-violet',
	'the-teal-mask',
	'the-indigo-disk',
	'legends-za',
	'pokopia',
	'generation-viii',
	'generation-ix',
	'icons',
]

function gameReleaseIndex(slug: string): number {
	// Strip region suffix before looking up order
	const base = splitRegionSuffix(slug).base.toLowerCase()
	const idx = GAME_RELEASE_ORDER.indexOf(base)
	return idx >= 0 ? idx : GAME_RELEASE_ORDER.length - 2
}

function sortByRelease<T extends { label?: string; gameVersion?: string; game?: string }>(
	items: T[]
): T[] {
	return [...items].sort((a, b) => {
		const ka = a.label ?? a.gameVersion ?? a.game ?? ''
		const kb = b.label ?? b.gameVersion ?? b.game ?? ''
		return gameReleaseIndex(ka) - gameReleaseIndex(kb)
	})
}

function formatStatName(raw: string): string {
	return (
		STAT_LABELS[raw.toLowerCase()] ??
		raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	)
}

/** Region suffixes that PokeAPI appends to version names */
const REGION_SUFFIX: Record<string, string> = {
	japan: 'JP',
	japanese: 'JP',
	north_america: 'NA',
	northamerica: 'NA',
	usa: 'US',
	us: 'US',
	korea: 'KR',
	korean: 'KR',
	europe: 'EU',
	european: 'EU',
	germany: 'DE',
	german: 'DE',
	france: 'FR',
	french: 'FR',
	spain: 'ES',
	spanish: 'ES',
	italy: 'IT',
	italian: 'IT',
}

/**
 * Strip trailing known region suffix from a slug, returning both
 * the base slug and optional region label.
 */
function splitRegionSuffix(slug: string): { base: string; region: string | null } {
	const lower = slug.toLowerCase()
	// Try each known suffix (longest match first to avoid false positives)
	for (const suffix of Object.keys(REGION_SUFFIX).sort((a, b) => b.length - a.length)) {
		if (lower.endsWith('-' + suffix)) {
			const base = slug.slice(0, slug.length - suffix.length - 1)
			return { base, region: REGION_SUFFIX[suffix] }
		}
	}
	return { base: slug, region: null }
}

function formatGameSlug(raw: string): string {
	const { base, region } = splitRegionSuffix(raw)
	const label =
		GAME_LABELS[base.toLowerCase()] ??
		base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	return region ? `${label} (${region})` : label
}

interface DexSpeciesPanelProps {
	detail: DexSpeciesDetail
	loading?: boolean
	onOwnedClick?: (p: DexOwnedPokemon) => void
	onClose?: () => void
}

function normalizeFlavorLanguage(language: string): string {
	return language === 'ja-Hrkt' ? 'ja' : language.toLowerCase()
}

function isDisplayableFlavorText(text?: string | null): boolean {
	const cleaned = text?.replace(/\s+/g, ' ').trim() ?? ''
	if (!cleaned) return false

	const normalized = cleaned
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()

	if (
		normalized === 'no entry' ||
		normalized === 'no entry.' ||
		normalized === 'no pokedex entry' ||
		normalized === 'no pokedex entry.'
	) {
		return false
	}

	if (
		normalized.startsWith('no entry') ||
		normalized.includes('no pokedex entry') ||
		normalized.includes('has no pokedex entry') ||
		normalized.includes('does not have a pokedex entry') ||
		normalized.includes('no tiene entrada') ||
		normalized.includes('sin entrada')
	) {
		return false
	}

	return !(
		normalized.includes('pokopia') &&
		(normalized.includes('not in') ||
			normalized.includes('not available') ||
			normalized.includes('unavailable') ||
			normalized.includes('no esta'))
	)
}

function isDisplayableLocation(location?: string | null, method?: string | null): boolean {
	const cleanedLocation = location?.replace(/\s+/g, ' ').trim() ?? ''
	if (!cleanedLocation) return false

	const normalized = `${cleanedLocation} ${method ?? ''}`
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()

	if (
		normalized.includes('unobtainable') ||
		normalized.includes('unavailable') ||
		normalized.includes('no entry') ||
		normalized.includes('no pokedex entry')
	) {
		return false
	}

	return !(
		normalized.includes('pokopia') &&
		(normalized.includes('not in') ||
			normalized.includes('not available') ||
			normalized.includes('unavailable') ||
			normalized.includes('no esta'))
	)
}

const HOME_STAT_ORDER = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack']

export function DexSpeciesPanel({ detail, loading, onOwnedClick }: DexSpeciesPanelProps) {
	const [tab, setTab] = useState<DexTab>('info')
	const [flavorLang, setFlavorLang] = useState('en')
	const navigate = useNavigate()
	const tabs: { key: DexTab; label: string }[] = [
		{ key: 'info', label: 'Info' },
		{ key: 'entries', label: 'Entries' },
		{ key: 'locations', label: 'Locations' },
		{ key: 'sprites', label: 'Sprites' },
		{ key: 'owned', label: `Owned (${detail.ownedPokemon.length})` },
	]

	// Filter entries to en, es, ja only
	const allowedLangs = ['en', 'es', 'ja']
	const langEntries = useMemo(
		() =>
			detail.flavorEntries
				.map((entry) => ({
					...entry,
					language: normalizeFlavorLanguage(entry.language),
					text: entry.text.replace(/\s+/g, ' ').trim(),
				}))
				.filter((e) => allowedLangs.includes(e.language) && isDisplayableFlavorText(e.text)),
		[detail.flavorEntries]
	)
	const uniqueFlavorLangs = useMemo(
		() => [...new Set(langEntries.map((e) => e.language))],
		[langEntries]
	)
	const filteredEntries = sortByRelease(langEntries.filter((e) => e.language === flavorLang))
	const flavorText = isDisplayableFlavorText(detail.flavorText)
		? detail.flavorText.replace(/\s+/g, ' ').trim()
		: ''

	useEffect(() => {
		if (uniqueFlavorLangs.length > 0 && !uniqueFlavorLangs.includes(flavorLang)) {
			setFlavorLang(uniqueFlavorLangs[0])
		}
	}, [flavorLang, uniqueFlavorLangs])

	// Sort sprites by game release order
	const sortedSprites = sortByRelease(
		detail.spritesByGeneration as (DexGenerationSprites & { label: string })[]
	)

	// Resolve hero sprite (prefer official artwork)
	const heroSprite =
		resolveSpriteUrl(detail.sprites?.official) ??
		resolveSpriteUrl(detail.sprites?.home) ??
		resolveSpriteUrl(detail.sprites?.default)

	const sortedLocations = sortByRelease(
		detail.locations.filter((loc) => isDisplayableLocation(loc.location, loc.method))
	)
	const baseStatRows = useMemo(() => {
		if (!detail.baseStats) return []
		return HOME_STAT_ORDER.map((key) => ({
			key,
			label: formatStatName(key),
			value: detail.baseStats[key] ?? 0,
		}))
	}, [detail.baseStats])

	const hideBrokenImage = (event: SyntheticEvent<HTMLImageElement>) => {
		event.currentTarget.style.display = 'none'
	}

	return (
		<div className='pokemon-detail pokemon-detail--home dex-detail--home'>
			{/* Header with close button */}
			<div className='pokemon-detail__hero'>
				<div className='pokemon-detail__hero-sprite'>
					{heroSprite ? (
						<img src={heroSprite} alt={detail.name} onError={hideBrokenImage} />
					) : (
						<span style={{ fontSize: '2rem', opacity: 0.3 }}>?</span>
					)}
				</div>
				<div className='pokemon-detail__hero-info'>
					<h3 className='pokemon-detail__name' style={{ margin: 0 }}>
						#{detail.speciesId.toString().padStart(4, '0')} {formatSlugName(detail.name)}
					</h3>
					<p className='pokemon-detail__subtitle'>{detail.genus}</p>
					{detail.japaneseName && (
						<div className='dex-detail__names'>
							<span className='dex-detail__jp-name'>
								{detail.japaneseName}
								{detail.japaneseRomanized && ` (${detail.japaneseRomanized})`}
							</span>
						</div>
					)}

					<div className='pokemon-detail__badges'>
						{detail.types.map((t) => (
							<span
								key={t}
								className='pokemon-detail__badge pokemon-detail__badge--type'
								style={{ backgroundColor: getComputedTypeColor(t) }}>
								{formatSlugName(t)}
							</span>
						))}
						<span className='pokemon-detail__badge pokemon-detail__badge--level'>
							Gen {detail.generation}
						</span>
						{detail.isLegendary && (
							<span className='pokemon-detail__badge pokemon-detail__badge--shiny'>Legendary</span>
						)}
						{detail.isMythical && (
							<span className='pokemon-detail__badge pokemon-detail__badge--shiny'>Mythical</span>
						)}
					</div>
				</div>
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

			{loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</p>}

			{/* Info tab */}
			{tab === 'info' && (
				<div className='pokemon-detail__section'>
					{flavorText && (
						<p
							style={{
								fontSize: '0.8rem',
								color: 'var(--text-primary)',
								lineHeight: 1.5,
								marginBottom: 12,
							}}>
							{flavorText}
						</p>
					)}

					{detail.baseStats && (
						<div className='dex-detail__home-summary'>
							<div className='dex-detail__home-profile'>
								<div className='pokemon-detail__section-title'>Pokédex profile</div>
								<p>{flavorText || detail.genus}</p>
								<div className='dex-detail__home-mini-grid'>
									<div>
										<span>Generation</span>
										<strong>Gen {detail.generation}</strong>
									</div>
									<div>
										<span>Capture Rate</span>
										<strong>{detail.captureRate}</strong>
									</div>
									<div>
										<span>Base Happiness</span>
										<strong>{detail.baseHappiness}</strong>
									</div>
									<div>
										<span>Color</span>
										<strong>{formatSlugName(detail.color)}</strong>
									</div>
								</div>
							</div>
							<div className='dex-detail__home-radar-card'>
								<div className='pokemon-detail__section-title'>Base stats</div>
								<HomeStatRadar rows={baseStatRows} maxValue={255} />
							</div>
						</div>
					)}

					<div className='pokemon-detail__section-title'>Details</div>
					<div className='pokemon-detail__row'>
						<span className='pokemon-detail__row-label'>Capture Rate</span>
						<span className='pokemon-detail__row-value'>{detail.captureRate}</span>
					</div>
					<div className='pokemon-detail__row'>
						<span className='pokemon-detail__row-label'>Base Happiness</span>
						<span className='pokemon-detail__row-value'>{detail.baseHappiness}</span>
					</div>
					<div className='pokemon-detail__row'>
						<span className='pokemon-detail__row-label'>Gender Rate</span>
						<span className='pokemon-detail__row-value'>
							{detail.genderRate === -1
								? 'Genderless'
								: `${((8 - detail.genderRate) / 8) * 100}% M / ${(detail.genderRate / 8) * 100}% F`}
						</span>
					</div>
					<div className='pokemon-detail__row'>
						<span className='pokemon-detail__row-label'>Egg Groups</span>
						<span className='pokemon-detail__row-value'>
							{detail.eggGroups.map((g) => formatSlugName(g)).join(', ') || '—'}
						</span>
					</div>
					<div className='pokemon-detail__row'>
						<span className='pokemon-detail__row-label'>Color</span>
						<span className='pokemon-detail__row-value'>{formatSlugName(detail.color)}</span>
					</div>

					{/* Abilities */}
					{detail.abilities && Array.isArray(detail.abilities) && (
						<>
							<div className='pokemon-detail__section-title' style={{ marginTop: 12 }}>
								Abilities
							</div>
							{(detail.abilities as { name: string; isHidden: boolean }[]).map((a, i) => (
								<div key={i} className='pokemon-detail__row'>
									<span className='pokemon-detail__row-label'>{formatSlugName(a.name)}</span>
									<span className='pokemon-detail__row-value'>
										{a.isHidden && (
											<span style={{ fontSize: '0.65rem', opacity: 0.6 }}>(Hidden)</span>
										)}
									</span>
								</div>
							))}
						</>
					)}

					<p className='dex-detail__collection-note'>
						In your vault: {detail.ownedPokemon.length} owned,{' '}
						{detail.ownedPokemon.filter((p) => p.isShiny).length} shiny, {detail.forms.length}{' '}
						forms.
					</p>
				</div>
			)}

			{/* Entries tab */}
			{tab === 'entries' && (
				<div className='pokemon-detail__section dex-detail__entries-section'>
					{langEntries.length > 0 ? (
						<>
							<div style={{ marginBottom: 8 }}>
								<select
									value={flavorLang}
									onChange={(e) => setFlavorLang(e.target.value)}
									style={{
										fontSize: '0.75rem',
										padding: '4px 8px',
										borderRadius: 6,
										border: '1px solid var(--border-light)',
										background: 'var(--bg-surface)',
										color: 'var(--text-primary)',
									}}>
									{uniqueFlavorLangs.map((l) => (
										<option key={l} value={l}>
											{l.toUpperCase()}
										</option>
									))}
								</select>
							</div>
							<div className='dex-detail__flavor-list'>
								{filteredEntries.map((entry, i) => (
									<div key={i} className='dex-detail__flavor-entry'>
										<div className='dex-detail__flavor-game'>
											{formatGameSlug(entry.gameVersion)}
										</div>
										<div className='dex-detail__flavor-text'>{entry.text}</div>
									</div>
								))}
							</div>
						</>
					) : (
						<p className='dex-detail__no-data'>
							No Pokédex entries available. Run "Backfill Entries" in Admin Panel.
						</p>
					)}
				</div>
			)}

			{/* Locations tab */}
			{tab === 'locations' && (
				<div className='pokemon-detail__section'>
					{sortedLocations.length > 0 ? (
						<>
							<table className='dex-detail__location-table'>
								<thead>
									<tr>
										<th>Game</th>
										<th>Location</th>
										<th>Method</th>
									</tr>
								</thead>
								<tbody>
									{sortedLocations.map((loc, i) => (
										<tr key={i}>
											<td>{formatGameSlug(loc.game)}</td>
											<td>{formatSlugName(loc.location)}</td>
											<td>{loc.method ? formatSlugName(loc.method) : '—'}</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className='dex-detail__location-cards'>
								{sortedLocations.map((loc, i) => (
									<div key={i} className='dex-detail__location-card'>
										<span>
											<strong>Game</strong>
											{formatGameSlug(loc.game)}
										</span>
										<span>
											<strong>Location</strong>
											{formatSlugName(loc.location)}
										</span>
										<span>
											<strong>Method</strong>
											{loc.method ? formatSlugName(loc.method) : '—'}
										</span>
									</div>
								))}
							</div>
						</>
					) : (
						<p className='dex-detail__no-data'>
							{detail.generation >= 9
								? 'No cached location data for this recent-generation species.'
								: 'No location data available.'}
						</p>
					)}
				</div>
			)}

			{/* Sprites tab */}
			{tab === 'sprites' && (
				<div className='pokemon-detail__section'>
					{sortedSprites.length > 0 ? (
						<div className='dex-detail__sprites-gallery'>
							{sortedSprites.map((s, i) => (
								<div key={i} className='dex-detail__sprite-item dex-detail__sprite-item--pixel'>
									{resolveSpriteUrl(s.normalUrl) ? (
										<img
											src={resolveSpriteUrl(s.normalUrl) ?? ''}
											alt={s.label}
											onError={hideBrokenImage}
										/>
									) : null}
									<span className='dex-detail__sprite-label'>{formatGameSlug(s.label)}</span>
								</div>
							))}
						</div>
					) : (
						<p className='dex-detail__no-data'>No generation sprites available.</p>
					)}

					{/* Forms */}
					{detail.forms.length > 1 && (
						<>
							<div className='pokemon-detail__section-title' style={{ marginTop: 12 }}>
								Forms
							</div>
							<div className='dex-detail__sprites-gallery'>
								{detail.forms.map((f) => {
									const formSprite =
										resolveSpriteUrl(f.sprites?.official) ??
										resolveSpriteUrl(f.sprites?.home) ??
										resolveSpriteUrl(f.sprites?.default)
									return (
										<div key={f.pokemonId} className='dex-detail__sprite-item'>
											{formSprite ? (
												<img src={formSprite} alt={f.name} onError={hideBrokenImage} />
											) : null}
											<span className='dex-detail__sprite-label'>
												{f.isDefault ? 'Default' : formatSlugName(f.name)}
											</span>
										</div>
									)
								})}
							</div>
						</>
					)}
				</div>
			)}

			{/* Owned tab */}
			{tab === 'owned' && (
				<div className='pokemon-detail__section'>
					{detail.ownedPokemon.length > 0 ? (
						<div className='dex-detail__owned-list'>
							{detail.ownedPokemon.map((p) => (
								<div
									key={p.id}
									className='dex-detail__owned-item'
									onClick={() => {
										if (onOwnedClick) {
											onOwnedClick(p)
										} else {
											navigate(`/pokemon/${p.id}`)
										}
									}}>
									{p.spriteUrl && (
										<img
											src={resolveSpriteUrl(p.spriteUrl) ?? ''}
											alt={p.formName}
											onError={hideBrokenImage}
										/>
									)}
									<div className='dex-detail__owned-info'>
										<div className='dex-detail__owned-name'>
											{p.nickname || p.formName || detail.name}
											{p.isShiny && ' ★'}
										</div>
										<div className='dex-detail__owned-meta'>
											Lv.{p.level} · {p.originGame}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className='dex-detail__no-data'>No Pokémon of this species in your vault.</p>
					)}
				</div>
			)}
		</div>
	)
}
