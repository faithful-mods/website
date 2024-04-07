'use client';

import { Button, Code, Group, Stack, Text, TextInput } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { Mod, ModVersion, Modpack } from '@prisma/client';
import { useState, useTransition } from 'react';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient, gradientDanger, notify } from '~/lib/utils';
import { createModpackVersion, deleteModpackVersion, updateModpackVersion, addModsToModpackVersion, removeModFromModpackVersion } from '~/server/data/modpacks-version';
import { getModsFromIds } from '~/server/data/mods';
import type { ModpackVersionWithMods } from '~/types';

export function ModpackVersionModal({ modpack, modpackVersion, onClose }: { modpack: Modpack, modpackVersion?: ModpackVersionWithMods, onClose: () => void }) {
	const [isPending, startTransition] = useTransition();
	const [_modpackVersion, setModpackVersion] = useState<ModpackVersionWithMods | undefined>(modpackVersion);
	const [modVersions, setModVersions] = useState<ModVersion[]>(modpackVersion?.mods ?? []);
	const [mods, setMods] = useState<Mod[]>([]);

	useEffectOnce(() => {
		getModsFromIds(modVersions.map((modVersion) => modVersion.modId))
			.then(setMods)
			.catch((error) => {
				console.error(error);
			});
	});
	
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
			setMods(mods);
		});
	};

	const filesDrop = (files: File[]) => {
		startTransition(async () => {
			let editedModpackVersion = !modpackVersion 
				? await createModpackVersion({ modpack, version: form.values.version })
				: modpackVersion;

			try {
				const data = new FormData();
				files.forEach((file) => data.append('file', file));

				const updated = await addModsToModpackVersion(editedModpackVersion.id, data);
				setModpackVersion(updated);
				setModVersions(updated.mods);

				const mods = await getModsFromIds(updated.mods.map((modVersion) => modVersion.modId));
				setMods(mods);
			} catch (e) {
				notify('Error', (e as Error).message, 'red');
			}
		});
	};

	return (
		<Stack gap="md">
			<TextInput label="Version" placeholder="1.2.4" required {...form.getInputProps('version')} />
			<Stack justify="start" gap="0">
				<Text size="sm">Mods for this version</Text>
				{form.values.version.length === 0 && <Text size="xs" c={gradientDanger.to}>Set a version first</Text>}
				<Dropzone 
					disabled={form.values.version.length === 0}
					className={form.values.version.length === 0 ? 'dropzone-disabled' : ''}
					onDrop={filesDrop} 
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

			{mods.length > 0 && 
				<Stack gap="sm" style={{ maxHeight: '400px', overflowY: modVersions.length > 5 ? 'auto' : 'hidden' }}>
					{modVersions.map((modVersion, index) =>
						<Group key={index} justify="space-between">
							<Stack gap="0">
								<Text size="sm" maw={280} truncate="end">{mods.find((mod) => mod.id === modVersion.modId)?.name}</Text>
								<Text size="xs" maw={280} truncate="end" c="dimmed">{modVersion.version}</Text>
							</Stack>
							<Button
								variant="light"
								color={gradientDanger.to}
								onClick={() => deleteModFromMV(modVersion.id)}
								mr={modVersions.length > 5 ? 'sm' : 0}
							>
								Remove
							</Button>
						</Group>
					)}
				</Stack>
			}
			<Group gap="sm" mt="md">
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