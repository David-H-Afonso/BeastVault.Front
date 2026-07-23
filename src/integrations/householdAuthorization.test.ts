import { describe, expect, it } from 'vitest'
import { parseHouseholdAuthorization } from './householdAuthorization'

const challenge = 'A'.repeat(43)

describe('parseHouseholdAuthorization', () => {
	it('preserves the complete valid PKCE authorization request', () => {
		const search = new URLSearchParams({
			client_id: 'household',
			redirect_uri: 'http://localhost:5019/integrations/callback/provider',
			state: 'opaque-state',
			code_challenge: challenge,
			code_challenge_method: 'S256',
			scope: 'pokemon.notes.write profile.read pokemon.read',
		}).toString()

		const parsed = parseHouseholdAuthorization(`?${search}`)

		expect(parsed.error).toBeNull()
		expect(parsed.request).toEqual({
			clientId: 'household',
			redirectUri: 'http://localhost:5019/integrations/callback/provider',
			state: 'opaque-state',
			codeChallenge: challenge,
			codeChallengeMethod: 'S256',
			scopes: ['profile.read', 'pokemon.read', 'pokemon.notes.write'],
		})
	})

	it('rejects plain PKCE and unsupported scopes', () => {
		const base = `?client_id=household&redirect_uri=x&state=s&code_challenge=${challenge}`
		expect(parseHouseholdAuthorization(`${base}&code_challenge_method=plain&scope=profile.read`).error)
			.toContain('invalid')
		expect(
			parseHouseholdAuthorization(`${base}&code_challenge_method=S256&scope=admin`).error
		).toContain('unsupported')
	})
})
