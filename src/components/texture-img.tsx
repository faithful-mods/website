import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { HoverCard, Image, useMantineColorScheme } from '@mantine/core';

import { useMCMETA } from '~/hooks/use-mcmeta';

import type { TextureMCMETA } from '~/types';

interface TextureImageProps {
	src: string;
	alt: string;
	className?: string;
	size?: number | string;
	styles?: React.CSSProperties;
	notPixelated?: boolean;
	fallback?: string;
	mcmeta?: TextureMCMETA | null;
	children?: React.ReactNode;
	onPopupClick?: () => void;
	onClick?: () => void;
}

export function TextureImage({ src, alt, className, size, styles, mcmeta, notPixelated, children, fallback, onClick, onPopupClick }: TextureImageProps) {
	const [_src, setSource] = useState(src);
	const { canvasRef, isMCMETAValid } = useMCMETA(src, mcmeta);

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
		...styles,
	};

	useEffect(() => {
		setSource(src);
	}, [src]);

	const image = () => {
		return (
			<div className="texture-background" style={containerStyle}>
				{(!mcmeta || !isMCMETAValid) && (
					<Image
						onClick={onClick}
						src={_src}
						alt={alt}
						fit="contain"
						style={imageStyle}
						className={`${!notPixelated && 'image-pixelated'} ${className ?? ''} ${onClick && 'cursor-pointer'}`}
						onError={() => setSource(fallback ?? defaultFallback)}
					/>
				)}
				{mcmeta && isMCMETAValid && (
					<canvas
						ref={canvasRef}
						onClick={onClick}
						className={`${onClick && 'cursor-pointer'} ${className ?? ''}`}
						style={imageStyle}
					/>
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
			<HoverCard.Dropdown
				onClick={onPopupClick}
				className="hover-card-popup"
			>
				{children}
			</HoverCard.Dropdown>
		</HoverCard>
	);
}
