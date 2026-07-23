import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { PokemonDetailDto } from '@/models/Pokemon'
import type { PokemonListItemDto } from '@/models/api/types'
import { getPokemonById, updatePokemon } from '@/services/Pokemon'
import { PokemonDetailPanel } from '@/components/elements/PokemonDetailPanel/PokemonDetailPanel'
import { DetailShell } from '@/components/elements/DetailShell/DetailShell'

function toListItem(detail: PokemonDetailDto): PokemonListItemDto {
	return {
		id: detail.id,
		speciesId: detail.speciesId,
		speciesName: detail.speciesName,
		form: detail.form,
		formName: detail.formName ?? '',
		nickname: detail.nickname ?? undefined,
		level: detail.level,
		isShiny: detail.isShiny,
		favorite: detail.favorite,
		isEgg: detail.isEgg,
		ballId: detail.ballId,
		teraType: detail.teraType ?? undefined,
		heldItemId: detail.heldItemId,
		gender: detail.gender,
		spriteKey: detail.spriteKey ?? '',
		originGeneration: detail.originGeneration,
		capturedGeneration: detail.originGeneration,
		canGigantamax: false,
		hasMegaStone: false,
		tags: [],
		type1: detail.type1,
		type2: detail.type2 ?? undefined,
		ballName: detail.ballName,
		ballSpriteUrl: detail.ballSpriteUrl,
		isBoxed: false,
	}
}

export default function PokemonDeepLink() {
	const { id } = useParams()
	const navigate = useNavigate()
	const [pokemon, setPokemon] = useState<PokemonListItemDto | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const pokemonId = Number(id)
		if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
			setError('Pokémon not found')
			return
		}

		let active = true
		getPokemonById(pokemonId)
			.then((detail) => {
				if (active) setPokemon(toListItem(detail))
			})
			.catch(() => {
				if (active) setError('Pokémon not found')
			})
		return () => {
			active = false
		}
	}, [id])

	if (error) {
		return (
			<div className='app-container'>
				<p className='error'>{error}</p>
				<button type='button' onClick={() => navigate('/')}>
					Back to collection
				</button>
			</div>
		)
	}

	if (!pokemon) return <div className='app-container'>Loading…</div>

	const handleToggleFavorite = async (current: PokemonListItemDto) => {
		const favorite = !current.favorite
		await updatePokemon(current.id, { favorite })
		setPokemon((value) => (value ? { ...value, favorite } : value))
	}

	return (
		<DetailShell panel={null} onClosePanel={() => navigate('/')}>
			<div className='app-container'>
				<button type='button' onClick={() => navigate('/')}>
					← Collection
				</button>
				<PokemonDetailPanel pokemon={pokemon} onToggleFavorite={handleToggleFavorite} />
			</div>
		</DetailShell>
	)
}
