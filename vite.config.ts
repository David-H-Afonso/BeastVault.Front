import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [
		react(),
		svgr({
			svgrOptions: {
				exportType: 'default',
			},
			include: '**/*.svg?react',
		}),
	],
	base: './',
	resolve: {
		alias: {
			'@': '/src',
			'@/assets': '/src/assets',
			'@/components': '/src/components',
			'@/hooks': '/src/hooks',
			'@/services': '/src/services',
			'@/utils': '/src/utils',
			'@/models': '/src/models',
			'@/enums': '/src/enums',
			'@/store': '/src/store',
			'@/environments': '/src/environments',
		},
	},
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (
							id.includes('react-router') ||
							id.includes('react-dom') ||
							id.includes('/react/') ||
							id.includes('scheduler')
						) {
							return 'vendor-react'
						}
						if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux')) {
							return 'vendor-redux'
						}
						if (id.includes('@dnd-kit')) {
							return 'vendor-dnd'
						}
						return 'vendor'
					}
				},
			},
		},
	},
	server: {
		port: 5173,
		host: true,
	},
})
