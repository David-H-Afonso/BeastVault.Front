import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'

export type ViewMode = 'tags' | 'grid' | 'list'
export type ThemeName =
	| 'dark'
	| 'light'
	| 'pokemon'
	| 'water'
	| 'fire'
	| 'grass'
	| 'electric'
	| 'psychic'

export interface StyleSettingsState {
	backgroundType: CardBackgroundTypeName
	viewMode: ViewMode
	theme: ThemeName
	spriteType: SpriteTypeName
}
