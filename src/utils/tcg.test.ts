import { describe, expect, it } from 'vitest'
import { getTcgVariantPrice, normalizeTcgVariant, slugifyTcgSet } from './tcg'

describe('TCG data helpers', () => {
	it('matches provider variant names without changing their meaning', () => {
		expect(normalizeTcgVariant('Reverse-Holo')).toBe('reverse')
		expect(getTcgVariantPrice({ 'reverse-holo': 0.22 }, 'ReverseHolo', 5.68)).toBe(0.22)
	})

	it('does not use another variant price as a fallback', () => {
		expect(getTcgVariantPrice({ normal: 0.1 }, 'reverse', 5.68)).toBeNull()
	})

	it('creates stable set route slugs', () => {
		expect(slugifyTcgSet('Chispas Fulgurantes')).toBe('chispas-fulgurantes')
	})
})
