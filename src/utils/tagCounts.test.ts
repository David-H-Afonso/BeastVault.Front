import { describe, it, expect } from 'vitest'
import { resolveTagDisplayCount, resolveAllPokemonCount } from './tagCounts'

describe('resolveTagDisplayCount', () => {
	it('falls back to the global pokemonCount when facet counts are not loaded', () => {
		expect(resolveTagDisplayCount({ id: 1, pokemonCount: 4 }, null)).toBe(4)
		expect(resolveTagDisplayCount({ id: 1, pokemonCount: 4 }, undefined)).toBe(4)
	})

	it('uses the facet count when available', () => {
		expect(resolveTagDisplayCount({ id: 1, pokemonCount: 4 }, { 1: 2 })).toBe(2)
	})

	it('returns 0 for a tag absent from the facet counts (search excludes it)', () => {
		// This is the exact bug: a tag showed its global count (4) even when the
		// current search matched none of its Pokémon. It must now read 0.
		expect(resolveTagDisplayCount({ id: 3, pokemonCount: 4 }, { 1: 2 })).toBe(0)
	})

	it('reads counts keyed by number id even though JSON keys are strings', () => {
		const counts = JSON.parse('{"7": 5}') as Record<number, number>
		expect(resolveTagDisplayCount({ id: 7, pokemonCount: 99 }, counts)).toBe(5)
	})
})

describe('resolveAllPokemonCount', () => {
	it('uses the facet total when available', () => {
		expect(resolveAllPokemonCount(2, 50)).toBe(2)
		expect(resolveAllPokemonCount(0, 50)).toBe(0)
	})

	it('falls back to the list total when the facet total is not loaded', () => {
		expect(resolveAllPokemonCount(null, 50)).toBe(50)
		expect(resolveAllPokemonCount(undefined, 50)).toBe(50)
	})
})
