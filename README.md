# Beast Vault

A modern, React-based Pokémon collection management application with advanced filtering, search, and organization capabilities. Beast Vault provides a comprehensive interface for managing your Pokémon collection with support for PKM files (.pk1 to .pk9) and seamless integration with PokéAPI for rich visual data.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router DOM 7
- **Styling**: SCSS with custom themes
- **Build Tool**: Vite 7
- **Package Manager**: npm

## Legal Disclaimer

**Beast Vault** is an independent, non-commercial, open-source project for personal use. It is **NOT** affiliated, associated, endorsed, sponsored, or approved by Nintendo, The Pokémon Company, Game Freak, Creatures Inc., or any of their subsidiaries, affiliates, or partners. All trademarks, service marks, trade names, product names, and trade dress mentioned or referenced within this project are the property of their respective owners.

This software is **not an official Pokémon product** and does not attempt to simulate, emulate, reproduce, replace, or provide any product, service, or functionality of official Pokémon games, services, or hardware. Any similarity to proprietary formats, terminology, or concepts is purely for descriptive purposes and does not imply endorsement or association.

**Beast Vault** is intended solely for lawful, personal-use management and storage of legitimately obtained Pokémon data files (e.g., `.pk*` formats) that belong to the user. The project does **NOT**:

- Provide or facilitate the creation, modification, or acquisition of Pokémon.
- Distribute or include copyrighted game assets, code, or data belonging to Nintendo or The Pokémon Company.
- Encourage, promote, or support any activity that violates applicable laws, the Pokémon games' End User License Agreements (EULAs), or the terms of service of official products or platforms.

Use of this software is entirely at the user's own risk. The authors and contributors disclaim any and all responsibility and liability for misuse, infringement, or violation of third-party rights. By using this software, the user agrees to comply with all applicable laws, regulations, and contractual obligations.

## TL;DR

Beast Vault is a powerful web application, ready for .exe and docker compilation, for Pokémon collectors to:

- **Import & Manage** PKM files from generations 1-9
- **Filter & Search** with 20+ advanced criteria (shiny, types, levels, etc.)
- **Organize** with custom tags and grouping
- **Visualize** with high-quality range of sprites.

