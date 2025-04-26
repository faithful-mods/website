import { useMemo } from 'react';
import type { FC, RefObject } from 'react';

import { Group, Stack, Text, useComputedColorScheme } from '@mantine/core';

import { SmallTile } from '~/components/base/small-tile';
import { TextureImage } from '~/components/textures/texture-img';

import type { Texture } from '@prisma/client';

interface Props {
	container?: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	className?: string;
	tiles?: TileProp[];
	// drill down to the texture image
	onClick?: () => void;
	onMouseEnter?: () => void;
	isTransparent?: boolean;
	// ---
}

interface TileProp {
	shown: boolean;
	icon: React.ReactNode;
	iconAction?: () => void;
	iconHoverAction?: () => void;
	description: React.ReactNode;
	descriptionAction?: () => void;
	descriptionHoverAction?: () => void;
}

export const GalleryTexture: FC<Props> = ({
	container,
	className,
	rowItemsGap,
	rowItemsLength,
	texture,
	tiles,
	// drill down to the texture image
	onClick,
	onMouseEnter,
	isTransparent,
}) => {

	const size = useMemo(() => ((container?.current?.clientWidth ?? 1) - (rowItemsGap * (rowItemsLength - 1))) / rowItemsLength,
		[container, rowItemsGap, rowItemsLength]
	);

	const colorScheme = useComputedColorScheme();
	const tileColor = colorScheme === 'dark' ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)';

	return (
		<TextureImage
			// drill down to the texture image
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			isTransparent={isTransparent}
			// ---

			alt={texture.name}
			src={texture.filepath}
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
				{tiles?.map((tile, index) => (
					tile.shown &&
					<Group key={index} gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile
							color={tileColor}
							className="navbar-icon-fix"
							style={{ '--size': '28px' }}
							onClick={() => tile.iconAction?.()}
							onMouseEnter={() => tile.iconHoverAction?.()}
							onMouseLeave={() => tile.iconHoverAction?.()}
						>
							{tile.icon}
						</SmallTile>
						<SmallTile
							color={tileColor}
							onClick={() => tile.descriptionAction?.()}
							onMouseEnter={() => tile.descriptionHoverAction?.()}
							onMouseLeave={() => tile.descriptionHoverAction?.()}
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
