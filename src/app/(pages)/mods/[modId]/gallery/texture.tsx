import { useMemo } from 'react';
import type { RefObject } from 'react';

import { GoFileDiff, GoHash, GoPeople } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Avatar, Group, Stack, Text } from '@mantine/core';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';

import type { CardProps, PolymorphicComponentProps } from '@mantine/core';
import type { Resolution, Texture } from '@prisma/client';
import type { ContributionWithCoAuthors } from '~/types';

export interface GalleryTextureProps {
	container: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	resolution: Resolution | 'x16';
	contribution?: ContributionWithCoAuthors;
}

function SmallTile({ children, style, ...props }: PolymorphicComponentProps<'div', CardProps>) {
	return (
		<Tile
			w="100%"
			mih={28}
			style={{
				padding: '5px 8px 6px 8px',
				borderRadius: 5,
				...style,
			}}
			{...props}
		>
			{children}
		</Tile>
	);
}

export function GalleryTexture({
	container,
	rowItemsGap,
	rowItemsLength,
	resolution,
	texture,
	contribution,
}: GalleryTextureProps) {

	const src = useMemo(() => {
		if (!contribution || resolution === 'x16') return texture.filepath;
		return contribution.filepath;
	}, [texture, resolution, contribution]);

	const mcmeta = useMemo(() => {
		if (!contribution || resolution === 'x16') return texture.mcmeta;
		return contribution.mcmeta;
	}, [texture, resolution, contribution]);

	const size = useMemo(() => ((container.current?.clientWidth ?? 1) - (rowItemsGap * (rowItemsLength - 1))) / rowItemsLength,
		[container, rowItemsGap, rowItemsLength]
	);

	return (
		<TextureImage
			alt={texture.name}
			src={src}
			mcmeta={mcmeta}
			isTransparent={resolution !== 'x16' && !contribution}
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
				{resolution !== 'x16' && contribution && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoFileDiff />
						</SmallTile>
						<SmallTile>
							<Group gap={3.3}>
								<Avatar mt={1} src={contribution.owner.image} size="xs" mr={3} />
								<Text component="span" size="xs">{contribution.owner.name}</Text>
							</Group>
						</SmallTile>
					</Group>
				)}
				{resolution !== 'x16' && contribution && contribution.coAuthors.length > 0 && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoPeople />
						</SmallTile>
						<SmallTile>
							<Text size="xs">
								{contribution.coAuthors.map((ca) => ca.name).join(', ')}
							</Text>
						</SmallTile>
					</Group>
				)}
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
