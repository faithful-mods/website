import { useMemo, useState } from 'react';
import type { RefObject } from 'react';

import { GoHash, GoPeople, GoPerson } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Avatar, Group, Stack, Text } from '@mantine/core';

import { SmallTile } from '~/components/small-tile';
import { TextureImage } from '~/components/texture-img';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { getVanillaTextureSrc } from '~/lib/utils';
import { getVanillaTextureContribution } from '~/server/data/texture';

import type { Resolution, Texture } from '@prisma/client';
import type { VanillaTextureContribution } from '~/server/data/texture';
import type { ContributionWithCoAuthors } from '~/types';

export interface GalleryTextureWithContributionProps {
	container: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	resolution: Resolution | 'x16';
	contribution?: ContributionWithCoAuthors;
}

export function GalleryTextureWithContribution({
	container,
	rowItemsGap,
	rowItemsLength,
	resolution,
	texture,
	contribution,
}: GalleryTextureWithContributionProps) {

	const src = useMemo(() => {
		if (resolution === 'x16') return texture.filepath;

		if (texture.vanillaTexture)
			return getVanillaTextureSrc(texture.vanillaTexture, resolution);

		if (!contribution) return texture.filepath;

		return contribution.filepath;
	}, [texture, resolution, contribution]);

	const mcmeta = useMemo(() => {
		if (!contribution || resolution === 'x16') return texture.mcmeta;
		return contribution.mcmeta;
	}, [texture, resolution, contribution]);

	const size = useMemo(() => ((container.current?.clientWidth ?? 1) - (rowItemsGap * (rowItemsLength - 1))) / rowItemsLength,
		[container, rowItemsGap, rowItemsLength]
	);

	const [vanillaContribution, setVanillaContribution] = useState<VanillaTextureContribution | null>(null);

	useEffectOnce(() => {
		if (!texture.vanillaTexture || resolution === 'x16') return;

		getVanillaTextureContribution(texture.vanillaTexture, resolution)
			.then(setVanillaContribution);
	});

	return (
		<TextureImage
			alt={texture.name}
			src={src}
			mcmeta={mcmeta}
			isTransparent={resolution !== 'x16' && !contribution && !texture.vanillaTexture}
			size={size}
			popupStyles={{
				backgroundColor: 'transparent',
				padding: 0,
				border: 'none',
				boxShadow: 'none',
			}}
		>
			<Stack gap={2} align="start" miw={400} maw={400}>
				<SmallTile color="gray">
					<Text fw={500} ta="center">{texture.name}</Text>
				</SmallTile>
				{resolution !== 'x16' && (contribution || vanillaContribution) && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<Avatar
								className="navbar-icon-fix"
								src={contribution ? contribution.owner.image : vanillaContribution?.owner.image}
								size="xs"
								radius={5}
							/>
						</SmallTile>
						<SmallTile color="gray">
							<Group gap={3.3}>
								<Text component="span" size="xs">{contribution ? contribution.owner.name : vanillaContribution?.owner.name}</Text>
							</Group>
						</SmallTile>
					</Group>
				)}
				{resolution !== 'x16' && (contribution && contribution.coAuthors.length > 0) || (vanillaContribution && vanillaContribution.coAuthors.length > 0) && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoPeople />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs">
								{contribution ? contribution.coAuthors.map((ca) => ca.name).join(', ') : vanillaContribution?.coAuthors.map((ca) => ca.name).join(', ')}
							</Text>
						</SmallTile>
					</Group>
				)}
				{resolution !== 'x16' && !contribution && !vanillaContribution && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoPerson />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs" c="dimmed">
								No contribution
							</Text>
						</SmallTile>
					</Group>
				)}
				<Group gap={2} w="100%" wrap="nowrap" align="start">
					<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
						<GoHash />
					</SmallTile>
					<SmallTile color="gray">
						<Text size="xs" c="dimmed">
							ID: {texture.id}
						</Text>
					</SmallTile>
				</Group>
				{texture.aliases.length > 0 && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<PiApproximateEquals />
						</SmallTile>
						<SmallTile color="gray">
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
