import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	base: './', // Importante para Electron - usar rutas relativas
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
				manualChunks: undefined,
			},
		},
	},
	server: {
		port: 5173,
		host: true,
	},
})
