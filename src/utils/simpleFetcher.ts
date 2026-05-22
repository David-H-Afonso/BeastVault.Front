const cache = new Map<string, { data: unknown; timestamp: number }>()
const inflight = new Map<string, Promise<unknown>>()

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

export const simpleFetcher = {
	async fetchWithCache<T>(url: string): Promise<T> {
		const cached = cache.get(url)
		if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
			return cached.data as T
		}

		const pending = inflight.get(url)
		if (pending) return pending as Promise<T>

		const request = fetch(url)
			.then(async (response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`)
				const data = await response.json()
				cache.set(url, { data, timestamp: Date.now() })
				inflight.delete(url)
				return data as T
			})
			.catch((error) => {
				inflight.delete(url)
				throw error
			})

		inflight.set(url, request)
		return request
	},

	clear() {
		cache.clear()
		inflight.clear()
	},
}
