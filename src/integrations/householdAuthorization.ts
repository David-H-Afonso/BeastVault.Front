export const HOUSEHOLD_SCOPES = [
	'profile.read',
	'pokemon.read',
	'pokemon.favorite.write',
	'pokemon.notes.write',
] as const

export type HouseholdScope = (typeof HOUSEHOLD_SCOPES)[number]

export interface HouseholdAuthorizationRequest {
	clientId: string
	redirectUri: string
	state: string
	codeChallenge: string
	codeChallengeMethod: string
	scopes: HouseholdScope[]
}

export interface HouseholdAuthorizationApiRequest extends HouseholdAuthorizationRequest {
	approved: boolean
}

export interface HouseholdAuthorizationResponse {
	redirectUri: string
}

export const HOUSEHOLD_SCOPE_LABELS: Record<HouseholdScope, { title: string; description: string }> = {
	'profile.read': {
		title: 'View your Beast Vault profile',
		description: 'See your account name and connection identity.',
	},
	'pokemon.read': {
		title: 'View your Pokémon collection',
		description: 'Read a limited set of collection, list, and Pokémon detail fields.',
	},
	'pokemon.favorite.write': {
		title: 'Change favorites',
		description: 'Mark or unmark Pokémon as favorites.',
	},
	'pokemon.notes.write': {
		title: 'Change notes',
		description: 'Add, edit, or clear notes on your Pokémon.',
	},
}

const pkcePattern = /^[A-Za-z0-9._~-]{43}$/

export function parseHouseholdAuthorization(search: string):
	| { request: HouseholdAuthorizationRequest; error: null }
	| { request: null; error: string } {
	const parameters = new URLSearchParams(search)
	const clientId = parameters.get('client_id') ?? ''
	const redirectUri = parameters.get('redirect_uri') ?? ''
	const state = parameters.get('state') ?? ''
	const codeChallenge = parameters.get('code_challenge') ?? ''
	const codeChallengeMethod = parameters.get('code_challenge_method') ?? ''
	const requestedScopes = (parameters.get('scope') ?? '').split(' ').filter(Boolean)

	if (!clientId || !redirectUri || !state || !codeChallenge || !codeChallengeMethod) {
		return { request: null, error: 'The authorization request is incomplete.' }
	}

	if (clientId !== 'household' || codeChallengeMethod !== 'S256' || !pkcePattern.test(codeChallenge)) {
		return { request: null, error: 'The authorization request is invalid.' }
	}

	if (
		requestedScopes.length === 0 ||
		requestedScopes.some((scope) => !HOUSEHOLD_SCOPES.includes(scope as HouseholdScope))
	) {
		return { request: null, error: 'Household requested an unsupported permission.' }
	}

	const scopeSet = new Set(requestedScopes)
	const scopes = HOUSEHOLD_SCOPES.filter((scope) => scopeSet.has(scope))
	return {
		request: { clientId, redirectUri, state, codeChallenge, codeChallengeMethod, scopes },
		error: null,
	}
}
