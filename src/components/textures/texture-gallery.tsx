import { useMemo } from 'react';
import type { RefObject } from 'react';

import { Group, Stack, Text, useComputedColorScheme } from '@mantine/core';

import { SmallTile } from '~/components/base/small-tile';
import { TextureImage } from '~/components/textures/texture-img';

import type { Texture } from '@prisma/client';

interface Props<T> {
	container?: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	className?: string;
	data?: T
	tiles?: (data: T) => TileProp[];
	src?: (data: T) => string;
	onClick?: () => void;
	isTransparent?: (data: T) => boolean;
}

interface TileProp {
	shown: boolean;
	icon: React.ReactNode;
	iconAction?: () => void;
	iconHoverAction?: (isHovering: boolean) => void;
	description: React.ReactNode;
	descriptionAction?: () => void;
	descriptionHoverAction?: (isHovering: boolean) => void;
}

export function GalleryTexture<T>({
	container,
	className,
	rowItemsGap,
	rowItemsLength,
	texture,
	data,
	src,
	tiles,
	onClick,
	isTransparent,
}: Props<T>) {

	const size = useMemo(() => ((container?.current?.clientWidth ?? 1) - (rowItemsGap * (rowItemsLength - 1))) / rowItemsLength,
		[container, rowItemsGap, rowItemsLength]
	);

	const colorScheme = useComputedColorScheme();
	const tileColor = colorScheme === 'dark' ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-3)';

	return (
		<TextureImage
			// drill down to the texture image
			onClick={onClick}
			isTransparent={data && (isTransparent?.(data) ?? false)}
			// ---

			alt={texture.name}
			src={(data && src) ? src(data) : texture.filepath}
			mcmeta={texture.mcmeta}
			className={className}
			size={size}
			isTiled={texture.name.includes('flow')}
			popupStyles={{
				backgroundColor: 'transparent',
				padding: 0,
				border: 'none',
				boxShadow: 'none',
			}}
		>
			<Stack gap={2} align="start" maw={450}>
				<SmallTile color={tileColor}>
					<Text fw={500} ta="center">{texture.name}</Text>
				</SmallTile>
				{data && tiles?.(data)?.map((tile, index) => (
					tile.shown &&
					<Group key={index} gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile
							color={tileColor}
							className="navbar-icon-fix"
							style={{ '--size': '28px' }}
							onClick={() => tile.iconAction?.()}
							onMouseEnter={() => tile.iconHoverAction?.(true)}
							onMouseLeave={() => tile.iconHoverAction?.(false)}
						>
							{tile.icon}
						</SmallTile>
						<SmallTile
							color={tileColor}
							onClick={() => tile.descriptionAction?.()}
							onMouseEnter={() => tile.descriptionHoverAction?.(true)}
							onMouseLeave={() => tile.descriptionHoverAction?.(false)}
						>
							<Text size="xs">
								{tile.description}
							</Text>
						</SmallTile>
					</Group>
				))}
			</Stack>
		</TextureImage>
	);
};
