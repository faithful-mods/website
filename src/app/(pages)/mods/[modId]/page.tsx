'use client';

import { Accordion, Button, Group, Progress, Stack, Text, Title, Tooltip } from '@mantine/core';
import { Mod, ModVersion, Resolution } from '@prisma/client';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { GrGallery } from 'react-icons/gr';
import { HiDownload } from 'react-icons/hi';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { TfiWorld } from 'react-icons/tfi';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, RESOLUTIONS_COLORS } from '~/lib/constants';
import { EMPTY_PROGRESSION } from '~/lib/utils';
import { getModWithModVersions } from '~/server/data/mods';
import { getModVersionProgression } from '~/server/data/mods-version';
import { Progression } from '~/types';

export default function ModPage() {
	const modId = useParams().modId as string;

	const [windowWidth] = useDeviceSize();

	const [mod, setMod] = useState<(Mod & { versions: ModVersion[] }) | null>(null);
	const [isLoading, setLoading] = useState(true);

	const [versions, setVersions] = useState<Record<string, ModVersion[]> | null>(null);
	const [verProgress, setVerProgress] = useState<Record<string, Progression> | null>(null);

	const latestVersion = useMemo(() => Object.keys(versions ?? {})[0], [versions]);

	useEffectOnce(() => {
		if (!modId) return;

		getModWithModVersions(modId)
			.then((m) => {
				if (m) {
					const versions = m.versions
						.sort((a, b) => a.mcVersion.localeCompare(b.mcVersion))
						.toReversed()
						.reduce<Record<string, ModVersion[]>>((acc, v) => {
							acc[v.mcVersion] = [...(acc[v.mcVersion] ?? []), v]
								.sort((a, b) => a.version.localeCompare(b.version))
								.reverse();

							return acc;
						}, {});

					setMod(m);
					setVersions(versions);

					m.versions.reduce<Record<string, Progression>>((acc, v) => {
						getModVersionProgression(v.id)
							.then((p) => {
								acc[v.id] = p ?? Object.assign({}, EMPTY_PROGRESSION);
								setVerProgress(acc);
							});

						return acc;
					}, {});
				}

				setLoading(false);
			});
	});

	const progressBar = (modVersion: string) => {
		const p = verProgress?.[modVersion] ?? Object.assign({}, EMPTY_PROGRESSION);
		const percentage = (res: Resolution) => p.textures.todo === 0 ? 0 : (p.textures.done[res] * 100) / p.textures.todo;

		return (
			<Group gap="md" wrap="wrap">
				{(Object.keys(Resolution) as Resolution[]).map((res) => (
					<Stack key={res} gap="xs" w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc((100% - (2 * var(--mantine-spacing-md))) / 3)'}>
						<Group gap="xs" wrap="nowrap" w="100%">
							<Text size="xs" w="30px">{res}</Text>
							<Tooltip label={`${p.textures.done[res]}/${p.textures.todo === 0 ? '?' : p.textures.todo} (${percentage(res).toFixed(2)}%)`}>
								<Progress.Root size="xl" w="100%">
									<Progress.Section value={percentage(res)} color={RESOLUTIONS_COLORS[res]} />
								</Progress.Root>
							</Tooltip>
						</Group>
						<Group w="100%" ml={windowWidth <= BREAKPOINT_TABLET ? 0 : 'calc(30px + var(--mantine-spacing-xs))'} gap="xs">
							<Button disabled size="compact-md" rightSection={<HiDownload />} variant="outline" fullWidth={windowWidth <= BREAKPOINT_TABLET}>Download</Button>
							<Button disabled size="compact-md" rightSection={<GrGallery />} variant="outline" fullWidth={windowWidth <= BREAKPOINT_TABLET}>Textures</Button>
						</Group>
					</Stack>
				))}
			</Group>
		);
	};

	return (
		<Stack gap="sm" mb="sm">
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
											{mod.authors.length > 0 && (<Text size="xs" c="dimmed">by {mod.authors.join(', ')}</Text>)}
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
						<Accordion variant="separated" radius="md" defaultValue={latestVersion}>

							{Object.entries(versions).map(([mcVersion, modVersions]) => (
								<Accordion.Item value={mcVersion} key={mcVersion}>
									<Accordion.Control>
										<Title order={4}>{mcVersion}</Title>
									</Accordion.Control>
									<Accordion.Panel>
										<Stack gap="xs">
											{modVersions.map((v) => (
												<Tile key={v.id} shadowless withBorder>
													<Stack>
														<Title order={4} mb="xs">{v.version}</Title>
														{progressBar(v.id)}
													</Stack>
												</Tile>
											))}
										</Stack>
									</Accordion.Panel>

								</Accordion.Item>
							))}

						</Accordion>
					)}
				</>
			)}
		</Stack>
	);
}
