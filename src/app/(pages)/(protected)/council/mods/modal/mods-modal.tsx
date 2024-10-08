import { useState, useTransition } from 'react';

import { Button, Group, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useViewportSize } from '@mantine/hooks';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_DESKTOP_LARGE, GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { createMod, deleteMod, updateMod, updateModPicture } from '~/server/data/mods';

import { ModVersions } from './mod-versions/mod-version';
import { ModModalGeneral } from './mods-general';

import type { Mod } from '@prisma/client';

export interface ModModalFormValues {
	authors: string;
	id: string;
	name: string;
	description: string;
	url: string;
	forgeId: string;
	image: File | string;
	loaders: string[];
}

export function ModModal({ mod, onClose }: {mod: Mod, onClose: (editedMod: Mod | string) => void }) {
	const [isPending, startTransition] = useTransition();
	const [previewImg, setPreviewImg] = useState<string>(mod?.image || '');
	const { width } = useViewportSize();

	const form = useForm<ModModalFormValues>({
		initialValues: {
			id: mod?.id || '',
			name: mod?.name || '',
			authors: mod?.authors?.join(', ') || '',
			description: mod?.description || '',
			image: mod?.image || '',
			url: mod?.url || '',
			forgeId: mod?.forgeId || '',
			loaders: mod?.loaders || [],
		},
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name for the mod';
			},
			url: (value) => {
				if (value && !value.startsWith('https://')) return 'The URL must start with https://';
			},
			image: (value) => {
				if (!value) return 'You must provide an image for the mod';
			},
			forgeId: (value) => {
				if (!value) return 'You must provide a Mod ID for the mod';
			},
			authors: (value) => {
				if (!value) return 'You must provide an author for the mod';
			},
			loaders: (value) => {
				if (!value || value.length === 0) return 'You must provide at least 1 mod loader';
			},
		},
		onValuesChange: (value) => {
			form.validate();

			if (value.image && value.image instanceof File) {
				setPreviewImg(URL.createObjectURL(value.image));
			}
		},
	});

	useEffectOnce(() => {
		form.validate();
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
	};

	const onDelete = (id: string) => {
		startTransition(async () => {
			await deleteMod(id);
			onClose(id);
		});
	};

	return (
		<>
			<Tabs defaultValue="first">
				<Tabs.List>
					<Tabs.Tab value="first">General</Tabs.Tab>
					<Tabs.Tab value="second">Versions</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="first"><ModModalGeneral form={form} previewImg={previewImg} mod={mod} /></Tabs.Panel>
				<Tabs.Panel value="second"><ModVersions mod={mod} /></Tabs.Panel>
			</Tabs>

			<Group justify="end" mt="lg">
				<Button
					variant="gradient"
					gradient={GRADIENT_DANGER}
					onClick={() => onDelete(mod.id)}
					disabled={isPending}
					loading={isPending}
					fullWidth={width <= BREAKPOINT_DESKTOP_LARGE}
				>
					Delete Mod
				</Button>
				<Button
					variant="gradient"
					gradient={GRADIENT}
					onClick={() => onSubmit(form.values)}
					disabled={isPending || !form.isValid()}
					loading={isPending}
					fullWidth={width <= BREAKPOINT_DESKTOP_LARGE}
				>
					Update Mod
				</Button>
			</Group>
		</>
	);
}
