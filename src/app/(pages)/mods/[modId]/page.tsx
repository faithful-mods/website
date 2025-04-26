'use client';

import { useParams } from 'next/navigation';

import { useEffect, useMemo, useRef, useState } from 'react';

import { HiDownload } from 'react-icons/hi';

import { Button, Group, Pagination, Progress, Select, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { usePrevious, useViewportSize } from '@mantine/hooks';
import { Pack, Resolution } from '@prisma/client';

import { Tile } from '~/components/base/tile';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, ITEMS_PER_PAGE, ITEMS_PER_PAGE_DEFAULT, RESOLUTIONS_COLORS } from '~/lib/constants';
import { asReadablePackName } from '~/lib/utils';
import { getModFromForgeId } from '~/server/data/mods';
import { getModVersionFromModForgeId, getModVersionProgressionFromModForgeId } from '~/server/data/mods-version';

import type { Mod, ModVersion } from '@prisma/client';
import type { Progression } from '~/types';

export default function ModPage() {
	const modId = useParams().modId as string;
	const [mod, setMod] = useState<Mod | null>(null);

	const { width } = useViewportSize();

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const [activePage, setActivePage] = useState(1);
	const [versionShownPerPage, setVersionsShownPerPage] = useState<string>(ITEMS_PER_PAGE_DEFAULT);

	const [versions, setVersions] = useState<ModVersion[]>([]);
	const [versionsShown, setVersionsShown] = useState<ModVersion[][]>([[]]);
	const [progressions, setProgressions] = useState<Record<string, Progression> | null>(null);

	const resolutions = useMemo(() => Object.keys(Resolution) as Resolution[], []);
	const packs = useMemo(() => Object.keys(Pack) as Pack[], []);

	const linkRef = useRef<HTMLAnchorElement>(null);

	// TODO: add packs to the download
	const handlePackDownload = async (modVerId: string, resolution: Resolution, pack: Pack) => {
		const response = await fetch(`/api/download/mods/${modVerId}/${pack}/${resolution}`, { method: 'GET' });

		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = linkRef.current;

		if (!link) return;

		link.href = url;
		link.download = `${asReadablePackName(pack)} Modded ${resolution} - ${mod?.name ?? modId} - ${versions?.find((v) => v.id === modVerId)!.version}.zip`;
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
		getModFromForgeId(modId).then(setMod);
		getModVersionProgressionFromModForgeId(modId).then(setProgressions);
		getModVersionFromModForgeId(modId).then((versions) => {
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
											{ver.downloads
												? Object.values(ver.downloads).reduce<number>((acc, curr) => {
													return acc + Object.values(curr).reduce<number>((a, c) => a + c, 0);
												}, 0)
												: 0
											}
										</Text>
										<HiDownload color="var(--mantine-color-dimmed)" />
									</Group>
								</Group>

								{progressions?.[ver.id]?.all === 0 && (
									<Text size="xs" c="dimmed">No textures available for this mod version</Text>
								)}
								{progressions?.[ver.id]?.all !== 0 && (
									<Group justify="space-between" wrap="nowrap" style={{ flexDirection: width >= BREAKPOINT_MOBILE_LARGE ? 'row' : 'column' }}>
										{packs.map((pack) => (
											<Stack key={pack} gap="sm" w="100%">
												<Text size="md" fw={400} w="100%">
													{asReadablePackName(pack)}
												</Text>

												<Stack w="100%" gap={3}>
													{resolutions.map((res) => (
														<Group key={res} wrap="nowrap" gap="sm">
															<Tooltip
																label={`${((progressions?.[ver.id]?.[pack]?.[res] ?? 0) / (progressions?.[ver.id]?.all || 1) * 100).toFixed(0)} % (${progressions?.[ver.id]?.[pack]?.[res] ?? 0}/${progressions?.[ver.id]?.all ?? 1})`}
															>
																<Group wrap="nowrap" gap="sm" w={width > BREAKPOINT_MOBILE_LARGE ? '300px' : '100%'}>
																	<Text size="xs" w="30px" ta="right">{res}</Text>
																	<Progress.Root size="md" w="100%">
																		<Progress.Section
																			value={(progressions?.[ver.id]?.[pack]?.[res] ?? 0) / (progressions?.[ver.id]?.all ?? 1) * 100}
																			color={RESOLUTIONS_COLORS[res]}
																		/>
																	</Progress.Root>
																</Group>
															</Tooltip>

															{width > BREAKPOINT_MOBILE_LARGE && (
																<Button
																	size="compact-xs"
																	leftSection={<HiDownload size={14} />}
																	variant="light"
																	color={RESOLUTIONS_COLORS[res]}
																	className={progressions?.[ver.id]?.[pack]?.[res] === 0 ? 'button-disabled-with-bg' : ''}
																	disabled={progressions?.[ver.id]?.[pack]?.[res] === 0}
																	onClick={() => handlePackDownload(ver.id, res, pack)}
																>
																	Download
																</Button>
															)}
														</Group>
													))}
												</Stack>

												{width <= BREAKPOINT_MOBILE_LARGE &&
													<Group w="100%" wrap="nowrap" gap="sm">
														{resolutions.map((res) => (
															<Button
																key={res}
																size="xs"
																fullWidth
																leftSection={<HiDownload size={14} />}
																variant="light"
																color={RESOLUTIONS_COLORS[res]}
																className={progressions?.[ver.id]?.[pack]?.[res] === 0 ? 'button-disabled-with-bg' : ''}
																disabled={progressions?.[ver.id]?.[pack]?.[res] === 0}
																onClick={() => handlePackDownload(ver.id, res, pack)}
															>
																Download {res}
															</Button>
														))}
													</Group>
												}
											</Stack>
										))}
									</Group>
								)}

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