## Local Installation

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- A compatible backend API ([Beast Vault Backend](https://github.com/David-H-Afonso/BeastVault.Api))

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/David-H-Afonso/PokemonBank.Front.git
   cd PokemonBank.Front
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create environment files in `src/environments/`:

   **For development (`environment.dev.ts`):**

   ```typescript
   export const environment = {
   	production: false,
   	baseUrl: 'http://localhost:5000/api', // Your backend URL
   }
   ```

   **For production (`environment.prod.ts`):**

   ```typescript
   export const environment = {
   	production: true,
   	baseUrl: 'https://your-production-api.com/api',
   }
   ```

## Local Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Other Development Commands

```bash
# Type checking
npm run build

# Linting
npm run lint

# Preview production build
npm run preview
```

## Build for Production

### Create Production Build

```bash
npm run build
```

The build output will be generated in the `dist/` directory, ready for deployment to any static hosting service.

### Preview Production Build Locally

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── elements/           # Core reusable UI elements
│   │   ├── Filters/        # Advanced filtering system
│   │   ├── LayoutSelector/ # View layout controls
│   │   ├── Modal/          # Modal dialogs
│   │   ├── Pagination/     # Pagination controls
│   │   ├── PokemonCard/    # Individual Pokémon cards
│   │   ├── PokemonRow/     # Individual Pokémon rows
│   │   ├── TagManager/     # Tag management interface
│   │   ├── ThemeSelector/  # Theme switching
│   │   └── UploadAndScanFiles/ # File operations
│   ├── Home/              # Main application container
│   ├── PageNotFound/      # 404 error handling
│   └── Settings/          # Application settings
├── hooks/                  # Custom React hooks
│   ├── useAssets.ts       # Asset management
│   ├── usePokemon.ts      # Main Pokémon data hook
│   ├── usePokemonData.ts  # Individual Pokémon details
│   ├── useSprites.ts      # Sprite management
│   └── useUISettings.ts   # UI preferences
├── layouts/               # Layout components
│   ├── AppLayout.tsx      # Main app layout
│   ├── HeaderLayout.tsx   # Header-based layout
│   ├── EmptyLayout.tsx    # Minimal layout
│   └── elements/          # Layout-specific elements
├── models/                # TypeScript type definitions
│   ├── api/              # API response types
│   ├── enums/            # Enumeration definitions
│   ├── store/            # Redux state types
│   ├── Pokemon.ts        # Core Pokémon models
│   ├── Pokeapi.ts        # PokéAPI integration types
│   └── Tags.ts           # Tag system models
├── services/              # API and business logic
│   ├── Pokemon.ts        # Core Pokémon operations
│   ├── Pokeapi.ts        # PokéAPI integration
│   ├── PokemonNameService.ts # Name resolution
│   ├── TaggedPokemon.ts  # Tag-based operations
│   ├── Tags.ts           # Tag management
│   └── ThemeService.ts   # Theme management
├── store/                 # Redux state management
│   ├── features/         # Feature-based slices
│   │   ├── assets/       # Asset caching
│   │   ├── cache/        # Data caching
│   │   ├── layout/       # UI layout state
│   │   ├── pokemon/      # Pokémon data state
│   │   └── styleSettings/ # Theme and styling
│   └── hooks/            # Redux hooks
├── styles/               # Global SCSS styles
│   ├── _themes.scss      # Theme definitions
│   ├── _variables.scss   # SCSS variables
│   └── index.scss        # Main stylesheet
├── utils/                # Utility functions
│   ├── customFetch.ts    # HTTP client
│   ├── getBestSpriteByType.ts # Sprite optimization
│   ├── getTypeIconUrl.ts # Type icon helpers
│   ├── groupPokemonByTags.ts # Grouping utilities
│   ├── simpleFetcher.ts  # Simple HTTP fetcher
│   └── typeColors.ts     # Type color schemes
└── environments/         # Environment configuration
    ├── environment.dev.ts
    ├── environment.prod.ts
    └── index.ts
```

## Key Features

### Advanced Filtering System

- **Text Search**: Search by name, nickname, or species
- **Specific Filters**: Pokédex number, shiny status, level range, gender, generation
- **Type Filtering**: Primary/secondary types with advanced matching modes
- **Equipment Filters**: Pokéball type, held items, Tera type
- **Multi-level Sorting**: Primary and secondary sort criteria

### Smart Pagination

- Configurable items per page (25, 50, 100, 200)
- Page navigation with total count display
- Direct page jumping

### Rich Visual Interface

- **Detailed Pokémon Cards** with comprehensive information display
- **Dynamic Sprites** from PokéAPI with intelligent fallbacks
- **Visual Indicators** for shiny status, gender, egg status
- **Extended Metadata** including Pokédex numbers, forms, Tera types

### File Management

- **Import Support** for PKM files (.pk1 through .pk9)
- **File Downloads** with original backup preservation
- **Directory Scanning** for bulk operations
- **Safe Deletion** with confirmation dialogs

### Organization System

- **Custom Tags** for categorizing collections
- **Tag-based Grouping** for efficient browsing
- **Bulk Tag Operations** for managing large collections

### Performance Optimizations

- **Redux-based Caching** for fast data access
- **Sprite Optimization** with multiple fallback sources
- **Lazy Loading** for improved performance
- **Memory Management** with automatic cache cleanup

## Acknowledgments

Beast Vault wouldn't be possible without the incredible work of these amazing open-source projects and communities:

### Core Dependencies & Data Sources

- **[PokéAPI](https://pokeapi.co/)** - The comprehensive Pokémon data API that powers our species information, types, and official sprite sources
- **[PKHeX](https://github.com/kwsch/PKHeX)** - Kurt's essential Pokémon save file editor that inspired PKM file format handling and provided crucial insights into Pokémon data structures

### Sprite Collections & Visual Assets

- **[bamq/pokemon-sprites](https://github.com/bamq/pokemon-sprites)** - High-quality Pokémon sprite collection that provides beautiful alternative sprite sources
- **[msikma/pokesprite](https://github.com/msikma/pokesprite)** - Comprehensive sprite database with consistent formatting and extensive sprite variants

### Special Thanks

We're deeply grateful to these projects and their maintainers for making their work freely available to the community. Their dedication to open-source development and the Pokémon community has made Beast Vault possible.

## API Integration

Beast Vault integrates seamlessly with:

- **PokéAPI** for official Pokémon data and sprites
- **Beast Vault Backend** for PKM file processing and storage
- **Multiple Sprite Sources** including official artwork, home sprites, and community alternatives

---

## 🤝 Contributing

We welcome contributions to Beast Vault! Please feel free to:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE.md](LICENSE.md) file for details.

---

**Built with ❤️ for Pokémon collectors worldwide**
