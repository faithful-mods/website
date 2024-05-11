'use client';

import { Button, Code, Group, Stack, Text, TextInput } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { Mod, ModVersion, Modpack } from '@prisma/client';
import { useEffect, useState, useTransition } from 'react';

import { TextureImage } from '~/components/texture-img';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, gradientDanger, notify, sortByName } from '~/lib/utils';
import { createModpackVersion, deleteModpackVersion, updateModpackVersion, addModsToModpackVersion, removeModFromModpackVersion } from '~/server/data/modpacks-version';
import { getModsFromIds } from '~/server/data/mods';
import type { ModpackVersionWithMods } from '~/types';

export function ModpackVersionModal({ modpack, modpackVersion, onClose }: { modpack: Modpack, modpackVersion?: ModpackVersionWithMods, onClose: () => void }) {
	const [isPending, startTransition] = useTransition();
	const [_modpackVersion, setModpackVersion] = useState<ModpackVersionWithMods | undefined>(modpackVersion);

	const [mods, setMods] = useState<Mod[]>([]);
	const [modVersions, setModVersions] = useState<ModVersion[]>(modpackVersion?.mods ?? []);

	const [search, setSearch] = useState<string>('');
	const [displayedMods, setDisplayedMods] = useState<Mod[]>([]);

	const [progression, setProgression] = useState<number>(0);
	const [progressionMax, setProgressionMax] = useState<number>(0);

	const [windowWidth, windowHeight] = useDeviceSize();

	useEffectOnce(() => {
		getModsFromIds(modVersions.map((modVersion) => modVersion.modId))
			.then((mods) => {
				setMods(mods.sort(sortByName));
			})
			.catch((error) => {
				console.error(error);
			});
	});

	useEffect(() => {
		setDisplayedMods(mods.filter((mod) => mod.name.toLowerCase().includes(search.toLowerCase())));
	}, [search, mods]);

	const form = useForm<{ version: string }>({
		initialValues: {
			version: modpackVersion?.version ?? '',
		},
		validate: {
			version: (value) => {
				if (!value) return 'Version is required';
				return null;
			},
		},
	});

	const saveMV = () => {
		startTransition(async () => {
			if (!_modpackVersion) return;

			// New modpack version
			if (!modpackVersion) await updateModpackVersion({ id: _modpackVersion.id, version: form.values.version });
			// Edit of an existing modpack version
			else await updateModpackVersion({ id: modpackVersion.id, version: form.values.version });

			onClose();
		});
	};

	const deleteMV = () => {
		startTransition(async () => {
			if (!modpackVersion) return;
			await deleteModpackVersion(modpackVersion.id);
			onClose();
		});
	};

	const deleteModFromMV = (modVersionId: string) => {
		startTransition(async () => {
			if (!_modpackVersion) return;

			const updated = await removeModFromModpackVersion(_modpackVersion.id, modVersionId);
			setModpackVersion(updated);
			setModVersions(updated.mods);

			const mods = await getModsFromIds(updated.mods.map((modVersion) => modVersion.modId));
			setMods(mods.sort(sortByName));
		});
	};

	const filesDrop = async (files: File[]) => {
		let editedModpackVersion = !_modpackVersion
			? await createModpackVersion({ modpack, version: form.values.version })
			: _modpackVersion;

		for (const file of files) {
			try {
				const data = new FormData();
				data.append('file', file);
				editedModpackVersion = await addModsToModpackVersion(editedModpackVersion.id, data);
			} catch (e) {
				notify('Error', (e as Error).message, 'red');
			} finally {
				setProgression((prev) => prev + 1);
			}
		}

		setModpackVersion(editedModpackVersion);
		setModVersions(editedModpackVersion.mods);
		setProgression(0);
		setProgressionMax(0);

		const mods = await getModsFromIds(editedModpackVersion.mods.map((modVersion) => modVersion.modId));
		setMods(mods.sort(sortByName));
	};

	return (
		<Stack gap="md" style={{ maxHeight: `calc(${windowHeight - 60}px - var(--mantine-spacing-md))` }}>
			<TextInput label="Version" placeholder="1.2.4" required {...form.getInputProps('version')} />
			<Stack justify="start" gap="0">
				<Text mb={5} size="var(--input-label-size, var(--mantine-font-size-sm))" fw={500}>Add mods</Text>
				{form.values.version.length === 0 && <Text size="xs" c={gradientDanger.to}>Set a version first</Text>}
				<Dropzone
					disabled={form.values.version.length === 0}
					className={form.values.version.length === 0 ? 'dropzone-disabled' : ''}
					onDrop={async (files) => {
						setProgression(0);
						setProgressionMax(files.length);
						await filesDrop(files);
					}}
					accept={['application/java-archive']}
					mt="0"
				>
					<div>
						<Text size="l" inline>
							Drag <Code>.JAR</Code> files here or click to select files
						</Text>
						<Text size="sm" c="dimmed" inline mt={7}>
							Attach as many files as you like, each file will be added as a separate mod
						</Text>
					</div>
				</Dropzone>
			</Stack>

			{mods.length > 0 && (
				<>
					<Stack gap="0">
						<Text mb={5} size="var(--input-label-size, var(--mantine-font-size-sm))" fw={500}>Current mods</Text>
						<TextInput placeholder="Search mods" onChange={(e) => setSearch(e.currentTarget.value)} />
					</Stack>
					<Stack gap="sm" style={{ maxHeight: windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : '400px', overflowY: modVersions.length > 5 ? 'auto' : 'hidden' }}>
						{displayedMods.map((mod, index) =>
							<Group key={index} justify="space-between">
								<Group gap="xs">
									<TextureImage src={mod.image ?? './icon.png'} alt={mod.name} size={36} />
									<Stack gap="0">
										<Text size="sm" maw={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 230 : ''} truncate="end">{mod.name}</Text>
										<Text size="xs" c="dimmed">{modVersions.find((v) => v.modId === mod.id)?.version}</Text>
									</Stack>
								</Group>
								<Button
									variant="light"
									color={gradientDanger.to}
									onClick={() => deleteModFromMV(modVersions.find((v) => v.modId === mod.id)!.id)}
								>
									Remove
								</Button>
							</Group>
						)}
						{displayedMods.length === 0 && <Text ta="center" size="xs" c="dimmed">No mods found</Text>}
					</Stack>
				</>
			)}
			{progressionMax > 0 && (
				<Text c="dimmed" ta="center" size="xs" mt="md">
					uploading: { progression } / { progressionMax }
				</Text>
			)}

			<Group gap="sm">
				{(modpackVersion || mods.length > 0) &&
					<Button
						variant="gradient"
						gradient={gradientDanger}
						style={{ width: 'calc((100% - var(--mantine-spacing-sm)) / 2)' }}
						onClick={() => deleteMV()}
						disabled={isPending}
						loading={isPending}
					>
						Delete Version
					</Button>
				}
				<Button
					variant="gradient"
					gradient={gradient}
					style={{ width: (modpackVersion || mods.length > 0) ? 'calc((100% - var(--mantine-spacing-sm)) / 2)' : '100%' }}
					onClick={() => saveMV()}
					disabled={isPending || !form.isValid() || !_modpackVersion}
					loading={isPending}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
