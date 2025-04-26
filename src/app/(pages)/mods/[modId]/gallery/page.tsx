'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';

import { GoHash, GoLinkExternal, GoLog, GoPeople, GoPerson } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

import { Group, Select, Stack, Text } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';
import { DefaultPack, Resolution } from '@prisma/client';
import { Pack } from '@prisma/client';

import { PaginatedList } from '~/components/base/paginated-list';
import { GalleryTexture } from '~/components/textures/texture-gallery';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { INTERNAL_PACK_TO_VANILLA_PACK } from '~/lib/constants';
import { asReadablePackName, getVanillaTextureSrc } from '~/lib/utils';
import { getLatestContributionsOfModVersion } from '~/server/data/contributions';
import { getModVersionFromModForgeId } from '~/server/data/mods-version';
import { getTexturesFromModVersion } from '~/server/data/texture';

import type { ModVersion, Texture } from '@prisma/client';
import type { GetLatestContributionsOfModVersion } from '~/server/data/contributions';
import type { FPStoredContribution } from '~/types';

export default function ModGalleryPage() {
	const [pack, setPack] = useState<Pack | DefaultPack>(Pack.FAITHFUL);
	const [resolution, setResolution] = useState<Resolution | 'x16'>(Resolution['x32']);
	const prevResolution = usePrevious(resolution);

	const modId = useParams().modId! as string;
	const [modVersions, setModVersions] = useState<ModVersion[]>([]);
	const [modVersionShown, setModVersionShown] = useState<string | null>(null);

	const [textures, setTextures] = useState<Texture[]>([]);
	const [contributions, setContributions] = useState<GetLatestContributionsOfModVersion[]>([]);

	const [vanillaContribution, setVanillaContribution] = useState<FPStoredContribution | null>(null);
	const filteredVanillaCoAuthors = useMemo(() => vanillaContribution?.coAuthors.filter((ca) => ca.username !== vanillaContribution?.owner.username) ?? [], [vanillaContribution]);

	const [texturesShownPerRow, setTexturesShownPerRow] = useState(12);
	const [texturesGroupRef, setTexturesGroupRef] = useState<RefObject<HTMLDivElement> | undefined>();

	const [showFullHash, setShowFullHash] = useState(false);

	useEffectOnce(() => {
		getModVersionFromModForgeId(modId).then((versions) => {
			setModVersions(versions);
			setModVersionShown(versions[0]?.id ?? null);
		});
	});

	// set the pack when the resolution truly changes
	useEffect(() => {
		if (resolution === 'x16') return setPack(DefaultPack.DEFAULT_JAPPA);
		if (prevResolution === 'x16') return setPack(Pack.FAITHFUL);
	}, [resolution, prevResolution]);

	useEffect(() => {
		if (!modVersionShown || resolution === 'x16' || pack === DefaultPack.DEFAULT_JAPPA || pack === DefaultPack.DEFAULT_PROGART) return;
		getLatestContributionsOfModVersion(modVersionShown, resolution, pack).then(setContributions);
	}, [modVersionShown, pack, resolution]);

	useEffect(() => {
		if (!modVersionShown) return;
		getTexturesFromModVersion(modVersionShown).then(setTextures);
	}, [modVersionShown]);

	return (
		<Stack gap="sm" mb="sm" maw="1384">
			<PaginatedList
				items={textures}

				leftFilters={
					<Group
						gap="sm"
						wrap="nowrap"
					>
						<Select
							label="Resolution"
							data={Object.entries(Object.assign({ x16: 'x16' }, Resolution)).map(([k, v]) => ({ value: k, label: v }))}
							value={resolution}
							onChange={(e) => e ? setResolution(e as Resolution) : null}
							checkIconPosition="right"
							w={80}
						/>
						<Select
							label="Pack"
							data={
								resolution === 'x16'
									? [{ value: DefaultPack.DEFAULT_JAPPA, label: asReadablePackName(DefaultPack.DEFAULT_JAPPA) }]
									: (Object.values(Pack) as Pack[]).map((v) => ({ value: v, label: asReadablePackName(v) }))
							}
							value={pack}
							onChange={(e) => e ? setPack(e as Pack) : null}
							checkIconPosition='right'
							disabled={resolution === 'x16'}
							w={180}
						/>
						<Select
							label="Mod version"
							maw={'calc(100% - 120px - var(--mantine-spacing-sm))'}
							data={modVersions.map((v) => ({ value: v.id, label: v.version }))}
							value={modVersionShown}
							onChange={(e) => e ? setModVersionShown(e) : null}
							checkIconPosition="right"
							searchable
							w={120}
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

						data={{
							texture,
							contribution: contributions.find((c) => c.textureId === texture.id) ?? null,
							setShowFullHash,
							showFullHash,
						}}

						src={(data) => {
							if (resolution === 'x16') return texture.filepath;
							if (texture.vanillaTextureId) return getVanillaTextureSrc(texture.vanillaTextureId, resolution, pack as Pack);
							if (!data.contribution) return texture.filepath;

							return data.contribution.filepath;
						}}

						isTransparent={(data) => resolution !== 'x16' && !data.contribution && !data.texture.vanillaTextureId}
						tiles={(data) => [
							{
								shown: resolution !== 'x16' && (!!data.contribution || !!vanillaContribution),
								icon: <GoPeople />,
								description: (
									vanillaContribution
										? vanillaContribution?.owner.username
										: data.contribution?.owner.name
								) ?? 'Unknown',
							},
							{
								shown: resolution !== 'x16' && (!!data.contribution?.coAuthors.length || !!filteredVanillaCoAuthors.length),
								icon: <GoPeople />,
								description: data.contribution
									? data.contribution.coAuthors.map((ca) => ca.name).join(', ')
									: filteredVanillaCoAuthors.map((ca) => ca.username).join(', '),
							},
							{
								shown: resolution !== 'x16' && !data.contribution && !vanillaContribution,
								icon: <GoPerson />,
								description: <Text component="span" c="dimmed">No contribution</Text>,
							},
							{
								shown:  resolution !== 'x16' && !!texture.vanillaTextureId,
								icon: <GoLinkExternal />,
								description: (
									<Link
										href={`https://webapp.faithfulpack.net/gallery/java/${INTERNAL_PACK_TO_VANILLA_PACK[pack as Pack]?.[resolution as Resolution]}/java-snapshot/all?show=${texture.vanillaTextureId}`}
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
								description: showFullHash ? texture.hash : texture.hash.slice(0, 8) + '...' + texture.hash.slice(-8),
								descriptionHoverAction: (isHovering) => setShowFullHash(isHovering),
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
