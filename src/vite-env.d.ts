/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// Declaraciones para importar SVGs con SVGR
declare module '*.svg?react' {
	import React from 'react'
	const ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>
	export default ReactComponent
}

// Declaraciones para importar SVGs como URL (fallback)
declare module '*.svg' {
	const content: string
	export default content
}
