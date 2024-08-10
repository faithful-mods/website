'use client';

import { useParams } from 'next/navigation';

import { useEffect, useMemo, useRef, useState } from 'react';

import { GrGallery } from 'react-icons/gr';
import { HiDownload } from 'react-icons/hi';
import { HiArrowRight } from 'react-icons/hi2';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { TfiWorld } from 'react-icons/tfi';

import { Button, Group, Pagination, Progress, Select, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';
import { Resolution } from '@prisma/client';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, ITEMS_PER_PAGE, RESOLUTIONS_COLORS, EMPTY_PROGRESSION, ITEMS_PER_PAGE_DEFAULT } from '~/lib/constants';
import { getModDownloads, getModsFromIds } from '~/server/data/mods';
import { getModVersionFromMod, getModVersionProgressionFromMod } from '~/server/data/mods-version';

import type { Mod, ModVersion } from '@prisma/client';
import type { Downloads, Progression } from '~/types';

export default function ModPage() {
	const modId = useParams().modId as string;

	const [windowWidth] = useDeviceSize();

	const [mod, setMod] = useState<Mod | null>(null);
	const [isLoading, setLoading] = useState(true);

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const [activePage, setActivePage] = useState(1);
	const [versionShownPerPage, setVersionsShownPerPage] = useState<string>(ITEMS_PER_PAGE_DEFAULT);

	const [versions, setVersions] = useState<ModVersion[]>([]);
	const [versionsShown, setVersionsShown] = useState<ModVersion[][]>([[]]);
	const [progressions, setProgressions] = useState<Record<string, Progression> | null>(null);

	const slice = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 2 : 5;
	const [downloads, setDownloads] = useState<Downloads | null>(null);

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
		console.log(response);
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
			versions?.filter((v) =>
				v.version.toLowerCase().includes(search.toLowerCase())
				|| v.mcVersion.some((mcv) => mcv.toLowerCase().includes(search.toLowerCase()))
			)
			?? []
		);

	}, [search, versions]);

	useEffectOnce(() => {
		if (!modId) return;

		getModsFromIds([modId])
			.then((mod) => setMod(mod[0] ?? null))
			.then(() => {
				getModVersionFromMod(modId).then((versions) => {
					setVersions(versions);
					setFilteredVersions(versions);
				});
				getModDownloads(modId).then(setDownloads);
				getModVersionProgressionFromMod(modId).then(setProgressions);
			})
			.finally(() => setLoading(false));
	});

	return (
		<Stack gap="sm" mb="sm">
			<a ref={linkRef} style={{ display: 'none' }} />

			{!mod && isLoading && (
				<Tile>
					<Group align="center" justify="center" style={{ height: '120px' }}>
						<Text size="xl">Loading...</Text>
					</Group>
				</Tile>
			)}
			{!mod && !isLoading && (
				<Tile>
					<Stack align="center" justify="center" style={{ height: '120px' }}>
						<Text size="xl">
							Mod not found
						</Text>
						<Button
							component="a"
							href="/mods"
							variant="link"
						>
							Back to mods
						</Button>
					</Stack>
				</Tile>
			)}
			{mod && (
				<>
					<Tile>
						<Stack gap="xs">
							<Group wrap="nowrap">
								<TextureImage
									src={mod.image ?? './icon.png'}
									alt={mod.name}
									size={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
								/>
								<Group
									justify="space-between"
									align="start"
									w="100%"
									h={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
								>
									<Stack gap={0}>
										<Group gap={5} align="baseline">
											<Text fw={700} size="md">{mod.name}</Text>
											{mod.authors.length > 0 && (
												<Text size="xs" c="dimmed">
													by {mod.authors.slice(0, slice).join(', ')}
													{mod.authors.length > (slice - 1) && ` and ${mod.authors.length - (slice - 1)} more...`}
												</Text>
											)}
										</Group>
										{mod.description && (<Text size="sm" lineClamp={2}>{mod.description}</Text>)}
										{!mod.description && (<Text size="sm" c="dimmed">No description</Text>)}
									</Stack>

									{windowWidth > BREAKPOINT_TABLET && (
										<Stack gap={0} align="end" justify="center" style={{ height: '100%' }}>
											{mod.url && (
												<Button
													component="a"
													href={mod.url}
													variant="transparent"
													rightSection={<TfiWorld />}
													p={0}
												>
													Website
												</Button>
											)}
											<Group gap="xs" wrap="nowrap" align="center" style={{ height: '36px' }}>
												<Text size="sm" c="dimmed">
													{mod.loaders.join(', ')}
												</Text>
												<IoExtensionPuzzleOutline color="var(--mantine-color-dimmed)" />
											</Group>
											<Group gap="xs" wrap="nowrap" align="center" style={{ height: '36px' }}>
												<Text size="sm" c="dimmed">
													{downloads ? Object.values(downloads).reduce<number>((acc, curr) => acc + (curr ?? 0), 0) : 0}
												</Text>
												<HiDownload color="var(--mantine-color-dimmed)" />
											</Group>
										</Stack>
									)}
								</Group>
							</Group>
						</Stack>
					</Tile>

					{windowWidth <= BREAKPOINT_TABLET && (
						<Tile p={0}>
							<Group gap={0} align="center" justify="start">
								<Button
									component="a"
									href={mod.url ?? ''}
									variant="transparent"
									leftSection={<TfiWorld />}
									disabled={!mod.url}
									w="calc(100% / 3)"
									p={0}
								>
									Website
								</Button>
								<Button
									variant="transparent"
									w="calc(100% / 3)"
									p={0}
								>
									<Text size="sm" c="dimmed">
										{mod.loaders.join(', ')}
									</Text>
								</Button>

								<Button
									rightSection={<HiDownload color="var(--mantine-color-dimmed)" />}
									variant="transparent"
									w="calc(100% / 3)"
									p={0}
								>
									<Text size="sm" c="dimmed">
										{downloads ? Object.values(downloads).reduce<number>((acc, curr) => acc + (curr ?? 0), 0) : 0}
									</Text>
								</Button>
							</Group>
						</Tile>
					)}

					{versions && (
						<Stack gap="sm">
							<Tile p="sm">
								<Group align="center" gap="sm" wrap="nowrap">
									<TextInput
										className="w-full"
										value={search}
										onChange={(e) => setSearch(e.currentTarget.value)}
										placeholder="Search for a mod/minecraft version..."
									/>
									<Select
										data={itemsPerPage}
										value={versionShownPerPage}
										onChange={(e) => e ? setVersionsShownPerPage(e) : null}
										withCheckIcon={false}
										w={120}
									/>
								</Group>
							</Tile>
							{versionsShown[activePage - 1] && versionsShown[activePage - 1]?.map((ver) =>
								<Tile key={ver.id}>
									<Stack gap="md">
										<Group gap={5} align="baseline">
											<Text size="md" fw={700}>{ver.version}</Text>
											<Text size="xs" c="dimmed">for Minecraft {ver.mcVersion.join(', ')}</Text>
										</Group>

										<Group
											gap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'md' : 'sm'}
											wrap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
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
												{windowWidth <= BREAKPOINT_MOBILE_LARGE && (
													<Button
														variant="light"
														className="navbar-icon-fix"
													>
														<GrGallery size={14} />
													</Button>
												)}
												{windowWidth > BREAKPOINT_MOBILE_LARGE && (
													<Button
														variant="light"
														leftSection={<GrGallery size={14} />}
														rightSection={<HiArrowRight size={14} />}
													>
														Visit gallery
													</Button>
												)}
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
			)}
		</Stack>
	);
}
