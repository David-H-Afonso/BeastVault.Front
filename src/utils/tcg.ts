export const normalizeTcgVariant = (value: string) =>
  value
    .trim()
    .replaceAll('_', '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('holofoil', 'holo')
    .replaceAll('reverse-holo', 'reverse')
    .replaceAll('first-edition', '1st-edition')
    .replaceAll('basico', 'normal')
    .replaceAll('reversa', 'reverse')
    .replaceAll('holographic', 'holo')

export const getTcgVariantPrice = (
  prices: Record<string, number> | undefined,
  variant: string,
  fallback: number | null
) => {
  if (!prices || Object.keys(prices).length === 0) return fallback
  const normalizedVariant = normalizeTcgVariant(variant)
  const match = Object.entries(prices).find(([key]) => normalizeTcgVariant(key) === normalizedVariant)
  return match?.[1] ?? null
}

export const slugifyTcgSet = (value: string) =>
  normalizeTcgVariant(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
