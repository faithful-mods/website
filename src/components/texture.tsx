import { useMemo } from 'react';
import type { RefObject } from 'react';

import { GoAlert, GoHash, GoLog } from 'react-icons/go';
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
			<Stack gap={2} align="start" miw={450} maw={450}>
				<SmallTile color="gray">
					<Text fw={500} ta="center">{texture.name}</Text>
				</SmallTile>
				{texture.vanillaTextureId && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }} >
							<GoAlert color="orange" />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs">
								Vanilla texture : {texture.vanillaTextureId}
							</Text>
						</SmallTile>
					</Group>
				)}
				<Group gap={2} w="100%" wrap="nowrap" align="start">
					<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
						<GoHash />
					</SmallTile>
					<SmallTile color="gray">
						<Text size="xs">
							ID: {texture.id}
						</Text>
					</SmallTile>
				</Group>
				<Group gap={2} w="100%" wrap="nowrap" align="start">
					<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
						<GoLog />
					</SmallTile>
					<SmallTile color="gray">
						<Text size="xs">
							{texture.hash}
						</Text>
					</SmallTile>
				</Group>
				{texture.aliases.length > 0 && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<PiApproximateEquals />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs">
								{texture.aliases.join(', ')}
							</Text>
						</SmallTile>
					</Group>
				)}
			</Stack>
		</TextureImage>
	);
}
