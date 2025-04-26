'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { RefObject } from 'react';

import { GoHash, GoLinkExternal, GoLog, GoPeople, GoPerson } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Avatar, Group, Select, Stack, Text } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { Resolution } from '@prisma/client';

import { PaginatedList } from '~/components/base/paginated-list';
import { GalleryTexture } from '~/components/textures/texture-gallery';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_TABLET } from '~/lib/constants';
import { getVanillaResolution } from '~/lib/utils';
import { getLatestVanillaTextureContribution } from '~/server/actions/faithful-pack';
import { getLatestContributionsOfModVersion } from '~/server/data/contributions';
import { getModVersionFromModForgeId } from '~/server/data/mods-version';
import { getTexturesFromModVersion } from '~/server/data/texture';

import type { ModVersion, Texture } from '@prisma/client';
import type { GetLatestContributionsOfModVersion } from '~/server/data/contributions';
import type { FPStoredContribution } from '~/types';

export default function ModGalleryPage() {
	const [resolution, setResolution] = useState<Resolution | 'x16'>(Resolution['x32']);
	const [isLoading, startTransition] = useTransition();

	const modId = useParams().modId! as string;
	const [modVersions, setModVersions] = useState<ModVersion[]>([]);
	const [modVersionShown, setModVersionShown] = useState<string | null>(null);

	const [textures, setTextures] = useState<Texture[]>([]);
	const [contributions, setContributions] = useState<GetLatestContributionsOfModVersion[]>([]);

	const [contributionShown, setContributionShown] = useState<GetLatestContributionsOfModVersion | null>(null);
	const [textureHovered, setTextureHovered] = useState<Texture | null>(null);
	const [vanillaContribution, setVanillaContribution] = useState<FPStoredContribution | null>(null);
	const filteredVanillaCoAuthors = useMemo(() => vanillaContribution?.coAuthors.filter((ca) => ca.username !== vanillaContribution?.owner.username) ?? [], [vanillaContribution]);

	const [texturesShownPerRow, setTexturesShownPerRow] = useState(12);
	const [texturesGroupRef, setTexturesGroupRef] = useState<RefObject<HTMLDivElement> | undefined>();

	const { width } = useViewportSize();

	const [showFullHash, setShowFullHash] = useState(false);
	const [fullHash, setFullHash] = useState<string>('');
	const [hash, setHash] = useState<string | null>(null);

	useEffectOnce(() => {
		getModVersionFromModForgeId(modId).then((versions) => {
			setModVersions(versions);
			setModVersionShown(versions[0]?.id ?? null);
		});
	});

	useEffect(() => {
		if (showFullHash) setHash(fullHash);
		else setHash(fullHash.slice(0, 8) + '...' + fullHash.slice(-8));
	}, [fullHash, showFullHash]);

	useEffect(() => {
		if (!textureHovered) return;
		if (!textureHovered.vanillaTextureId || resolution === 'x16') return;

		getLatestVanillaTextureContribution(textureHovered.vanillaTextureId, resolution)
			.then((contribution) => {
				if (!contribution) return;
				setVanillaContribution(contribution);
			});
	}, [textureHovered, resolution]);

	useEffect(() => {
		if (!modVersionShown) return; // should not happens but just for TS
		if (resolution === 'x16') return; // avoid reload textures if resolution is x16 (as we already have them)

		startTransition(() => {
			getTexturesFromModVersion(modVersionShown)
				.then(setTextures);

			getLatestContributionsOfModVersion(modVersionShown, resolution)
				.then(setContributions);
		});
	}, [modVersionShown, resolution]);

	return (
		<Stack gap="sm" mb="sm" maw="1384">
			<PaginatedList
				items={textures}

				leftFilters={
					<Group
						w={width <= BREAKPOINT_TABLET ? '100%' : 'calc((100% - var(--mantine-spacing-sm)) * .3)'}
						gap="sm"
						wrap="nowrap"
					>
						<Select
							label="Resolution"
							data={Object.entries(Object.assign({ x16: 'x16' }, Resolution)).map(([k, v]) => ({ value: k, label: v }))}
							value={resolution}
							onChange={(e) => e ? setResolution(e as Resolution) : null}
							checkIconPosition="right"
							w={120}
						/>
						<Select
							label="Mod version"
							w="100%"
							maw={'calc(100% - 120px - var(--mantine-spacing-sm))'}
							data={modVersions.map((v) => ({ value: v.id, label: v.version }))}
							value={modVersionShown}
							onChange={(e) => e ? setModVersionShown(e) : null}
							checkIconPosition="right"
							searchable
						/>
					</Group>
				}

				onUpdate={({ itemsPerRow, containerRef }) => {
					setTexturesShownPerRow(itemsPerRow);
					setTexturesGroupRef(containerRef ?? undefined);
				}}

				renderItem={(texture) => (
					<GalleryTexture
						key={texture.id}
						container={texturesGroupRef}
						rowItemsGap={10}
						rowItemsLength={texturesShownPerRow}
						texture={texture}

						onMouseEnter={() => {
							setTextureHovered(texture);
							setContributionShown(contributions.find((c) => c.textureId === texture.id) ?? null);
							setFullHash(texture.hash);
							setShowFullHash(false);
						}}

						isTransparent={resolution !== 'x16' && !contributionShown && !texture.vanillaTextureId}
						tiles={[
							{
								shown: resolution !== 'x16' && (!!contributionShown || !!vanillaContribution),
								icon: <Avatar
									className="navbar-icon-fix"
									src={contributionShown ? contributionShown.owner.image : vanillaContribution?.owner.image}
									size="xs"
									radius={5}
								/>,
								description: (
									vanillaContribution
										? vanillaContribution?.owner.username
										: contributionShown?.owner.name
								) ?? 'Unknown',
							},
							{
								shown: resolution !== 'x16' && (!!contributionShown?.coAuthors.length || !!filteredVanillaCoAuthors.length),
								icon: <GoPeople />,
								description: contributionShown
									? contributionShown.coAuthors.map((ca) => ca.name).join(', ')
									: filteredVanillaCoAuthors.map((ca) => ca.username).join(', '),
							},
							{
								shown: resolution !== 'x16' && !contributionShown && !vanillaContribution,
								icon: <GoPerson />,
								description: <Text component="span" c="dimmed">No contribution</Text>,
							},
							{
								shown:  resolution !== 'x16' && !!texture.vanillaTextureId,
								icon: <GoLinkExternal />,
								description: (
									<Link
										href={`https://webapp.faithfulpack.net/gallery/java/${getVanillaResolution(resolution as Resolution)}/java-snapshot/all?show=${texture.vanillaTextureId}`}
										target="_blank"
									>
										See in the Faithful Webapp
									</Link>
								),
							},
							{
								shown: !texture.vanillaTextureId,
								icon: <GoHash />,
								description: `ID: ${texture.id}`,
							},
							{
								shown: !!texture.vanillaTextureId,
								icon: <GoHash />,
								description: `Vanilla ID: ${texture.vanillaTextureId}`,
							},
							{
								shown: resolution === 'x16' && !texture.vanillaTextureId,
								icon: <GoLog />,
								description: `${hash}`,
								descriptionHoverAction: () => setShowFullHash(!showFullHash),
							},
							{
								shown: texture.aliases.length > 0,
								icon: <PiApproximateEquals />,
								description: (
									<Text component="span" c="dimmed">
										{texture.aliases.join(', ')}
									</Text>
								),
							},
						]}
					/>
				)}
			/>
		</Stack>
	);
}
