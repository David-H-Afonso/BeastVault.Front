# Beast Vault Frontend

Una aplicación React + TypeScript para gestionar una colección de Pokémon con funcionalidades avanzadas de filtrado, búsqueda y paginación.

## Características

### 🔍 Sistema de Filtros Avanzado

- **Búsqueda por texto**: Busca por nombre, apodo o especie
- **Filtros específicos**: Número de Pokédex, shiny, nivel, género, generación
- **Filtros de tipo**: Tipo primario, secundario con modos de filtrado avanzados
- **Equipamiento**: Filtra por Pokéball, objeto equipado, tipo Tera
- **Ordenamiento múltiple**: Ordena por campo principal y secundario

### 📄 Paginación

- Control de elementos por página (25, 50, 100, 200)
- Navegación por páginas con información de total de elementos
- Salto a páginas específicas

### 🎨 Interfaz Mejorada

- **Tarjetas de Pokémon** con información detallada
- **Sprites dinámicos** desde PokeAPI con fallbacks
- **Indicadores visuales** para shiny, género, huevos
- **Información adicional** como número de Pokédex, forma, tipo Tera

### 📁 Gestión de Archivos

- **Importación** de archivos PKM (.pk1 - .pk9)
- **Descarga** de archivos originales (backup y base de datos)
- **Escaneo automático** de directorios
- **Eliminación** con confirmación

## Estructura del Proyecto

```
src/
├── components/           # Componentes React reutilizables
│   ├── PokemonFilters.tsx   # Sistema de filtros completo
│   ├── PokemonCard.tsx      # Tarjeta individual de Pokémon
│   └── index.ts             # Barrel export
├── models/              # Tipos TypeScript
│   ├── Pokemon.ts          # Modelos de Pokémon y filtros
│   └── Pokeapi.ts          # Modelos de PokeAPI
├── services/            # Servicios API
│   ├── Pokemon.ts          # API de Pokémon con filtros
│   └── Pokeapi.ts          # Integración con PokeAPI
├── utils/               # Utilidades
│   ├── customFetch.ts      # Cliente HTTP personalizado
│   └── index.ts            # Exports
├── environments/        # Configuración de entornos
└── App.tsx             # Componente principal
```

## Modelos de Datos

### PokemonListFilterDto

```typescript
interface PokemonListFilterDto {
	// Búsqueda básica
	Search?: string
	PokedexNumber?: number
	SpeciesName?: string
	Nickname?: string
	IsShiny?: boolean

	// Características
	Form?: number
	Gender?: number
	OriginGeneration?: number
	CapturedGeneration?: number
	PokeballId?: number
	HeldItemId?: number
	PrimaryType?: number
	SecondaryType?: number

	// Filtros de tipo
	TypeFilterMode?: TypeFilterMode
	EnforceTypeOrder?: boolean

	// Nivel
	MinLevel?: number
	MaxLevel?: number

	// Ordenamiento
	SortBy?: SortBy
	SortDirection?: SortDirection
	ThenSortBy?: SortBy
	ThenSortDirection?: SortDirection

	// Paginación
	Skip: number
	Take: number

	// Adicionales
	SpeciesId?: number
	BallId?: number
	OriginGame?: number
	TeraType?: number
}
```

### Enumeraciones

#### TypeFilterMode

- `None (0)`: Sin filtro de tipo
- `ExactMatch (1)`: Coincidencia exacta
- `ContainsType (2)`: Contiene el tipo
- `PrimaryOnly (3)`: Solo tipo primario
- `SecondaryOnly (4)`: Solo tipo secundario
- `BothTypes (5)`: Ambos tipos

#### SortBy

- `PokedexNumber (0)`: Número de Pokédex
- `SpeciesName (1)`: Nombre de especie
- `Nickname (2)`: Apodo
- `Level (3)`: Nivel
- `CaptureDate (4)`: Fecha de captura
- `Nature (5)`: Naturaleza
- `Gender (6)`: Género
- `IsShiny (7)`: Shiny
- `OriginGeneration (8)`: Generación origen
- `CapturedGeneration (9)`: Generación captura
- `PrimaryType (10)`: Tipo primario
- `SecondaryType (11)`: Tipo secundario
- `TeraType (12)`: Tipo Tera

## Uso de los Componentes

### PokemonFilters

```tsx
<PokemonFilters onFiltersChange={handleFiltersChange} loading={loading} />
```

### PokemonCard

```tsx
<PokemonCard
	pokemon={pokemonData}
	sprite={spriteUrl}
	onDelete={handleDelete}
	onDownload={handleDownload}
	loading={loading}
/>
```

## API Service

### getPokemonList

```typescript
const result = await getPokemonList({
	Search: 'pikachu',
	IsShiny: true,
	MinLevel: 50,
	SortBy: SortBy.Level,
	SortDirection: SortDirection.Descending,
	Skip: 0,
	Take: 50,
})

// Resultado
// result.items: PokemonListItemDto[]
// result.total: number
```

## Ejemplos de Filtros

### Búsqueda básica

```typescript
{
  Search: "dragon",
  Skip: 0,
  Take: 50
}
```

### Filtros avanzados

```typescript
{
  IsShiny: true,
  MinLevel: 70,
  MaxLevel: 100,
  PrimaryType: 15, // Tipo Dragón
  SortBy: SortBy.Level,
  SortDirection: SortDirection.Descending,
  Skip: 0,
  Take: 25
}
```

### Paginación

```typescript
{
  Skip: 100,    // Saltar primeros 100
  Take: 50      // Tomar siguientes 50
}
```

## Scripts

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview
npm run preview
```

## Configuración

### Entornos

- **Desarrollo**: `src/environments/environment.dev.ts`
- **Producción**: `src/environments/environment.prod.ts`

### Tecnologías

- **React 19** con hooks
- **TypeScript** para tipado fuerte
- **Vite** para build y desarrollo
- **SCSS** para estilos
- **ESLint** para linting

## Integración con Backend

La aplicación está diseñada para trabajar con una API backend que soporte:

1. **Endpoint de listado**: `GET /pokemon` con query parameters
2. **Filtros múltiples**: Todos los filtros definidos en `PokemonListFilterDto`
3. **Paginación**: Parámetros `Skip` y `Take`
4. **Respuesta estructurada**: `{ items: Pokemon[], total: number }`

### Ejemplo de URL generada

```
/pokemon?Search=pika&IsShiny=true&MinLevel=50&SortBy=3&SortDirection=1&Skip=0&Take=25
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Documentación Adicional

- [Guía de uso de filtros](./FILTERS_USAGE.md)
- [API Reference](./API_REFERENCE.md)

---

Desarrollado con ❤️ para coleccionistas de Pokémon
