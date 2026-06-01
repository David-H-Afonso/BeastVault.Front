/**
 * Convert a PokeAPI slug/lowercase name to a properly capitalized display name.
 * e.g. "bulbasaur" → "Bulbasaur", "solar-power" → "Solar Power", "mr-mime" → "Mr. Mime"
 */

const SPECIAL_NAMES: Record<string, string> = {
	'mr-mime': 'Mr. Mime',
	'mr-rime': 'Mr. Rime',
	'mime-jr': 'Mime Jr.',
	'type-null': 'Type: Null',
	'ho-oh': 'Ho-Oh',
	'porygon-z': 'Porygon-Z',
	'jangmo-o': 'Jangmo-o',
	'hakamo-o': 'Hakamo-o',
	'kommo-o': 'Kommo-o',
	'tapu-koko': 'Tapu Koko',
	'tapu-lele': 'Tapu Lele',
	'tapu-bulu': 'Tapu Bulu',
	'tapu-fini': 'Tapu Fini',
	'nidoran-f': 'Nidoran♀',
	'nidoran-m': 'Nidoran♂',
	'flabebe': 'Flabébé',
	'farfetchd': "Farfetch'd",
	'sirfetchd': "Sirfetch'd",
	'wo-chien': 'Wo-Chien',
	'chien-pao': 'Chien-Pao',
	'ting-lu': 'Ting-Lu',
	'chi-yu': 'Chi-Yu',
	'great-tusk': 'Great Tusk',
	'scream-tail': 'Scream Tail',
	'brute-bonnet': 'Brute Bonnet',
	'flutter-mane': 'Flutter Mane',
	'slither-wing': 'Slither Wing',
	'sandy-shocks': 'Sandy Shocks',
	'iron-treads': 'Iron Treads',
	'iron-bundle': 'Iron Bundle',
	'iron-hands': 'Iron Hands',
	'iron-jugulis': 'Iron Jugulis',
	'iron-moth': 'Iron Moth',
	'iron-thorns': 'Iron Thorns',
	'roaring-moon': 'Roaring Moon',
	'iron-valiant': 'Iron Valiant',
	'walking-wake': 'Walking Wake',
	'iron-leaves': 'Iron Leaves',
	'gouging-fire': 'Gouging Fire',
	'raging-bolt': 'Raging Bolt',
	'iron-boulder': 'Iron Boulder',
	'iron-crown': 'Iron Crown',
}

export function formatSlugName(slug: string): string {
	if (!slug) return slug
	const lower = slug.toLowerCase()
	if (SPECIAL_NAMES[lower]) return SPECIAL_NAMES[lower]
	return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
