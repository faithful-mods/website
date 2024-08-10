'use client';

import { useParams } from 'next/navigation';

import { useState } from 'react';

import { HiDownload } from 'react-icons/hi';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { TfiWorld } from 'react-icons/tfi';

import { Button, Group, Stack, Text } from '@mantine/core';

import { TabsLayout } from '~/components/tabs';
import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { getModsFromIds, getModDownloads } from '~/server/data/mods';

import type { Mod } from '@prisma/client';
import type { Downloads } from '~/types';

export default function ModLayout({ children }: { children: React.ReactNode }) {
	const [isLoading, setLoading] = useState(true);

	const modId = useParams().modId as string;
	const [mod, setMod] = useState<Mod | null>(null);

	const [windowWidth] = useDeviceSize();
	const slice = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 2 : 5;

	const [downloads, setDownloads] = useState<Downloads | null>(null);

	useEffectOnce(() => {
		if (!modId) return;

		getModsFromIds([modId])
			.then((mod) => setMod(mod[0] ?? null))
			.then(() => getModDownloads(modId).then(setDownloads))
			.finally(() => setLoading(false));
	});

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
					<Stack gap="xs">
						<Group wrap="nowrap">
							<TextureImage
								src={mod.image ?? './icon.png'}
								alt={mod.name}
								size={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
								styles={{
									borderRadius: 5,
								}}
							/>
							<Stack
								align="start"
								gap="xs"
								h={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 85 : 120}
								w="100%"
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
									{mod.description && (<Text size="sm" lineClamp={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 1 : 2}>{mod.description}</Text>)}
									{!mod.description && (<Text size="sm" c="dimmed">No description</Text>)}
								</Stack>

								<Group gap="xl" align="end" justify="center" mt={-4}>
									{mod.url && (
										<Button
											component="a"
											href={mod.url}
											variant="transparent"
											leftSection={<TfiWorld />}
											p={0}
										>
											Website
										</Button>
									)}
									<Group gap="xs" wrap="nowrap" align="center" style={{ height: '36px' }}>
										<IoExtensionPuzzleOutline color="var(--mantine-color-dimmed)" />
										<Text size="sm" c="dimmed">
											{mod.loaders.join(', ')}
										</Text>
									</Group>
									<Group gap="xs" wrap="nowrap" align="center" style={{ height: '36px' }}>
										<HiDownload color="var(--mantine-color-dimmed)" />
										<Text size="sm" c="dimmed">
											{downloads ? Object.values(downloads).reduce<number>((acc, curr) => acc + (curr ?? 0), 0) : 0}
										</Text>
									</Group>
								</Group>
							</Stack>
						</Group>
					</Stack>

					<TabsLayout
						defaultValue="downloads"
						isLayout
						variant="filled"
						tabs={[
							{ value: 'downloads', label: 'Downloads', layoutTab: true },
							{ value: 'gallery', label: 'Gallery' },
						]}
					>
						{children}
					</TabsLayout>
				</>
			)}
		</Stack>
	);
}
