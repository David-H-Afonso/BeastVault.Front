import '../components/Settings.scss'
import React from 'react'
import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import { CardBackgroundType } from '@/models/enums/CardBackgroundTypes'
import { useUISettings } from '@/hooks/useUISettings'
import { getBestSpriteByType } from '@/utils'
import SettingComponent from '../components/SettingsComponent'

const CHARIZARD_DEFAULT_SPRITES = {
	back_default:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
	back_shiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/6.png',
	default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
	dreamWorld:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/6.svg',
	githubRegular:
		'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/charizard.png',
	githubShiny:
		'https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/shiny/charizard.png',
	home: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/6.png',
	homeShiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/6.png',
	official:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
	officialShiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/6.png',
	shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/6.png',
	showdown:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif',
	showdownShiny:
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/6.gif',
}

const CHARIZARD_DEFAULT_VALUES = {
	id: 6,
	speciesId: 6,
	form: 0,
	formName: 'Standard',
	canGigantamax: false,
	speciesName: 'Charizard',
	nickname: 'Charizard',
	level: 100,
	isShiny: false,
	ballId: 0,
	spriteKey: '1025_n_0',
	originGeneration: 1,
	capturedGeneration: 9,
	hasMegaStone: true,
}

const Settings: React.FC = () => {
	const { spriteType } = useUISettings()

	const backgroundOptions = Object.values(CardBackgroundType) as CardBackgroundTypeName[]

	const defaultPokemon = [
		{
			...CHARIZARD_DEFAULT_VALUES,
		},
		{
			...CHARIZARD_DEFAULT_VALUES,
			isShiny: true,
		},
	]
	const spriteURL = (isShiny: boolean) =>
		getBestSpriteByType(CHARIZARD_DEFAULT_SPRITES, spriteType, isShiny) || ''

	return (
		<SettingComponent
			defaultPokemon={defaultPokemon}
			spriteURL={spriteURL}
			backgroundOptions={backgroundOptions}
		/>
	)
}

export default Settings
