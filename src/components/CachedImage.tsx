import React from 'react'
import { useCachedImage } from '../hooks/useCachedResources'

interface CachedImageProps {
	src: string | null
	alt: string
	className?: string
	width?: number
	height?: number
	onLoad?: () => void
	onError?: () => void
}

/**
 * Optimized image component that uses the static resource cache
 * to store images as base64 for faster subsequent loads
 */
export const CachedImage: React.FC<CachedImageProps> = ({
	src,
	alt,
	className,
	width,
	height,
	onLoad,
	onError,
}) => {
	const { imageUrl, isLoading, error } = useCachedImage(src)

	// Handle loading state
	if (isLoading && !imageUrl) {
		return (
			<div
				className={`cached-image-loading ${className || ''}`}
				style={{
					width: width || 'auto',
					height: height || 'auto',
					backgroundColor: '#f0f0f0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '12px',
					color: '#666',
				}}>
				Loading...
			</div>
		)
	}

	// Handle error state
	if (error || !imageUrl) {
		return (
			<div
				className={`cached-image-error ${className || ''}`}
				style={{
					width: width || 'auto',
					height: height || 'auto',
					backgroundColor: '#ffe6e6',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '12px',
					color: '#d00',
				}}>
				Failed to load
			</div>
		)
	}

	return (
		<img
			src={imageUrl}
			alt={alt}
			className={className}
			width={width}
			height={height}
			onLoad={onLoad}
			onError={onError}
			style={{
				transition: 'opacity 0.2s ease-in-out',
				opacity: isLoading ? 0.7 : 1,
			}}
		/>
	)
}

export default CachedImage
