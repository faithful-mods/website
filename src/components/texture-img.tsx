import { HoverCard, Image } from '@mantine/core';
import { useState } from 'react';

interface TextureImageProps {
	src: string;
	alt: string;
	className?: string;
	size?: number | string;
	style?: React.CSSProperties;
	notPixelated?: boolean;
	fallback?: string;

	children?: React.ReactNode;
}

export function TextureImage({ src, alt, className, size, style, notPixelated, children, fallback }: TextureImageProps) {
	const [_src, setSource] = useState(src);
	const trueSize = size ? typeof size === 'number' ? `${size}px` : size : '200px';

	const imageStyle = {
		maxWidth: trueSize,
		maxHeight: trueSize,
		minWidth: trueSize,
		minHeight: trueSize,
		height: trueSize,
		width: trueSize,
	};

	const containerStyle = {
		...imageStyle,
		...style,
	};

	if (children)
		return (
			<HoverCard
				position="right"
			>
				<HoverCard.Target>
					<div className="texture-background" style={containerStyle}>
						<Image
							src={_src}
							alt={alt}
							fit="contain"
							style={imageStyle}
							className={`${!notPixelated && 'image-pixelated'} ${className}`}
							onError={() => setSource(fallback ?? '/transparent.png')}
						/>
					</div>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					{children}
				</HoverCard.Dropdown>
			</HoverCard>
		);

	return (
		<div className="texture-background" style={containerStyle}>
			<Image
				src={_src}
				alt={alt}
				fit="contain"
				style={imageStyle}
				className={`${!notPixelated && 'image-pixelated'} ${className}`}
				onError={() => setSource(fallback ?? '/transparent.png')}
			/>
		</div>
	);
}
