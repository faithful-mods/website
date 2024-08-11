import { useMemo } from 'react';
import type { RefObject } from 'react';

import { GoHash } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Group, Stack, Text } from '@mantine/core';

import { SmallTile } from '~/components/small-tile';
import { TextureImage } from '~/components/texture-img';

import type { Texture } from '@prisma/client';

export interface GalleryTextureProps {
	container: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	className?: string;
	onClick?: () => void;
}

export function GalleryTexture({
	container,
	className,
	rowItemsGap,
	rowItemsLength,
	texture,
	onClick,
}: GalleryTextureProps) {

	const size = useMemo(() => ((container.current?.clientWidth ?? 1) - (rowItemsGap * (rowItemsLength - 1))) / rowItemsLength,
		[container, rowItemsGap, rowItemsLength]
	);

	return (
		<TextureImage
			alt={texture.name}
			src={texture.filepath}
			mcmeta={texture.mcmeta}
			className={className}
			onClick={onClick}
			size={size}
			popupStyles={{
				backgroundColor: 'transparent',
				padding: 0,
				border: 'none',
				boxShadow: 'none',
			}}
		>
			<Stack gap={2} align="start" miw={400} maw={400}>
				<SmallTile>
					<Text fw={500} ta="center">{texture.name}</Text>
				</SmallTile>
				<Group gap={2} w="100%" wrap="nowrap" align="start">
					<SmallTile className="navbar-icon-fix" style={{ '--size': '28px' }}>
						<GoHash />
					</SmallTile>
					<SmallTile>
						<Text size="xs" c="dimmed">
							ID: {texture.id}
						</Text>
					</SmallTile>
				</Group>
				{texture.aliases.length > 0 && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<PiApproximateEquals />
						</SmallTile>
						<SmallTile>
							<Text size="xs" c="dimmed">
								{texture.aliases.join(', ')}
							</Text>
						</SmallTile>
					</Group>
				)}
			</Stack>
		</TextureImage>
	);
}
