'use client';

import { useParams } from 'next/navigation';

import { useMemo, useRef, useState } from 'react';

import { GrGallery } from 'react-icons/gr';
import { HiDownload } from 'react-icons/hi';
import { HiArrowRight } from 'react-icons/hi2';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { TfiWorld } from 'react-icons/tfi';

import { Button, Group, Progress, Stack, Text, Tooltip } from '@mantine/core';
import { Resolution } from '@prisma/client';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, RESOLUTIONS_COLORS } from '~/lib/constants';
import { EMPTY_PROGRESSION } from '~/lib/utils';
import { getModsFromIds } from '~/server/data/mods';
import { getModVersionFromMod, getModVersionProgressionFromMod } from '~/server/data/mods-version';

import type { Mod, ModVersion } from '@prisma/client';
import type { Progression } from '~/types';

export default function ModPage() {
	const modId = useParams().modId as string;

	const [windowWidth] = useDeviceSize();

	const [mod, setMod] = useState<Mod | null>(null);
	const [isLoading, setLoading] = useState(true);

	const [versions, setVersions] = useState<ModVersion[] | null>(null);
	const [progressions, setProgressions] = useState<Record<string, Progression> | null>(null);

	const slice = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 2 : 5;

	const resolutions = useMemo(() => Object.keys(Resolution) as Resolution[], []);

	const percentages = useMemo(() => {
		const p = versions?.map((modVer) => progressions?.[modVer.id]
			? ({ id: modVer.id, progression: progressions?.[modVer.id]! })
			: ({ id: modVer.id, progression: Object.assign({}, EMPTY_PROGRESSION) }))
			?? [];

		const output: Partial<Record<Resolution, Record<string, number>>>= {};

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

	useEffectOnce(() => {
		if (!modId) return;

		getModsFromIds([modId])
			.then((mod) => setMod(mod[0] ?? null))
			.then(() => {
				getModVersionFromMod(modId).then(setVersions);
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
												<Text size="sm" c="dimmed">-</Text>
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
									<Text size="sm" c="dimmed">-</Text>
								</Button>
							</Group>
						</Tile>
					)}

					{versions && (
						<Stack gap="sm">
							{/* <Tile p="sm">
								<TextInput
									placeholder="Search for a mod version or minecraft version..."
								/>
							</Tile> */}
							{versions.map((ver) =>
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
													<Button
														key={res}
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
													<Tooltip key={res} label={`${
														progressions?.[ver.id]?.textures.done[res]}/${progressions?.[ver.id]?.textures.todo === 0 ? '?' : progressions?.[ver.id]?.textures.todo} (${(percentages[res]?.[ver.id] ?? 0).toFixed(2)}%)`}>
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
						</Stack>

					// const progressBar = (modVersion: string) => {
					// 	const p = verProgress?.[modVersion] ?? Object.assign({}, EMPTY_PROGRESSION);
					// 	const percentage = (res: Resolution) => p.textures.todo === 0 ? 0 : (p.textures.done[res] * 100) / p.textures.todo;

					// 	return (
					// 		<Group gap="md" wrap="wrap">
					// 			{(Object.keys(Resolution) as Resolution[]).map((res) => (
					// 				<Stack key={res} gap="xs" w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc((100% - (2 * var(--mantine-spacing-md))) / 3)'}>
					// 					<Group gap="xs" wrap="nowrap" w="100%">
					// 						<Text size="xs" w="30px">{res}</Text>
					// 						<Tooltip label={`${p.textures.done[res]}/${p.textures.todo === 0 ? '?' : p.textures.todo} (${percentage(res).toFixed(2)}%)`}>
					// 							<Progress.Root size="xl" w="100%">
					// 								<Progress.Section value={percentage(res)} color={RESOLUTIONS_COLORS[res]} />
					// 							</Progress.Root>
					// 						</Tooltip>
					// 					</Group>
					// 					<Group w="100%" ml={windowWidth <= BREAKPOINT_TABLET ? 0 : 'calc(30px + var(--mantine-spacing-xs))'} gap="xs">
					// 						<Button disabled size="compact-md" rightSection={<HiDownload />} variant="outline" fullWidth={windowWidth <= BREAKPOINT_TABLET}>Download</Button>
					// 						<Button disabled size="compact-md" rightSection={<GrGallery />} variant="outline" fullWidth={windowWidth <= BREAKPOINT_TABLET}>Textures</Button>
					// 					</Group>
					// 				</Stack>
					// 			))}
					// 		</Group>
					// 	);
					// };

					// <Accordion variant="separated" radius="md" defaultValue={latestVersion}>
					// 	{Object.entries(versions).map(([mcVersion, modVersions]) => (
					// 		<Accordion.Item value={mcVersion} key={mcVersion} mb="sm" mt={0}>
					// 			<Accordion.Control>
					// 				<Title order={4}>{mcVersion}</Title>
					// 			</Accordion.Control>
					// 			<Accordion.Panel>
					// 				<Stack gap="xs">
					// 					{modVersions.map((v) => (
					// 						<Tile key={v.id} shadowless withBorder>
					// 							<Stack>
					// 								<Title order={4} mb="xs">{v.version}</Title>
					// 								{progressBar(v.id)}
					// 							</Stack>
					// 						</Tile>
					// 					))}
					// 				</Stack>
					// 			</Accordion.Panel>
					// 		</Accordion.Item>
					// 	))}

					// </Accordion>
					)}
				</>
			)}
		</Stack>
	);
}
