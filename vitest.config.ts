import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': resolvePath('./src'),
			'@/assets': resolvePath('./src/assets'),
			'@/components': resolvePath('./src/components'),
			'@/hooks': resolvePath('./src/hooks'),
			'@/services': resolvePath('./src/services'),
			'@/utils': resolvePath('./src/utils'),
			'@/models': resolvePath('./src/models'),
			'@/enums': resolvePath('./src/models/enums'),
			'@/store': resolvePath('./src/store'),
			'@/environments': resolvePath('./src/environments'),
		},
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		css: false,
	},
})
