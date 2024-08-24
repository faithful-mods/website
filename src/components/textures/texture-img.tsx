import type { FC } from 'react';

import { HoverCard, useMantineColorScheme } from '@mantine/core';
import { Texture } from 'react-minecraft';

import type { TextureMCMeta } from 'react-minecraft';

interface Props {
	isTransparent?: boolean;
	isTiled?: boolean;
	src: string;
	alt: string;
	className?: string;
	size?: number | string;
	styles?: React.CSSProperties;
	popupStyles?: React.CSSProperties;
	notPixelated?: boolean;
	fallback?: string;
	mcmeta?: TextureMCMeta | null;
	children?: React.ReactNode;
	withArrow?: boolean;
	onPopupClick?: () => void;
	onClick?: () => void;
}

export const TextureImage: FC<Props> = ({
	isTransparent,
	isTiled,
	src,
	alt,
	className,
	size,
	styles,
	popupStyles,
	mcmeta,
	children,
	fallback,
	onClick,
	onPopupClick,
}) => {
	const trueSize = size ? typeof size === 'number' ? `${size}px` : size : '200px';
	const { colorScheme } = useMantineColorScheme();

	const image = () => {
		return (
			<div onClick={onClick}>
				<Texture
					src={src}
					alt={alt}
					animation={mcmeta && mcmeta.animation
						? {
							mcmeta: { animation: mcmeta.animation },
							tiled: isTiled,
						}
						: undefined
					}
					size={trueSize}
					className={className}
					background={{
						url: fallback ?? colorScheme === 'dark' ? '/transparent.png' : '/transparent_light.png',
					}}
					style={{
						opacity: isTransparent ? 0.4 : 1,
						filter: isTransparent ? 'grayscale(0.6)' : 'none',
						...styles,
					}}
				/>
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
