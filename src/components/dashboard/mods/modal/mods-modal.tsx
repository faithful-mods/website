import type { Mod } from '@prisma/client';

import { Button, Code, Group, Tabs, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useState, useTransition } from 'react';

import { gradient, gradientDanger, notify } from '~/lib/utils';
import { createMod, deleteMod, getModsFromIds, updateMod, updateModPicture } from '~/server/data/mods';
import { addModVersionsFromJAR } from '~/server/data/mods-version';

import { ModVersions } from './mod-versions/mod-version';
import { ModModalGeneral } from './mods-general';

export interface ModModalFormValues {
	authors: string;
	id: string;
	name: string;
	description: string;
	url: string;
	forgeId: string;
	image: File | string;
}

export function ModModal({ mod, onClose }: {mod?: Mod | undefined, onClose: (editedMod: Mod | string) => void }) {
	const [_mod, setMod] = useState<Mod | undefined>(mod);
	const [isPending, startTransition] = useTransition();
	const [previewImg, setPreviewImg] = useState<string>(mod?.image || '');
	
	const form = useForm<ModModalFormValues>({
		initialValues: {
			id: mod?.id || '',
			name: mod?.name || '',
			authors: mod?.authors?.join(', ') || '',
			description: mod?.description || '',
			image: mod?.image || '',
			url: mod?.url || '',
			forgeId: mod?.forgeId || '',
		},
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name for the mod';
			},
			url: (value) => {
				if (value && !value.startsWith('https://')) return 'The URL must start with https://'
			},
			image: (value) => {
				if (!value) return 'You must provide an image for the modpack';
			},
			forgeId: (value) => {
				if (!value) return 'You must provide a Forge Mod ID for the mod';
			},
			authors: (value) => {
				if (!value) return 'You must provide an author for the mod';
			}
		},
		onValuesChange: (value) => {
			if (value.image && value.image instanceof File) setPreviewImg(value.image ? URL.createObjectURL(value.image) : mod?.image || '')
		},
	});

	const onSubmit = (values: typeof form.values) => {
		startTransition(async () => {
			let editedMod: Mod;

			try {
				const image = values.image;
				values.image = ''; // Avoid sending the image in the body (it's sent as a FormData instead)

				editedMod = values.id
					? await updateMod({ ...values, authors: values.authors.split(', ') })
					: await createMod({ ...values, authors: values.authors.split(', ') });

				// file upload
				if (image instanceof File) {
					const data = new FormData();
					data.append('file', image);

					editedMod = await updateModPicture(editedMod.id, data);
				}

				onClose(editedMod);
			} catch (e) {
				notify('Error', (e as Error).message, 'red');
			}
		});
	}

	const onDelete = (id: string) => {
		startTransition(async () => {
			await deleteMod(id);
			onClose(id);
		});
	}
	
	const filesDrop = (files: File[]) => {
		startTransition(async () => {
			const data = new FormData();
			files.forEach((file) => data.append('files', file));

			const addedModVersions = await addModVersionsFromJAR(data)
			const firstModId = addedModVersions[0].modId;
			const mod = await getModsFromIds([firstModId]).then((mods) => mods[0]);
			form.setValues({
				id: firstModId,
				name: mod.name,
				authors: mod.authors.join(', '),
				description: mod.description ?? '',
				image: mod.image ?? '',
				url: mod.url ?? '',
				forgeId: mod.forgeId ?? '',
			});
			setMod(mod);
		});
	}

	return (
		<>
			{_mod
				? 
				<Tabs defaultValue="first">
					<Tabs.List>
						<Tabs.Tab value="first">General</Tabs.Tab>
						<Tabs.Tab value="second">Versions</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="first"><ModModalGeneral form={form} previewImg={previewImg} mod={_mod} /></Tabs.Panel>
					<Tabs.Panel value="second"><ModVersions mod={_mod} /></Tabs.Panel>
				</Tabs>
				:
				<Dropzone 
					className="w-full"
					onDrop={filesDrop}
					accept={['application/java-archive']}
					mt="0"
				>
					<div>
						<Text size="l" inline>
							Drag <Code>.JAR</Code> files here or click to select files
						</Text>
						<Text size="sm" c="dimmed" inline mt={7}>
							Attach as many files as you like, each file will be added as a separate mod version.
							If there is another mod in the JAR, it will be added as a new mod and its version added to it.
						</Text>
					</div>
				</Dropzone>
			}

			<Group justify="end" mt="md">
				{_mod &&
					<>
						<Button
							variant="gradient"
							gradient={gradientDanger}
							onClick={() => onDelete(_mod.id)}
							disabled={isPending}
							loading={isPending}
						>
							Delete Mod
						</Button>
						<Button
							variant="gradient"
							gradient={gradient}
							onClick={() => onSubmit(form.values)}
							disabled={isPending || !form.isValid()}
							loading={isPending}
						>
							Update Mod
						</Button>
					</>
				}
			</Group>
		</>
	)
}
