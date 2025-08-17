/**
 * ANÁLISIS DE DISCREPANCIAS - Frontend vs Backend Official
 *
 * Comparación entre nuestros modelos actuales y la documentación oficial
 * del backend para identificar problemas y diferencias.
 */

// ===================================
// ❌ PROBLEMAS ENCONTRADOS EN PokemonListItemDto
// ===================================

/**
 * NUESTRO MODELO ACTUAL (INCORRECTO):
 * - speciesName: string ❌ (NO existe en backend)
 * - ballName: string ❌ (NO existe en backend)
 * - teraTypeName: string ❌ (NO existe en backend)
 * - type1: string ❌ (NO existe en backend)
 * - type2: string ❌ (NO existe en backend)
 * - gender?: number ❌ (debería ser requerido)
 * - nature?: number ❌ (NO existe en backend)
 * - ability?: number ❌ (NO existe en backend)
 * - experience?: number ❌ (NO existe en backend)
 * - currentFriendship?: number ❌ (NO existe en backend)
 * - isEgg?: boolean ❌ (NO existe en backend)
 * - pokedexNumber?: number ❌ (NO existe en backend)
 * - originGame?: number ❌ (NO existe en backend)
 * - capturedGeneration?: number ❌ (debería ser requerido)
 * - originGeneration?: number ❌ (debería ser requerido)
 *
 * FALTAN EN NUESTRO MODELO:
 * - canGigantamax: boolean ✅ (ya agregado)
 * - hasMegaStone: boolean ❌ (FALTA)
 */

// ===================================
// ✅ MODELO CORRECTO SEGÚN BACKEND
// ===================================

export interface PokemonListItemDto_Official {
	/** ID único del Pokémon en la base de datos */
	id: number
	/** ID de especie (ej: 1 = Bulbasaur, 25 = Pikachu) */
	speciesId: number
	/** ID de forma (ej: 0 = Meowth Normal, 1 = Meowth de Alola, 2 = Meowth de Galar) */
	form: number
	/** Nickname del Pokémon (null si usa el nombre de la especie) */
	nickname?: string
	/** Nivel del Pokémon (1-100) */
	level: number
	/** Si es shiny */
	isShiny: boolean
	/** ID de la Pokébola en la que fue capturado */
	ballId: number
	/** Tipo Tera (Gen 9), null si no aplica */
	teraType?: number
	/** Clave para identificar el sprite (especie+forma+shiny) */
	spriteKey: string
	/** Generación donde la especie fue introducida por primera vez (campo calculado) */
	originGeneration: number
	/** Generación donde este Pokémon específico fue capturado/obtenido (campo calculado) */
	capturedGeneration: number
	/** Si este Pokémon puede Gigantamax (solo archivos Gen 8+) */
	canGigantamax: boolean
	/** Si este Pokémon tiene una Mega Piedra equipada (afecta la visualización de la forma) */
	hasMegaStone: boolean
}

// ===================================
// 🔧 ACCIONES REQUERIDAS
// ===================================

/**
 * 1. ❌ ELIMINAR CAMPOS INEXISTENTES:
 *    - speciesName, ballName, teraTypeName, type1, type2
 *    - nature, ability, experience, currentFriendship
 *    - isEgg, pokedexNumber, originGame
 *
 * 2. ✅ CAMBIAR OPCIONALES A REQUERIDOS:
 *    - gender: number (requerido)
 *    - spriteKey: string (requerido)
 *    - originGeneration: number (requerido)
 *    - capturedGeneration: number (requerido)
 *
 * 3. ➕ AGREGAR CAMPOS FALTANTES:
 *    - hasMegaStone: boolean
 *
 * 4. 🔄 ACTUALIZAR SERVICIOS:
 *    - Pokemon.ts service
 *    - PokemonCard.tsx component
 *    - App.tsx main component
 *    - Cualquier lugar que use los campos eliminados
 */

// Este archivo es solo para análisis - sin exports por defecto
