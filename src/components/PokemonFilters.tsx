import { useState, useEffect, useRef } from 'react'
import type {
	PokemonListFilterDto,
	SortBy,
	SortDirection,
	PokemonMetadata,
} from '../models/Pokemon'
import { getPokemonMetadata } from '../services/Pokemon'
import { PokemonBalls, getBallIdFromName } from '../enums/PokemonBalls'
import './PokemonFilters.scss'

interface PokemonFiltersProps {
	onFiltersChange: (filters: PokemonListFilterDto) => void
	loading?: boolean
}

export function PokemonFilters({ onFiltersChange, loading = false }: PokemonFiltersProps) {
	// Metadata state
	const [metadata, setMetadata] = useState<PokemonMetadata | null>(null)

	// UI state for collapsible sections
	const [showFilters, setShowFilters] = useState(false)

	// Basic filters
	const [search, setSearch] = useState('')
	const [pokedexNumber, setPokedexNumber] = useState<number | undefined>()
	const [speciesName, setSpeciesName] = useState('')
	const [nickname, setNickname] = useState('')
	const [isShiny, setIsShiny] = useState<boolean | undefined>()
	// const [favorite, setFavorite] = useState<boolean | undefined>() // TODO: Temporarily disabled - backend service not ready

	// Advanced filters
	// const [form, setForm] = useState<number | undefined>() // TODO: Temporarily disabled - backend service not ready
	// const [gender, setGender] = useState<number | undefined>() // TODO: Temporarily disabled - backend service not ready
	const [originGeneration, setOriginGeneration] = useState<number | undefined>()
	const [capturedGeneration, setCapturedGeneration] = useState<number | undefined>()
	const [pokeballName, setPokeballName] = useState<string | undefined>()
	// const [heldItemId, setHeldItemId] = useState<number | undefined>() // TODO: Temporarily disabled - backend service not ready

	// Level range
	const [minLevel, setMinLevel] = useState<number | undefined>()
	const [maxLevel, setMaxLevel] = useState<number | undefined>()

	// Sorting
	const [sortBy, setSortBy] = useState<SortBy | undefined>()
	const [sortDirection, setSortDirection] = useState<SortDirection | undefined>()
	// const [thenSortBy, setThenSortBy] = useState<SortBy | undefined>() // TODO: Temporarily disabled - backend service not ready
	// const [thenSortDirection, setThenSortDirection] = useState<SortDirection | undefined>() // TODO: Temporarily disabled - backend service not ready

	// Pagination
	// const [skip, setSkip] = useState(0) // TODO: Temporarily disabled - backend service not ready
	const [take, setTake] = useState(50)

	// Additional filters
	const [speciesId, setSpeciesId] = useState<number | undefined>()
	const [ballId, setBallId] = useState<number | undefined>()
	const [originGame, setOriginGame] = useState<number | undefined>()
	const [teraType, setTeraType] = useState<number | undefined>()

	// Debounce timer for auto-apply
	const debounceTimerRef = useRef<number | null>(null)

	// Effect for auto-applying quick search filters
	useEffect(() => {
		// Only trigger auto-apply if at least one quick search field has a value
		if (search || pokedexNumber !== undefined || isShiny !== undefined) {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}

			debounceTimerRef.current = window.setTimeout(() => {
				// Create filters object for quick search
				const filters: PokemonListFilterDto = {
					Search: search.trim() || undefined,
					PokedexNumber: pokedexNumber,
					IsShiny: isShiny,
					// Keep other filters that are already set
					SpeciesName: speciesName.trim() || undefined,
					Nickname: nickname.trim() || undefined,
					OriginGeneration: originGeneration,
					CapturedGeneration: capturedGeneration,
					PokeballId: pokeballName ? getBallIdFromName(pokeballName) : undefined,
					MinLevel: minLevel,
					MaxLevel: maxLevel,
					SortBy: sortBy,
					SortDirection: sortDirection,
					Skip: 0,
					Take: take,
					SpeciesId: speciesId,
					BallId: ballId,
					OriginGame: originGame,
					TeraType: teraType,
				}
				onFiltersChange(filters)
			}, 2000)
		}
		
		// Cleanup function
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [search, pokedexNumber, isShiny, speciesName, nickname, originGeneration, capturedGeneration, pokeballName, minLevel, maxLevel, sortBy, sortDirection, take, speciesId, ballId, originGame, teraType, onFiltersChange])

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [])

	// Load metadata on component mount
	useEffect(() => {
		getPokemonMetadata()
			.then((data) => {
				setMetadata(data)
			})
			.catch(console.error)
	}, [])

	// Update take when metadata loads
	useEffect(() => {
		if (metadata?.defaultPageSize && take === 50) {
			setTake(metadata.defaultPageSize)
		}
	}, [metadata, take])

	const handleApplyFilters = () => {
		const filters: PokemonListFilterDto = {
			// Remove empty strings and convert to undefined
			Search: search.trim() || undefined,
			PokedexNumber: pokedexNumber,
			SpeciesName: speciesName.trim() || undefined,
			Nickname: nickname.trim() || undefined,
			IsShiny: isShiny,
			// Favorite: favorite, // TODO: Temporarily disabled - backend service not ready

			// Form: form, // TODO: Temporarily disabled - backend service not ready
			// Gender: gender, // TODO: Temporarily disabled - backend service not ready
			OriginGeneration: originGeneration,
			CapturedGeneration: capturedGeneration,
			PokeballId: pokeballName ? getBallIdFromName(pokeballName) : undefined,
			// HeldItemId: heldItemId, // TODO: Temporarily disabled - backend service not ready

			MinLevel: minLevel,
			MaxLevel: maxLevel,

			SortBy: sortBy,
			SortDirection: sortDirection,
			// ThenSortBy: thenSortBy, // TODO: Temporarily disabled - backend service not ready
			// ThenSortDirection: thenSortDirection, // TODO: Temporarily disabled - backend service not ready

			// Skip: skip, // TODO: Temporarily disabled - backend service not ready
			Skip: 0, // Hardcoded to 0 since skip is temporarily disabled
			Take: take,

			SpeciesId: speciesId,
			BallId: ballId,
			OriginGame: originGame,
			TeraType: teraType,
		}

		onFiltersChange(filters)
	}

	const handleClearFilters = () => {
		setSearch('')
		setPokedexNumber(undefined)
		setSpeciesName('')
		setNickname('')
		setIsShiny(undefined)
		// setFavorite(undefined) // TODO: Temporarily disabled - backend service not ready
		// setForm(undefined) // TODO: Temporarily disabled - backend service not ready
		// setGender(undefined) // TODO: Temporarily disabled - backend service not ready
		setOriginGeneration(undefined)
		setCapturedGeneration(undefined)
		setPokeballName(undefined)
		// setHeldItemId(undefined) // TODO: Temporarily disabled - backend service not ready
		setMinLevel(undefined)
		setMaxLevel(undefined)
		setSortBy(undefined)
		setSortDirection(undefined)
		// setThenSortBy(undefined) // TODO: Temporarily disabled - backend service not ready
		// setThenSortDirection(undefined) // TODO: Temporarily disabled - backend service not ready
		// setSkip(0) // TODO: Temporarily disabled - backend service not ready
		setTake(50)
		setSpeciesId(undefined)
		setBallId(undefined)
		setOriginGame(undefined)
		setTeraType(undefined)

		// Apply empty filters
		onFiltersChange({ Skip: 0, Take: 50 })
	}

	return (
		<div className='pokemon-filters'>
			{/* Collapsible Header */}
			<div className='filters-header' onClick={() => setShowFilters(!showFilters)}>
				<h3>
					<span className={`toggle-icon ${showFilters ? 'expanded' : ''}`}>▶</span>
					🔍 Filters
				</h3>
				<span className='filters-count'>
					{showFilters ? 'Click to collapse' : 'Click to expand filters'}
				</span>
			</div>

			{/* Quick Search Row - Always Visible */}
			<div className='quick-search-row'>
				<div className='filter-group'>
					<input
						type='text'
						placeholder='🔍 Search Pokemon...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className='search-input'
					/>
				</div>
				<div className='filter-group'>
					<input
						type='number'
						placeholder='Pokédex #'
						value={pokedexNumber || ''}
						onChange={(e) =>
							setPokedexNumber(e.target.value ? parseInt(e.target.value) : undefined)
						}
						min='1'
						className='small-input'
					/>
				</div>
				<div className='filter-group'>
					<select
						value={isShiny === undefined ? '' : isShiny.toString()}
						onChange={(e) =>
							setIsShiny(e.target.value === '' ? undefined : e.target.value === 'true')
						}
						className='small-select'>
						<option value=''>All</option>
						<option value='true'>✨ Shiny</option>
						<option value='false'>Regular</option>
					</select>
				</div>
			</div>

			{/* Collapsible Content */}
			{showFilters && (
				<div className='filters-content'>

					{/* Compact Filters Grid */}
					<div className='compact-filters-grid'>
						<div className='filter-row'>
							<div className='filter-group'>
								<label>Species</label>
								<input
									type='text'
									placeholder='Species name'
									value={speciesName}
									onChange={(e) => setSpeciesName(e.target.value)}
								/>
							</div>
							<div className='filter-group'>
								<label>Nickname</label>
								<input
									type='text'
									placeholder='Nickname'
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
								/>
							</div>
						</div>

						<div className='filter-row'>
							<div className='filter-group'>
								<label>Min Level</label>
								<input
									type='number'
									placeholder='1'
									value={minLevel || ''}
									onChange={(e) => setMinLevel(e.target.value ? parseInt(e.target.value) : undefined)}
									min='1'
									max='100'
									className='small-input'
								/>
							</div>
							<div className='filter-group'>
								<label>Max Level</label>
								<input
									type='number'
									placeholder='100'
									value={maxLevel || ''}
									onChange={(e) => setMaxLevel(e.target.value ? parseInt(e.target.value) : undefined)}
									min='1'
									max='100'
									className='small-input'
								/>
							</div>
						</div>

						<div className='filter-row'>
							<div className='filter-group'>
								<label>Origin Gen</label>
								<select
									value={originGeneration ?? ''}
									onChange={(e) =>
										setOriginGeneration(e.target.value ? parseInt(e.target.value) : undefined)
									}>
									<option value=''>All</option>
									{metadata?.generations?.map((gen: any) => {
										const genId = typeof gen === 'number' ? gen : gen.id
										const genName =
											typeof gen === 'number' ? `Gen ${gen}` : gen.name || `Gen ${gen.id}`
										return (
											<option key={`origin-gen-${genId}`} value={genId}>
												{genName}
											</option>
										)
									}) || []}
								</select>
							</div>
							<div className='filter-group'>
								<label>Captured Gen</label>
								<select
									value={capturedGeneration ?? ''}
									onChange={(e) =>
										setCapturedGeneration(e.target.value ? parseInt(e.target.value) : undefined)
									}>
									<option value=''>All</option>
									{metadata?.generations?.map((gen: any) => {
										const genId = typeof gen === 'number' ? gen : gen.id
										const genName =
											typeof gen === 'number' ? `Gen ${gen}` : gen.name || `Gen ${gen.id}`
										return (
											<option key={`captured-gen-${genId}`} value={genId}>
												{genName}
											</option>
										)
									}) || []}
								</select>
							</div>
						</div>

						<div className='filter-row'>
							<div className='filter-group'>
								<label>Pokeball</label>
								<select
									value={pokeballName ?? ''}
									onChange={(e) => setPokeballName(e.target.value || undefined)}>
									<option value=''>All Balls</option>
									{Object.entries(PokemonBalls).map(([id, name]) => (
										<option key={id} value={name}>
											{id === '0' ? '1º & 2º gen' : name}
										</option>
									))}
								</select>
							</div>
							<div className='filter-group'>
								<label>Items/Page</label>
								<select value={take} onChange={(e) => setTake(parseInt(e.target.value))}>
									<option value='25'>25</option>
									<option value={metadata?.defaultPageSize || 50}>
										{metadata?.defaultPageSize || 50}
									</option>
									<option value='100'>100</option>
									<option value='200'>200</option>
								</select>
							</div>
						</div>

						<div className='filter-row'>
							<div className='filter-group'>
								<label>Sort By</label>
								<select
									value={sortBy ?? ''}
									onChange={(e) =>
										setSortBy(e.target.value ? (parseInt(e.target.value) as SortBy) : undefined)
									}>
									<option value=''>Default</option>
									{metadata?.sortFields?.map((field) => (
										<option key={`sort-${field.value}`} value={field.value}>
											{field.name}
										</option>
									)) || []}
								</select>
							</div>
							<div className='filter-group'>
								<label>Order</label>
								<select
									value={sortDirection ?? ''}
									onChange={(e) =>
										setSortDirection(
											e.target.value ? (parseInt(e.target.value) as SortDirection) : undefined
										)
									}>
									<option value=''>Default</option>
									<option value='0'>A-Z ↑</option>
									<option value='1'>Z-A ↓</option>
								</select>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className='filters-actions'>
						<button onClick={handleClearFilters} disabled={loading} className='btn-clear'>
							🗑️ Clear
						</button>
						<button onClick={handleApplyFilters} disabled={loading} className='btn-apply'>
							{loading ? '⏳ Loading...' : '✅ Apply'}
						</button>
					</div>

					{/* Info Banner for Disabled Features */}
					<div className='disabled-features-info'>
						<small>
							⚠️ Some advanced filters (Gender, Form, Held Items, Favorites) are temporarily disabled
						</small>
					</div>
				</div>
			)}
		</div>
	)
}
