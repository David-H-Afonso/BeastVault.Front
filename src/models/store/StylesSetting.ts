import type { CardBackgroundTypeName } from '@/models/enums/CardBackgroundTypes'
import type { SpriteTypeName } from '@/models/enums/SpriteTypes'

export type ViewMode = 'browse' | 'boxes'
export type BrowseLayout = 'list' | 'grid'
export type OrganizeDensity = 'expanded' | 'compact'
export type KanbanDragMode = 'move' | 'copy'
export type BoxIconStyle = 'bulbapedia' | 'home'
export type ThemeName = 'dark' | 'home'

export interface StyleSettingsState {
	backgroundType: CardBackgroundTypeName
	viewMode: ViewMode
	browseLayout: BrowseLayout
	theme: ThemeName
	spriteType: SpriteTypeName
	organizeDensity: OrganizeDensity
	kanbanDragMode: KanbanDragMode
	boxIconStyle: BoxIconStyle
}
