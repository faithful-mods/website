import Link from 'next/link';

import { useMemo, useState } from 'react';
import type { RefObject } from 'react';

import { GoHash, GoLinkExternal, GoLog, GoPeople, GoPerson } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Avatar, Group, Stack, Text } from '@mantine/core';

import { SmallTile } from '~/components/small-tile';
import { TextureImage } from '~/components/texture-img';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { getVanillaResolution, getVanillaTextureSrc } from '~/lib/utils';
import { getLatestVanillaTextureContribution } from '~/server/actions/faithful-pack';

import type { Contribution, Resolution, Texture } from '@prisma/client';
import type { FPStoredContribution, Prettify, PublicUser } from '~/types';

interface Props {
	container: RefObject<HTMLDivElement>;
	rowItemsGap: number;
	rowItemsLength: number;
	texture: Texture;
	resolution: Resolution | 'x16';
	contribution?: Prettify<Contribution & { owner: PublicUser, coAuthors: PublicUser[] }>;
}

export function GalleryTextureWithContribution({
	container,
	rowItemsGap,
	rowItemsLength,
	resolution,
	texture,
	contribution,
}: Props) {

	const src = useMemo(() => {
		if (resolution === 'x16') return texture.filepath;

		if (texture.vanillaTextureId)
			return getVanillaTextureSrc(texture.vanillaTextureId, resolution);

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

	const [vanillaContribution, setVanillaContribution] = useState<FPStoredContribution | null>(null);

	const filteredVanillaCoAuthors = useMemo(() => vanillaContribution?.coAuthors.filter((ca) => ca.username !== vanillaContribution?.owner.username) ?? [], [vanillaContribution]);

	useEffectOnce(() => {
		if (!texture.vanillaTextureId || resolution === 'x16') return;

		getLatestVanillaTextureContribution(texture.vanillaTextureId, resolution)
			.then(setVanillaContribution);
	});

	return (
		<TextureImage
			alt={texture.name}
			src={src}
			mcmeta={mcmeta}
			isTransparent={resolution !== 'x16' && !contribution && !texture.vanillaTextureId}
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
								<Text component="span" size="xs">{contribution ? contribution.owner.name : vanillaContribution?.owner.username}</Text>
							</Group>
						</SmallTile>
					</Group>
				)}
				{resolution !== 'x16' && (contribution && contribution.coAuthors.length > 0) || (filteredVanillaCoAuthors.length > 0) && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoPeople />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs">
								{contribution ? contribution.coAuthors.map((ca) => ca.name).join(', ') : filteredVanillaCoAuthors.map((ca) => ca.username).join(', ')}
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
				{resolution !== 'x16' && texture.vanillaTextureId && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }} >
							<GoLinkExternal />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs">
								<Link
									href={`https://webapp.faithfulpack.net/gallery/java/${getVanillaResolution(resolution)}/java-snapshot/all?show=${texture.vanillaTextureId}`}
									target="_blank"
								>
									See in the Faithful Webapp
								</Link>
							</Text>
						</SmallTile>
					</Group>
				)}
				{!texture.vanillaTextureId && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoHash />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs" c="dimmed">
								Texture ID: {texture.id}
							</Text>
						</SmallTile>
					</Group>
				)}
				{(resolution === 'x16' && !texture.vanillaTextureId || !contribution && !vanillaContribution) && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoLog />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs" c="dimmed">
								{texture.hash}
							</Text>
						</SmallTile>
					</Group>
				)}
				{texture.vanillaTextureId && (
					<Group gap={2} w="100%" wrap="nowrap" align="start">
						<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
							<GoHash />
						</SmallTile>
						<SmallTile color="gray">
							<Text size="xs" c="dimmed">
								Vanilla Texture ID: {texture.vanillaTextureId}
							</Text>
						</SmallTile>
					</Group>
				)}
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
