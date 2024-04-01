import type { Mod } from '@prisma/client';

import { Button, Group, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTransition } from 'react';

import { gradient, gradientDanger, notify } from '~/lib/utils';
import { createMod, deleteMod, updateMod, updateModPicture } from '~/server/data/mods';

interface formValues {
	authors: string;
	id: string;
	name: string;
	description: string;
	url: string;
	forgeId: string;
	image: File | string;
}

export function ModModal({ mod, onClose }: {mod?: Mod | undefined, onClose: (editedMod: Mod | string) => void }) {
	const [isPending, startTransition] = useTransition();
	
	const form = useForm<formValues>({
		initialValues: {
			id: mod?.id || '',
			name: mod?.name || '',
			authors: mod?.authors.join(', ') || '',
			description: mod?.description || '',
			image: mod?.image || '',
			url: mod?.url || '',
			forgeId: mod?.forgeId || '',
		},
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name for the mod';
			},
			image: (value) => {
				if (!value) return 'You must provide an image for the mod';
			}
		},
	});

	const onSubmit = (values: typeof form.values) => {
		startTransition(async () => {
			let editedMod: Mod;

			try {
				editedMod = values.id
					? await updateMod({ ...values, authors: values.authors.split(', ') })
					: await createMod({ ...values, authors: values.authors.split(', ') });

				// file upload
				if (values.image instanceof File) {
					const data = new FormData();
					data.append('file', values.image);

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
	
	return (
		<>
			{mod
				? 
				<Tabs defaultValue="first">
					<Tabs.List>
						<Tabs.Tab value="first">General</Tabs.Tab>
						<Tabs.Tab value="second">Versions</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="first">Todo 1</Tabs.Panel>
					<Tabs.Panel value="first">Todo 2</Tabs.Panel>
				</Tabs>
				: 
				'Hello World'
			}

			<Group justify="end" mt="md">
				{mod &&
					<Button
						variant="gradient"
						gradient={gradientDanger}
						onClick={() => onDelete(mod.id)}
						disabled={isPending}
						loading={isPending}
					>Delete Mod</Button>
				}
				<Button
					variant="gradient"
					gradient={gradient}
					onClick={() => onSubmit(form.values)}
					disabled={isPending || !form.isValid()}
					loading={isPending}>
					{mod ? 'Update' : 'Create'} Mod
				</Button>
			</Group>
		</>
	)
}
