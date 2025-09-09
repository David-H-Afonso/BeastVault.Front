export const CardBackgroundType = {
	DIAGONAL_45: 'diagonal-45',
	DIAGONAL_90: 'diagonal-90',
	NO_TYPE_COLOR: 'no-type-color',
	CIRCLE_GRADIENT: 'circle-gradient',
	CIRCLE_GRADIENT_90: 'circle-gradient-90',
	BOTTOM_SPLIT: 'bottom-split',
} as const

export type CardBackgroundTypeName = (typeof CardBackgroundType)[keyof typeof CardBackgroundType]

export const CardBackgroundLabels = {
	[CardBackgroundType.DIAGONAL_45]: 'Diagonal 45°',
	[CardBackgroundType.DIAGONAL_90]: 'Diagonal 90°',
	[CardBackgroundType.NO_TYPE_COLOR]: 'Sin colores de tipo',
	[CardBackgroundType.CIRCLE_GRADIENT]: 'Círculo degradado',
	[CardBackgroundType.CIRCLE_GRADIENT_90]: 'Círculo degradado 90°',
	[CardBackgroundType.BOTTOM_SPLIT]: 'División inferior',
} as const
