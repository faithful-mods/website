'use client';

import { useParams } from 'next/navigation';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { CloseButton, Group, Loader, Pagination, Select, Stack, Text, TextInput } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';
import { useViewportSize } from '@mantine/hooks';
import { Resolution } from '@prisma/client';

import { GalleryTextureWithContribution } from '~/components/textures/texture-gallery-contribution';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, ITEMS_PER_PAGE, ITEMS_PER_ROW } from '~/lib/constants';
import { searchFilter } from '~/lib/utils';
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
	const [texturesFiltered, setTexturesFiltered] = useState<Texture[]>([]);
	const [texturesShown, setTexturesShown] = useState<Texture[][]>([[]]);

	const [contributions, setContributions] = useState<GetLatestContributionsOfModVersion[]>([]);

	const [texturesShownPerPage, setTexturesShownPerPage] = useState<string>('96');
	const [texturesShownPerRow, setTexturesShownPerRow] = useState<number>(12);

	const itemsPerRow = useMemo(() => ITEMS_PER_ROW, []);
	const itemsPerPage = useMemo(() => [...ITEMS_PER_PAGE, '192', '384', 'All'], []);

	const [activePage, setActivePage] = useState(1);
	const [search, setSearch] = useState('');
	const prevSearchedTextures = usePrevious(texturesFiltered);

	const { width } = useViewportSize();
	const texturesGroupRef = useRef<HTMLDivElement>(null);

	useEffectOnce(() => {
		getModVersionFromModForgeId(modId).then((versions) => {
			setModVersions(versions);
			setModVersionShown(versions[0]?.id ?? null);
		});
	});

	useEffect(() => {
		startTransition(() => {
			const chunks: Texture[][] = [];
			const int = texturesShownPerPage === 'All' ? texturesFiltered.length : parseInt(texturesShownPerPage ?? itemsPerPage[0]);

			for (let i = 0; i < texturesFiltered.length; i += int) {
				chunks.push(texturesFiltered.slice(i, i + int));
			}

			if (!prevSearchedTextures || prevSearchedTextures.length !== texturesFiltered.length) {
				setActivePage(1);
			}

			setTexturesShown(chunks);
		});
	}, [texturesFiltered, itemsPerPage, prevSearchedTextures, texturesShownPerPage]);

	useEffect(() => {
		startTransition(() => {
			if (!search) {
				setTexturesFiltered(textures);
				return;
			}

			setTexturesFiltered(textures.filter(searchFilter(search)));
		});
	}, [textures, search]);

	useEffect(() => {
		if (!modVersionShown) return; // should not happens but just for TS

		startTransition(() => {
			getTexturesFromModVersion(modVersionShown)
				.then(setTextures);

			if (resolution !== 'x16')
				getLatestContributionsOfModVersion(modVersionShown, resolution)
					.then(setContributions);
		});
	}, [modVersionShown, resolution]);

	return (
		<Stack gap="sm" mb="sm" ref={texturesGroupRef} maw="1384">
			<Group gap="sm" wrap={width <= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
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

				<Group
					w={width <= BREAKPOINT_TABLET ? '100%' : 'calc((100% - var(--mantine-spacing-sm)) * .7)'}
					gap="sm"
					wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
				>
					<TextInput
						w={width <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc(100% - (2 * var(--mantine-spacing-sm)) - 240px)'}
						label="Search"
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						placeholder="Search for a texture name..."
						rightSection={search && (
							<CloseButton
								style={{ '--cb-size': 'var(--cb-size-sm)' }}
								onClick={() => setSearch('')}
							/>
						)}
					/>
					<Select
						label="Textures per page"
						data={itemsPerPage}
						value={texturesShownPerPage}
						onChange={(e) => e ? setTexturesShownPerPage(e) : null}
						checkIconPosition="right"
						w={width <= BREAKPOINT_MOBILE_LARGE ? 'calc(50% - (var(--mantine-spacing-sm) / 2))' : 120}
					/>
					<Select
						label="Textures per row"
						data={itemsPerRow}
						value={texturesShownPerRow.toString()}
						onChange={(e) => e ? setTexturesShownPerRow(parseInt(e)) : null}
						checkIconPosition="right"
						w={width <= BREAKPOINT_MOBILE_LARGE ? 'calc(50% - (var(--mantine-spacing-sm) / 2))' : 120}
					/>
				</Group>
			</Group>

			{isLoading && (
				<Group
					align="center"
					justify="center"
					h="100px"
					gap="md"
					style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
				>
					<Loader color="blue" mt={5} />
				</Group>
			)}

			{!isLoading && texturesFiltered.length === 0 && (
				<Group
					align="center"
					justify="center"
					h="100px"
					gap="md"
					style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
				>
					<Text c="dimmed">No results for &quot;{search}&quot;</Text>
				</Group>
			)}

			{!isLoading && texturesShown[activePage - 1]?.length && (
				<>
					<Group gap={10} h="100%">
						{texturesShown[activePage - 1]?.map((texture) => (
							<GalleryTextureWithContribution
								key={texture.id}
								container={texturesGroupRef}
								rowItemsGap={10}
								rowItemsLength={texturesShownPerRow}
								resolution={resolution}
								texture={texture}
								contribution={contributions.find((c) => c.textureId === texture.id)}
							/>
						))}
					</Group>

					<Group w="100%" justify="center">
						<Pagination total={texturesShown.length} value={activePage} onChange={setActivePage} />
					</Group>
				</>
			)}
		</Stack>
	);
}
