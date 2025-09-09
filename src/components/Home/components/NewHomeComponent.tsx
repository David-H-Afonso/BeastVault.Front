import type { FC } from 'react'
import './HomeComponent.scss'
import type { PokemonListItemDto } from '@/models/Pokemon'
import { PokemonCard } from '@/components/elements'

interface Props {
	loading: boolean
	processedPokemon: {
		pokemon: PokemonListItemDto
		sprite: string | undefined
	}[]
}

const NewHomeComponent: FC<Props> = (props) => {
	const { loading, processedPokemon } = props

	console.log(processedPokemon)

	const handleDelete = () => {}
	const handleDownload = () => {}
	const handleManageTags = () => {}

	if (loading) return <div>Loading...</div>
	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				flexDirection: 'row',
				gap: '20px',
				margin: '20px',
			}}>
			{processedPokemon.map(({ pokemon, sprite }) => (
				<div style={{ width: '200px' }} key={pokemon.id}>
					<PokemonCard
						loading={loading}
						pokemon={pokemon}
						sprite={sprite}
						onDelete={handleDelete}
						onDownload={handleDownload}
						onManageTags={handleManageTags}
					/>
				</div>
			))}
		</div>
	)
}

export default NewHomeComponent
