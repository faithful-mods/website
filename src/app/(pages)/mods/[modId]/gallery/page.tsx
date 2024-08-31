'use client';

import { useParams } from 'next/navigation';

import { useEffect, useState, useTransition } from 'react';
import type { RefObject } from 'react';

import { Group, Select, Stack } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { Resolution } from '@prisma/client';

import { PaginatedList } from '~/components/base/paginated-list';
import { GalleryTextureWithContribution } from '~/components/textures/texture-gallery-contribution';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_TABLET } from '~/lib/constants';
import { getLatestContributionsOfModVersion } from '~/server/data/contributions';
import { getModVersionFromModForgeId } from '~/server/data/mods-version';
import { getTexturesFromModVersion } from '~/server/data/texture';

import type { ModVersion, Texture } from '@prisma/client';
import type { GetLatestContributionsOfModVersion } from '~/server/data/contributions';

export default function ModGalleryPage() {
	const [resolution, setResolution] = useState<Resolution | 'x16'>(Resolution['x32']);
	const [isLoading, startTransition] = useTransition();

	const modId = useParams().modId! as string;
	const [modVersions, setModVersions] = useState<ModVersion[]>([]);
	const [modVersionShown, setModVersionShown] = useState<string | null>(null);

	const [textures, setTextures] = useState<Texture[]>([]);
	const [contributions, setContributions] = useState<GetLatestContributionsOfModVersion[]>([]);

	const [texturesShownPerRow, setTexturesShownPerRow] = useState(12);
	const [texturesGroupRef, setTexturesGroupRef] = useState<RefObject<HTMLDivElement> | undefined>();

	const { width } = useViewportSize();

	useEffectOnce(() => {
		getModVersionFromModForgeId(modId).then((versions) => {
			setModVersions(versions);
			setModVersionShown(versions[0]?.id ?? null);
		});
	});

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
					<GalleryTextureWithContribution
						key={texture.id}
						container={texturesGroupRef}
						rowItemsGap={10}
						rowItemsLength={texturesShownPerRow}
						resolution={resolution}
						texture={texture}
						contribution={contributions.find((c) => c.textureId === texture.id)}
					/>
				)}
			/>
		</Stack>
	);
}
