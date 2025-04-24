import { useEffect, useMemo, useState } from 'react';
import type { FC, RefObject } from 'react';

import { GoAlert, GoHash, GoLog } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

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

	const size = useMemo(() => ((container?.current?.clientWidth ?? 1) - (rowItemsGap * (rowItemsLength - 1))) / rowItemsLength,
		[container, rowItemsGap, rowItemsLength]
	);

	const colorScheme = useComputedColorScheme();
	const tileColor = colorScheme === 'dark' ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)';

	const [showFullHash, setShowFullHash] = useState(false);
	const [hash, setHash] = useState<string | null>(null);

	useEffect(() => {
		if (showFullHash) setHash(texture.hash);
		else setHash(texture.hash.slice(0, 8) + '...' + texture.hash.slice(-8));
	}, [texture, showFullHash]);

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
			<Stack gap={2} align="start" maw={450}>
				<SmallTile color={tileColor}>
					<Text fw={500} ta="center">{texture.name}</Text>
				</SmallTile>
				{texture.vanillaTextureId && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color={tileColor} className="navbar-icon-fix" style={{ '--size': '28px' }} >
							<GoAlert color="orange" />
						</SmallTile>
						<SmallTile color={tileColor}>
							<Text size="xs">
								Vanilla texture : {texture.vanillaTextureId}
							</Text>
						</SmallTile>
					</Group>
				)}
				<Group gap={2} w="100%" wrap="nowrap" align="start">
					<SmallTile color={tileColor} className="navbar-icon-fix" style={{ '--size': '28px' }}>
						<GoHash />
					</SmallTile>
					<SmallTile color={tileColor}>
						<Text size="xs">
							ID: {texture.id}
						</Text>
					</SmallTile>
				</Group>
				<Group gap={2} w="100%" wrap="nowrap" align="start">
					<SmallTile color={tileColor} className="navbar-icon-fix" style={{ '--size': '28px' }}>
						<GoLog />
					</SmallTile>
					<SmallTile color={tileColor}>
						<Text
							size="xs"
							onMouseEnter={() => setShowFullHash(true)}
							onMouseLeave={() => setShowFullHash(false)}
							className="cursor-pointer"
						>
							{hash}
						</Text>
					</SmallTile>
				</Group>
				{texture.aliases.length > 0 && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color={tileColor} className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<PiApproximateEquals />
						</SmallTile>
						<SmallTile color={tileColor}>
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
