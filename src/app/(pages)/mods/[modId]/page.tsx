'use client';

import { useParams } from 'next/navigation';

import { useEffect, useMemo, useRef, useState } from 'react';

import { HiDownload } from 'react-icons/hi';

import { Button, Group, Pagination, Progress, Select, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';
import { Resolution } from '@prisma/client';

import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, ITEMS_PER_PAGE, RESOLUTIONS_COLORS, EMPTY_PROGRESSION, ITEMS_PER_PAGE_DEFAULT } from '~/lib/constants';
import { getModsFromIds } from '~/server/data/mods';
import { getModVersionFromMod, getModVersionProgressionFromMod } from '~/server/data/mods-version';

import type { Mod, ModVersion } from '@prisma/client';
import type { Progression } from '~/types';

export default function ModPage() {
	const modId = useParams().modId as string;
	const [mod, setMod] = useState<Mod | null>(null);

	const [windowWidth] = useDeviceSize();

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const [activePage, setActivePage] = useState(1);
	const [versionShownPerPage, setVersionsShownPerPage] = useState<string>(ITEMS_PER_PAGE_DEFAULT);

	const [versions, setVersions] = useState<ModVersion[]>([]);
	const [versionsShown, setVersionsShown] = useState<ModVersion[][]>([[]]);
	const [progressions, setProgressions] = useState<Record<string, Progression> | null>(null);

	const resolutions = useMemo(() => Object.keys(Resolution) as Resolution[], []);
	const percentages = useMemo(() => {
		const p = versions?.map((modVer) => progressions?.[modVer.id]
			? ({ id: modVer.id, progression: progressions?.[modVer.id]! })
			: ({ id: modVer.id, progression: Object.assign({}, EMPTY_PROGRESSION) }))
			?? [];

		const output: Partial<Record<Resolution, Record<string, number>>> = {};

		for (const res of resolutions) {
			for (const { id, progression } of p) {
				if (output[res] === undefined) output[res] = {};
				if (output[res][id] === undefined) output[res][id] = 0;

				output[res][id] = progression.textures.todo === 0 ? 100 : (progression.textures.done[res] * 100) / progression.textures.todo;
			}
		}

		return output;
	}, [versions, progressions, resolutions]);

	const linkRef = useRef<HTMLAnchorElement>(null);

	const handlePackDownload = async (modVerId: string, resolution: Resolution) => {
		const response = await fetch(`/api/download/mods/${modVerId}/${resolution}`, { method: 'GET' });

		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = linkRef.current;

		if (!link) return;

		link.href = url;
		link.download = `Faithful Modded ${resolution} - ${mod?.name ?? modId} - ${versions?.find((v) => v.id === modVerId)!.version}.zip`;
		link.click();
		window.URL.revokeObjectURL(url);
	};

	const [search, setSearch] = useState('');
	const [filteredVersions, setFilteredVersions] = useState<ModVersion[]>([]);
	const prevSearchedMods = usePrevious(filteredVersions);

	useEffect(() => {
		const chunks: ModVersion[][] = [];
		const int = parseInt(versionShownPerPage ?? itemsPerPage[0]);

		for (let i = 0; i < filteredVersions.length; i += int) {
			chunks.push(filteredVersions.slice(i, i + int));
		}

		if (!prevSearchedMods || prevSearchedMods.length !== filteredVersions.length) {
			setActivePage(1);
		}

		setVersionsShown(chunks);
	}, [filteredVersions, itemsPerPage, prevSearchedMods, versionShownPerPage]);

	useEffect(() => {
		if (!search) {
			setFilteredVersions(versions);
			return;
		}

		setFilteredVersions(
			versions.filter((v) =>
				 v.version.toLowerCase().includes(search.toLowerCase())
			|| v.mcVersion.some((mcv) => mcv.toLowerCase().includes(search.toLowerCase()))
			)
		);

	}, [search, versions]);

	useEffectOnce(() => {
		getModsFromIds([modId]).then((mod) => setMod(mod[0] ?? null));
		getModVersionProgressionFromMod(modId).then(setProgressions);
		getModVersionFromMod(modId).then((versions) => {
			setVersions(versions);
			setFilteredVersions(versions);
		});
	});

	return (
		<>
			<a ref={linkRef} style={{ display: 'none' }} />
			{mod && versions && (
				<Stack gap="sm">
					<Group align="center" gap="sm" wrap="nowrap">
						<TextInput
							w="100%"
							maw={'calc(100% - 120px - var(--mantine-spacing-sm))'}
							label="Search"
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
							placeholder="Search for a mod/minecraft version..."
						/>
						<Select
							label="Results per page"
							data={itemsPerPage}
							value={versionShownPerPage}
							onChange={(e) => e ? setVersionsShownPerPage(e) : null}
							withCheckIcon={false}
							w={120}
						/>
					</Group>

					{filteredVersions.length === 0 && (
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

					{versionsShown[activePage - 1] && versionsShown[activePage - 1]?.map((ver) =>
						<Tile key={ver.id}>
							<Stack gap="md">
								<Group align="baseline" justify="space-between">
									<Group gap={5} align="baseline">
										<Text size="md" fw={700}>{ver.version}</Text>
										<Text size="xs" c="dimmed">for Minecraft {ver.mcVersion.join(', ')}</Text>
									</Group>
									<Group gap="xs" wrap="nowrap" align="center">
										<Text size="sm" c="dimmed">
											{ver.downloads ? Object.values(ver.downloads).reduce<number>((acc, curr) => acc + (curr ?? 0), 0) : 0}
										</Text>
										<HiDownload color="var(--mantine-color-dimmed)" />
									</Group>
								</Group>

								<Group
									gap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'md' : 'sm'}
									wrap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
									style={{ flexDirection: windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'column-reverse' : 'row' }}
								>
									<Group w="100%" wrap="nowrap" gap="sm">
										{resolutions.map((res) => (
											<Tooltip
												position="bottom"
												label={progressions?.[ver.id]?.textures.done[res] === 0
													? 'No textures to download yet...'
													: !ver.downloads[res]
														? 'Nobody has downloaded this resolution yet'
														: `${ver.downloads[res]} download${ver.downloads[res] && ver.downloads[res] > 1 ? 's' : ''}`
												}
												key={res}
											>
												<Button
													leftSection={<HiDownload size={14} />}
													variant="light"
													color={RESOLUTIONS_COLORS[res]}
													w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'auto'}
													className={progressions?.[ver.id]?.textures.done[res] === 0 ? 'button-disabled-with-bg' : ''}
													disabled={progressions?.[ver.id]?.textures.done[res] === 0}
													onClick={() => handlePackDownload(ver.id, res)}
												>
													{res}
												</Button>
											</Tooltip>
										))}
									</Group>

									<Stack gap="sm" w="100%">
										{resolutions.map((res) => (
											<Tooltip key={res} label={`${progressions?.[ver.id]?.textures.done[res]}/${progressions?.[ver.id]?.textures.todo === 0 ? '?' : progressions?.[ver.id]?.textures.todo} (${(percentages[res]?.[ver.id] ?? 0).toFixed(2)}%)`}>
												<Group wrap="nowrap" gap="sm">
													<Text size="xs" w="30px" ta="right">{res}</Text>
													<Progress.Root size="md" w="100%">
														<Progress.Section value={percentages[res]?.[ver.id] ?? 0} color={RESOLUTIONS_COLORS[res]} />
													</Progress.Root>
												</Group>
											</Tooltip>
										))}
									</Stack>
								</Group>

							</Stack>
						</Tile>
					)}

					<Group mt="md" justify="center">
						<Pagination total={versionsShown.length} value={activePage} onChange={setActivePage} />
					</Group>
				</Stack>
			)}
		</>
	);
}
