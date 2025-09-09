import type { CardBackgroundTypeName } from '@/enums/CardBackgroundTypes'
import type { SpriteTypeName } from '@/enums/SpriteTypes'

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
