import { useMemo } from 'react';
import type { FC, RefObject } from 'react';

import { GoAlert, GoHash, GoLog } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Group, Stack, Text } from '@mantine/core';

import { SmallTile } from '~/components/base/small-tile';
import { TextureImage } from '~/components/textures/texture-img';

import type { Texture } from '@prisma/client';

interface Props {
	container: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	className?: string;
	onClick?: () => void;
}

export const GalleryTexture: FC<Props> = ({
	container,
	className,
	rowItemsGap,
	rowItemsLength,
	texture,
	onClick,
}) => {

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
			isTiled={texture.name.includes('flow')}
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
};
