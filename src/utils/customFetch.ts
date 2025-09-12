/**
 * HTTP methods supported by the custom fetch utility
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

/**
 * Configuration options for customFetch requests
 */
type CustomFetchOptions = {
	/** HTTP method for the request */
	method?: HttpMethod
	/** Request headers as key-value pairs */
	headers?: Record<string, string>
	/** Request body data (automatically serialized for JSON) */
	body?: any
	/** URL query parameters to append to the endpoint */
	params?: Record<string, string | number | boolean>
	/** AbortSignal for request cancellation */
	signal?: AbortSignal
	/** Request timeout in milliseconds */
	timeout?: number
	/** Custom base URL to prepend to relative URLs */
	baseURL?: string
}

/**
 * Builds URL query string from parameters object
 * @param queryParameters - Object containing query parameters
 * @returns Formatted query string with leading '?' or empty string
 */
const buildQueryString = (queryParameters?: Record<string, string | number | boolean>): string => {
	if (!queryParameters || Object.keys(queryParameters).length === 0) {
		return ''
	}

	const encodeURIComponent = window.encodeURIComponent
	const queryPairs = Object.entries(queryParameters)
		.filter(([_, value]) => value !== null && value !== undefined)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)

	return queryPairs.length > 0 ? `?${queryPairs.join('&')}` : ''
}

/**
 * Determines if the request body should be JSON serialized
 * @param requestBody - The body data to check
 * @returns True if body should be JSON serialized
 */
const shouldSerializeAsJson = (requestBody: any): boolean => {
	return (
		typeof requestBody === 'object' &&
		requestBody !== null &&
		!(requestBody instanceof FormData) &&
		!(requestBody instanceof URLSearchParams) &&
		!(requestBody instanceof Blob) &&
		!(requestBody instanceof ArrayBuffer)
	)
}

/**
 * Processes the response based on its content type
 * @param httpResponse - The fetch Response object
 * @returns Parsed response data
 */
const parseResponseData = async (httpResponse: Response): Promise<any> => {
	const responseContentType = httpResponse.headers.get('content-type') || ''

	if (responseContentType.includes('application/json')) {
		return await httpResponse.json()
	}

	if (responseContentType.includes('text/')) {
		return await httpResponse.text()
	}

	if (
		responseContentType.includes('application/octet-stream') ||
		responseContentType.includes('image/')
	) {
		return await httpResponse.blob()
	}

	// Default to text for unknown content types
	return await httpResponse.text()
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Promise that rejects with timeout error
 */
const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
	return new Promise((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Request timeout after ${timeoutMs}ms`))
		}, timeoutMs)
	})
}

/**
 * Universal HTTP client for making API requests with automatic JSON handling,
 * query parameter encoding, and comprehensive error handling
 *
 * @template T - Expected response data type
 * @param endpoint - URL endpoint (absolute or relative)
 * @param requestOptions - Configuration options for the request
 * @returns Promise resolving to typed response data
 *
 * @example
 * ```typescript
 * // GET request with query parameters
 * const users = await customFetch<User[]>('/api/users', {
 *   params: { page: 1, limit: 10 }
 * })
 *
 * // POST request with JSON body
 * const newUser = await customFetch<User>('/api/users', {
 *   method: 'POST',
 *   body: { name: 'John', email: 'john@example.com' }
 * })
 *
 * // Request with custom headers and timeout
 * const data = await customFetch<ApiResponse>('/api/data', {
 *   headers: { 'Authorization': 'Bearer token' },
 *   timeout: 5000
 * })
 * ```
 */
export const customFetch = async <T = any>(
	endpoint: string,
	requestOptions: CustomFetchOptions = {}
): Promise<T> => {
	const {
		method = 'GET',
		headers: customHeaders = {},
		body: requestBody,
		params: queryParams,
		signal: abortSignal,
		timeout: timeoutMs,
		baseURL: baseUrl = '',
	} = requestOptions

	// Construct the complete URL with base URL and query parameters
	const completeUrl = baseUrl + endpoint + buildQueryString(queryParams)

	// Prepare fetch configuration
	const fetchConfiguration: RequestInit = {
		method,
		headers: { ...customHeaders },
		signal: abortSignal,
	}

	// Handle request body serialization for non-GET requests
	if (requestBody !== undefined && method !== 'GET' && method !== 'HEAD') {
		if (shouldSerializeAsJson(requestBody)) {
			fetchConfiguration.body = JSON.stringify(requestBody)
			fetchConfiguration.headers = {
				...fetchConfiguration.headers,
				'Content-Type': 'application/json',
			}
		} else {
			fetchConfiguration.body = requestBody
		}
	}

	try {
		// Create fetch promise
		const fetchPromise = fetch(completeUrl, fetchConfiguration)

		// Handle timeout if specified
		const httpResponse = timeoutMs
			? await Promise.race([fetchPromise, createTimeoutPromise(timeoutMs)])
			: await fetchPromise

		// Parse response data based on content type
		const responseData = await parseResponseData(httpResponse)

		// Handle HTTP error status codes
		if (!httpResponse.ok) {
			const errorMessage =
				typeof responseData === 'string' ? responseData : JSON.stringify(responseData)

			throw new Error(`HTTP ${httpResponse.status} ${httpResponse.statusText}: ${errorMessage}`)
		}

		return responseData as T
	} catch (fetchError) {
		// Re-throw with enhanced error context
		if (fetchError instanceof Error) {
			throw new Error(`Request failed for ${method} ${completeUrl}: ${fetchError.message}`)
		}
		throw fetchError
	}
}
