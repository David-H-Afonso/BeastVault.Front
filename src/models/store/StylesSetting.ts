import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'

export type ViewMode = 'grid' | 'organize' | 'box' | 'kanban'
export type OrganizeDensity = 'expanded' | 'compact'
export type KanbanDragMode = 'move' | 'copy'
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
	organizeDensity: OrganizeDensity
	kanbanDragMode: KanbanDragMode
}
