import { useRouteError } from 'react-router-dom'

const ErrorBoundary = () => {
	const error = useRouteError() as { message?: string }
	console.error(error)
	return (
		<div>
			<h1>Oops! Something went wrong.</h1>
			<p>{error.message || 'An unexpected error occurred.'}</p>
		</div>
	)
}

export default ErrorBoundary
