export const PokemonTypes = {
  0: 'normal',
  1: 'fighting',
  2: 'flying',
  3: 'poison',
  4: 'ground',
  5: 'rock',
  6: 'bug',
  7: 'ghost',
  8: 'steel',
  9: 'fire',
  10: 'water',
  11: 'grass',
  12: 'electric',
  13: 'psychic',
  14: 'ice',
  15: 'dragon',
  16: 'dark',
  17: 'fairy'
} as const;

export type PokemonTypeName = typeof PokemonTypes[keyof typeof PokemonTypes];

export const getTypeNameFromId = (typeId: number): string => {
  return PokemonTypes[typeId as keyof typeof PokemonTypes] || 'unknown';
};

export const getTypeIdFromName = (typeName: string): number => {
  const entries = Object.entries(PokemonTypes);
  const entry = entries.find(([, name]) => name.toLowerCase() === typeName.toLowerCase());
  return entry ? Number(entry[0]) : -1;
};
