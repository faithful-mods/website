import { HoverCard, Image, useMantineColorScheme } from '@mantine/core';
import { CSSProperties, useEffect, useState } from 'react';

import { useMCMETA } from '~/hooks/use-mcmeta';
import { TextureMCMETA } from '~/types';

interface TextureImageProps {
	src: string;
	alt: string;
	className?: string;
	size?: number | string;
	style?: React.CSSProperties;
	notPixelated?: boolean;
	fallback?: string;
	mcmeta?: TextureMCMETA;
	children?: React.ReactNode;
}

export function TextureImage({ src, alt, className, size, style, mcmeta, notPixelated, children, fallback }: TextureImageProps) {
	const [_src, setSource] = useState(src);
	const { canvasRef, isMCMETAValid } = useMCMETA(mcmeta, src);

	const trueSize = size ? typeof size === 'number' ? `${size}px` : size : '200px';

	const { colorScheme } = useMantineColorScheme();
	const defaultFallback = colorScheme === 'dark' ? '/transparent.png' : '/transparent_light.png';

	const imageStyle: CSSProperties = {
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

	useEffect(() => {
		setSource(src);
	}, [src]);

	const image = () => {
		return (
			<div className="texture-background" style={containerStyle}>
				{(!mcmeta || !isMCMETAValid) && (
					<Image
						src={_src}
						alt={alt}
						fit="contain"
						style={imageStyle}
						className={`${!notPixelated && 'image-pixelated'} ${className}`}
						onError={() => setSource(fallback ?? defaultFallback)}
					/>
				)}
				{mcmeta && isMCMETAValid && (
					<canvas ref={canvasRef} />
				)}
			</div>
		);
	};

	if (!children) return image();

	return (
		<HoverCard position="right">
			<HoverCard.Target>
				{image()}
			</HoverCard.Target>
			<HoverCard.Dropdown>
				{children}
			</HoverCard.Dropdown>
		</HoverCard>
	);
}
