/**
 * Pokemon Ball mapping by ID
 * Based on common pokeball IDs used across Pokemon games
 */
export const PokemonBalls = {
	0: 'Poké Ball',
	1: 'Master Ball',
	2: 'Ultra Ball',
	3: 'Great Ball',
	4: 'Poké Ball',
	5: 'Safari Ball',
	6: 'Net Ball',
	7: 'Dive Ball',
	8: 'Nest Ball',
	9: 'Repeat Ball',
	10: 'Timer Ball',
	11: 'Luxury Ball',
	12: 'Premier Ball',
	13: 'Dusk Ball',
	14: 'Heal Ball',
	15: 'Quick Ball',
	16: 'Cherish Ball',
	17: 'Fast Ball',
	18: 'Level Ball',
	19: 'Lure Ball',
	20: 'Heavy Ball',
	21: 'Love Ball',
	22: 'Friend Ball',
	23: 'Moon Ball',
	24: 'Sport Ball',
	25: 'Dream Ball',
	26: 'Beast Ball',
	27: 'Strange Ball',
	28: 'Feather Ball',
	29: 'Wing Ball',
	30: 'Jet Ball',
	31: 'Lead(en) Ball',
	32: 'Gigaton Ball',
	33: 'Origin Ball',
} as const

export type PokemonBallName = (typeof PokemonBalls)[keyof typeof PokemonBalls]

/**
 * Get pokeball name from ID
 * @param ballId Pokeball ID
 * @returns Pokeball name or 'Unknown Ball' if not found
 */
export const getBallNameFromId = (ballId: number): string => {
	return PokemonBalls[ballId as keyof typeof PokemonBalls] || 'Unknown Ball'
}

/**
 * Get pokeball ID from name
 * @param ballName Pokeball name
 * @returns Pokeball ID or -1 if not found
 */
export const getBallIdFromName = (ballName: string): number => {
	if (!ballName) return -1
	const entries = Object.entries(PokemonBalls)
	const entry = entries.find(([, name]) => name.toLowerCase() === ballName.toLowerCase())
	return entry ? Number(entry[0]) : -1
}
