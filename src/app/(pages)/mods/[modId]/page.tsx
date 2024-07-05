'use client';

import { Button, Group, Stack, Text } from '@mantine/core';
import { Mod } from '@prisma/client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { HiDownload } from 'react-icons/hi';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { TfiWorld } from 'react-icons/tfi';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET } from '~/lib/constants';
import { getModsFromIds } from '~/server/data/mods';

export default function ModPage() {
	const modId = useParams().modId as string;

	const [windowWidth, _] = useDeviceSize();

	const [mod, setMod] = useState<Mod | null>(null);
	const [isLoading, setLoading] = useState(true);

	useEffectOnce(() => {
		if (!modId) return;

		getModsFromIds([modId])
			.then((m) => {
				setMod(m[0]);
				setLoading(false);
			});
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
									<Text size="sm" c="dimmed">100 232</Text>
								</Button>
							</Group>
						</Tile>
					)}

					<Tile />
				</>
			)}
		</Stack>
	);
}
