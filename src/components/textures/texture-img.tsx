import { useEffect, useState } from 'react';
import type { CSSProperties, FC } from 'react';

import { HoverCard, Image, useMantineColorScheme } from '@mantine/core';

import { useMCMETA } from '~/hooks/use-mcmeta';

import type { TextureMCMETA } from '~/types';

interface Props {
	solidBackground?: boolean;
	isTransparent?: boolean;
	src: string;
	alt: string;
	className?: string;
	size?: number | string;
	styles?: React.CSSProperties;
	popupStyles?: React.CSSProperties;
	notPixelated?: boolean;
	fallback?: string;
	mcmeta?: TextureMCMETA | null;
	children?: React.ReactNode;
	withArrow?: boolean;
	onPopupClick?: () => void;
	onClick?: () => void;
}

export const TextureImage: FC<Props> = ({
	solidBackground,
	isTransparent,
	src,
	alt,
	className,
	size,
	styles,
	popupStyles,
	mcmeta,
	notPixelated,
	children,
	fallback,
	onClick,
	onPopupClick,
}) => {
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
		opacity: isTransparent ? 0.4 : 1,
		filter: isTransparent ? 'grayscale(.6)' : 'none',
	};

	const containerStyle = {
		...imageStyle,
		opacity: 1,
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
						style={{ ...imageStyle, ...styles }}
						className={`${!notPixelated && 'image-pixelated'} ${solidBackground && 'solid-background'} ${className ?? ''} ${onClick && 'cursor-pointer'}`}
						onError={() => setSource(fallback ?? defaultFallback)}
					/>
				)}
				{mcmeta && isMCMETAValid && (
					<canvas
						ref={canvasRef}
						onClick={onClick}
						className={`${onClick && 'cursor-pointer'} ${solidBackground && 'solid-background'} ${className ?? ''}`}
						style={imageStyle}
					/>
				)}
			</div>
		);
	};

	if (!children) return image();

	return (
		<HoverCard
			position="right-start"
			keepMounted={process.env.NODE_ENV === 'development'}
		>
			<HoverCard.Target>
				{image()}
			</HoverCard.Target>
			<HoverCard.Dropdown
				onClick={onPopupClick}
				className="hover-card-popup"
				style={popupStyles}
			>
				{children}
			</HoverCard.Dropdown>
		</HoverCard>
	);
};
