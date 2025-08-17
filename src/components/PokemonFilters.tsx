import { useState, useEffect } from 'react'
import type {
	PokemonListFilterDto,
	SortBy,
	SortDirection,
	PokemonMetadata,
} from '../models/Pokemon'
import { getPokemonMetadata } from '../services/Pokemon'
import './PokemonFilters.scss'

interface PokemonFiltersProps {
	onFiltersChange: (filters: PokemonListFilterDto) => void
	loading?: boolean
}

export function PokemonFilters({ onFiltersChange, loading = false }: PokemonFiltersProps) {
	// Metadata state
	const [metadata, setMetadata] = useState<PokemonMetadata | null>(null)

	// Basic filters
	const [search, setSearch] = useState('')
	const [pokedexNumber, setPokedexNumber] = useState<number | undefined>()
	const [speciesName, setSpeciesName] = useState('')
	const [nickname, setNickname] = useState('')
	const [isShiny, setIsShiny] = useState<boolean | undefined>()
	const [favorite, setFavorite] = useState<boolean | undefined>()

	// Advanced filters
	const [form, setForm] = useState<number | undefined>()
	const [gender, setGender] = useState<number | undefined>()
	const [originGeneration, setOriginGeneration] = useState<number | undefined>()
	const [capturedGeneration, setCapturedGeneration] = useState<number | undefined>()
	const [pokeballId, setPokeballId] = useState<number | undefined>()
	const [heldItemId, setHeldItemId] = useState<number | undefined>()

	// Level range
	const [minLevel, setMinLevel] = useState<number | undefined>()
	const [maxLevel, setMaxLevel] = useState<number | undefined>()

	// Sorting
	const [sortBy, setSortBy] = useState<SortBy | undefined>()
	const [sortDirection, setSortDirection] = useState<SortDirection | undefined>()
	const [thenSortBy, setThenSortBy] = useState<SortBy | undefined>()
	const [thenSortDirection, setThenSortDirection] = useState<SortDirection | undefined>()

	// Pagination
	const [skip, setSkip] = useState(0)
	const [take, setTake] = useState(50)

	// Additional filters
	const [speciesId, setSpeciesId] = useState<number | undefined>()
	const [ballId, setBallId] = useState<number | undefined>()
	const [originGame, setOriginGame] = useState<number | undefined>()
	const [teraType, setTeraType] = useState<number | undefined>()

	// Load metadata on component mount
	useEffect(() => {
		getPokemonMetadata().then((data) => {
			console.log('Metadata received:', data)
			console.log('Generations structure:', data?.generations)
			setMetadata(data)
		}).catch(console.error)
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
			Favorite: favorite,

			Form: form,
			Gender: gender,
			OriginGeneration: originGeneration,
			CapturedGeneration: capturedGeneration,
			PokeballId: pokeballId,
			HeldItemId: heldItemId,

			MinLevel: minLevel,
			MaxLevel: maxLevel,

			SortBy: sortBy,
			SortDirection: sortDirection,
			ThenSortBy: thenSortBy,
			ThenSortDirection: thenSortDirection,

			Skip: skip,
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
		setFavorite(undefined)
		setForm(undefined)
		setGender(undefined)
		setOriginGeneration(undefined)
		setCapturedGeneration(undefined)
		setPokeballId(undefined)
		setHeldItemId(undefined)
		setMinLevel(undefined)
		setMaxLevel(undefined)
		setSortBy(undefined)
		setSortDirection(undefined)
		setThenSortBy(undefined)
		setThenSortDirection(undefined)
		setSkip(0)
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
			<div className='filters-header'>
				<h3>🔍 Pokemon Filters</h3>
			</div>

			{/* Basic Search Filters */}
			<div className='filters-section'>
				<h4>🔎 Basic Search</h4>
				<div className='filters-grid'>
					<div className='filter-group'>
						<label>Search</label>
						<input
							type='text'
							placeholder='Search by name, nickname, or species...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className='filter-group'>
						<label>Pokédex Number</label>
						<input
							type='number'
							placeholder='Pokédex #'
							value={pokedexNumber || ''}
							onChange={(e) =>
								setPokedexNumber(e.target.value ? parseInt(e.target.value) : undefined)
							}
							min='1'
						/>
					</div>

					<div className='filter-group'>
						<label>Species Name</label>
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

					<div className='filter-group'>
						<label>Shiny Status</label>
						<select
							value={isShiny === undefined ? '' : isShiny.toString()}
							onChange={(e) =>
								setIsShiny(e.target.value === '' ? undefined : e.target.value === 'true')
							}>
							<option value=''>All</option>
							<option value='true'>Shiny Only</option>
							<option value='false'>Non-Shiny Only</option>
						</select>
					</div>

					<div className='filter-group'>
						<label>Favorite Status</label>
						<select
							value={favorite === undefined ? '' : favorite.toString()}
							onChange={(e) =>
								setFavorite(e.target.value === '' ? undefined : e.target.value === 'true')
							}>
							<option value=''>All</option>
							<option value='true'>Favorites Only</option>
							<option value='false'>Non-Favorites Only</option>
						</select>
					</div>
				</div>
			</div>

			{/* Level Range */}
			<div className='filters-section'>
				<h4>⚖️ Level Range</h4>
				<div className='filters-grid'>
					<div className='filter-group'>
						<label>Min Level</label>
						<input
							type='number'
							placeholder='Min level'
							value={minLevel || ''}
							onChange={(e) => setMinLevel(e.target.value ? parseInt(e.target.value) : undefined)}
							min='1'
							max='100'
						/>
					</div>

					<div className='filter-group'>
						<label>Max Level</label>
						<input
							type='number'
							placeholder='Max level'
							value={maxLevel || ''}
							onChange={(e) => setMaxLevel(e.target.value ? parseInt(e.target.value) : undefined)}
							min='1'
							max='100'
						/>
					</div>
				</div>
			</div>

			{/* Sorting */}
			<div className='filters-section'>
				<h4>🎯 Sorting</h4>
				<div className='filters-grid'>
					<div className='filter-group'>
						<label>Sort By</label>
						<select
							value={sortBy ?? ''}
							onChange={(e) =>
								setSortBy(e.target.value ? (parseInt(e.target.value) as SortBy) : undefined)
							}>
							<option value=''>Choose field...</option>
							{metadata?.sortFields?.map((field) => (
								<option key={`sort-${field.value}`} value={field.value}>
									{field.name}
								</option>
							)) || []}
						</select>
					</div>

					<div className='filter-group'>
						<label>Sort Direction</label>
						<select
							value={sortDirection ?? ''}
							onChange={(e) =>
								setSortDirection(
									e.target.value ? (parseInt(e.target.value) as SortDirection) : undefined
								)
							}>
							<option value=''>Choose direction...</option>
							<option value='0'>Ascending</option>
							<option value='1'>Descending</option>
						</select>
					</div>

					<div className='filter-group'>
						<label>Then Sort By</label>
						<select
							value={thenSortBy ?? ''}
							onChange={(e) =>
								setThenSortBy(e.target.value ? (parseInt(e.target.value) as SortBy) : undefined)
							}>
							<option value=''>None</option>
							{metadata?.sortFields?.map((field) => (
								<option key={`then-sort-${field.value}`} value={field.value}>
									{field.name}
								</option>
							)) || []}
						</select>
					</div>

					<div className='filter-group'>
						<label>Then Sort Direction</label>
						<select
							value={thenSortDirection ?? ''}
							onChange={(e) =>
								setThenSortDirection(
									e.target.value ? (parseInt(e.target.value) as SortDirection) : undefined
								)
							}>
							<option value=''>Choose direction...</option>
							<option value='0'>Ascending</option>
							<option value='1'>Descending</option>
						</select>
					</div>
				</div>
			</div>

			{/* Advanced Filters */}
			<div className='filters-section'>
				<h4>⚙️ Advanced Filters</h4>
				<div className='filters-grid'>
					<div className='filter-group'>
						<label>Gender</label>
						<select
							value={gender ?? ''}
							onChange={(e) => setGender(e.target.value ? parseInt(e.target.value) : undefined)}>
							<option value=''>All Genders</option>
							{metadata?.genders?.map((genderOption) => (
								<option key={`gender-${genderOption.id}`} value={genderOption.id}>
									{genderOption.name}
								</option>
							)) || []}
						</select>
					</div>

					<div className='filter-group'>
						<label>Origin Generation</label>
						<select
							value={originGeneration ?? ''}
							onChange={(e) =>
								setOriginGeneration(e.target.value ? parseInt(e.target.value) : undefined)
							}>
							<option value=''>All Generations</option>
							{metadata?.generations?.map((gen: any) => {
								// Handle both number[] and object[] formats
								const genId = typeof gen === 'number' ? gen : gen.id
								const genName = typeof gen === 'number' ? `Generation ${gen}` : gen.name || `Generation ${gen.id}`
								return (
									<option key={`origin-gen-${genId}`} value={genId}>
										{genName}
									</option>
								)
							}) || []}
						</select>
					</div>

					<div className='filter-group'>
						<label>Captured Generation</label>
						<select
							value={capturedGeneration ?? ''}
							onChange={(e) =>
								setCapturedGeneration(e.target.value ? parseInt(e.target.value) : undefined)
							}>
							<option value=''>All Generations</option>
							{metadata?.generations?.map((gen: any) => {
								// Handle both number[] and object[] formats
								const genId = typeof gen === 'number' ? gen : gen.id
								const genName = typeof gen === 'number' ? `Generation ${gen}` : gen.name || `Generation ${gen.id}`
								return (
									<option key={`captured-gen-${genId}`} value={genId}>
										{genName}
									</option>
								)
							}) || []}
						</select>
					</div>

					<div className='filter-group'>
						<label>Form</label>
						<input
							type='number'
							placeholder='Form (0 = base form)'
							value={form ?? ''}
							onChange={(e) => setForm(e.target.value ? parseInt(e.target.value) : undefined)}
							min='0'
						/>
					</div>

					<div className='filter-group'>
						<label>Pokeball ID</label>
						<input
							type='number'
							placeholder='Pokeball ID'
							value={pokeballId ?? ''}
							onChange={(e) => setPokeballId(e.target.value ? parseInt(e.target.value) : undefined)}
							min='1'
						/>
					</div>

					<div className='filter-group'>
						<label>Held Item ID</label>
						<input
							type='number'
							placeholder='Held Item ID'
							value={heldItemId ?? ''}
							onChange={(e) => setHeldItemId(e.target.value ? parseInt(e.target.value) : undefined)}
							min='1'
						/>
					</div>
				</div>
			</div>

			{/* Pagination */}
			<div className='filters-section'>
				<h4>📄 Pagination</h4>
				<div className='filters-grid'>
					<div className='filter-group'>
						<label>Items per Page</label>
						<select value={take} onChange={(e) => setTake(parseInt(e.target.value))}>
							<option value='25'>25</option>
							<option value={metadata?.defaultPageSize || 50}>
								{metadata?.defaultPageSize || 50} (Default)
							</option>
							<option value='100'>100</option>
							<option value='200'>200</option>
							{metadata?.maxPageSize && metadata.maxPageSize !== 200 && (
								<option value={metadata.maxPageSize}>{metadata.maxPageSize} (Max)</option>
							)}
						</select>
					</div>

					<div className='filter-group'>
						<label>Skip Items</label>
						<input
							type='number'
							placeholder='Skip'
							value={skip}
							onChange={(e) => setSkip(parseInt(e.target.value) || 0)}
							min='0'
						/>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className='filters-actions'>
				<button onClick={handleClearFilters} disabled={loading} className='btn-secondary'>
					Clear Filters
				</button>
				<button onClick={handleApplyFilters} disabled={loading} className='btn-primary'>
					{loading ? 'Loading...' : 'Apply Filters'}
				</button>
			</div>
		</div>
	)
}
