'use client';

import type { Mod, Modpack } from '@prisma/client';

import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useTransition } from 'react';

import { gradient, gradientDanger } from '~/lib/utils';
import { deleteModVersion, removeModpackFromModVersion, updateModVersion } from '~/server/data/mods-version';
import type { ModVersionWithModpacks } from '~/types';

export interface ModVersionModalFormValues {
	version: string;
	mcVersion: string;
}

export function ModVersionModal({ mod, modVersion, onClose }: { mod: Mod, modVersion?: ModVersionWithModpacks | undefined, onClose: () => void }) {
	const [isPending, startTransition] = useTransition();
	const [modVersionModpacks, setModVersionModpacks] = useState<Modpack[]>(modVersion?.modpacks ?? []);
	
	const form = useForm<ModVersionModalFormValues>({
		initialValues: {
			version: modVersion?.version ?? '',
			mcVersion: modVersion?.mcVersion ?? '',
		},
		validate: {
			version: (value) => {
				if (!value) return 'Version is required';
				return null;
			},
			mcVersion: (value) => {
				if (!value) return 'MC Version is required';
				if (value === 'unknown') return 'MC Version cannot be unknown';
				return null;
			},
		},
	});

	const saveMV = () => {
		startTransition(async () => {
			if (!modVersion) return; // Should never happen as this component is only used for editing mod versions

			await updateModVersion({ id: modVersion.id, version: form.values.version, mcVersion: form.values.mcVersion });
			onClose();
		});
	};

	const deleteMV = () => {
		startTransition(async () => {
			if (!modVersion) return;

			await deleteModVersion(modVersion.id);
			onClose();
		});
	};

	const deleteModpackFromMV = (modpackVersionId: string) => {
		startTransition(async () => {
			if (!modVersion) return;

			const updated = await removeModpackFromModVersion(modVersion.id, modpackVersionId);
			setModVersionModpacks(updated);
		});
	};
	
	return (
		<Stack gap="md">
			<TextInput label="Version" placeholder="1.2.4" required {...form.getInputProps('version')} />
			<TextInput label="MC Version" placeholder="1.7.10" required {...form.getInputProps('mcVersion')} />

			{modVersionModpacks.length > 0 && 
				<Stack gap="sm" style={{ maxHeight: '400px', overflowY: modVersionModpacks.length > 5 ? 'auto' : 'hidden' }}>
					{modVersionModpacks.map((modpack, index) =>
						<Group key={index} justify="space-between">
							<Stack gap="0">
								<Text size="sm">{modpack.name}</Text>
								<Text size="xs" c="dimmed">{modpack.authors.join(', ')}</Text>
							</Stack>
							<Button
								variant="light"
								color={gradientDanger.to}
								onClick={() => deleteModpackFromMV(modpack.id)}
								mr={modVersionModpacks.length > 5 ? 'sm' : 0}
							>
								Remove
							</Button>
						</Group>
					)}
				</Stack>
			}

			<Group gap="sm" mt="md">
				{modVersion && 
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
					style={{ width: modVersion ? 'calc((100% - var(--mantine-spacing-sm)) / 2)' : '100%' }}
					onClick={() => saveMV()}
					disabled={isPending || !form.isValid()}
					loading={isPending}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}