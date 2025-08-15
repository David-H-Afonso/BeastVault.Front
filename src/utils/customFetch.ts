type CustomFetchOptions = {
	method?: string
	headers?: Record<string, string>
	body?: any
	params?: Record<string, string | number | boolean>
	signal?: AbortSignal
}

const buildQuery = (params?: Record<string, string | number | boolean>): string => {
	if (!params) return ''
	const esc = encodeURIComponent
	return (
		'?' +
		Object.entries(params)
			.map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
			.join('&')
	)
}

export const customFetch = async <T = any>(
	url: string,
	options: CustomFetchOptions = {}
): Promise<T> => {
	const { method = 'GET', headers = {}, body, params, signal } = options

	const fullUrl = url + buildQuery(params)

	const fetchOptions: RequestInit = {
		method,
		headers,
		signal,
	}

	if (body !== undefined && method !== 'GET') {
		if (
			typeof body === 'object' &&
			!(body instanceof FormData) &&
			!(body instanceof URLSearchParams)
		) {
			fetchOptions.body = JSON.stringify(body)
			fetchOptions.headers = {
				...headers,
				'Content-Type': 'application/json',
			}
		} else {
			fetchOptions.body = body
		}
	}

	const response = await fetch(fullUrl, fetchOptions)

	const contentType = response.headers.get('content-type')
	let data: any
	if (contentType && contentType.includes('application/json')) {
		data = await response.json()
	} else {
		data = await response.text()
	}

	if (!response.ok) {
		throw new Error(
			`Fetch error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`
		)
	}

	return data as T
}
