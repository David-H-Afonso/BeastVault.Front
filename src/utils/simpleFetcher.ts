/**
 * Simple fetcher utility to replace StaticResourceCache
 * Uses standard fetch with basic error handling
 */

export const simpleFetcher = {
	/**
	 * Fetch data with basic error handling
	 */
	async fetchWithCache<T>(url: string): Promise<T> {
		try {
			const response = await fetch(url)
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			
			const data = await response.json()
			return data as T
		} catch (error) {
			console.error(`Error fetching ${url}:`, error)
			throw error
		}
	}
}
