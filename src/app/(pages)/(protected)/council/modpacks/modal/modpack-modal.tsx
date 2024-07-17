import { Group, Button, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Modpack } from '@prisma/client';
import { useState, useTransition } from 'react';

import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '~/lib/constants';
import { gradient, gradientDanger, notify } from '~/lib/utils';
import { createModpack, deleteModpack, updateModpack, updateModpackPicture } from '~/server/data/modpacks';

import { ModpackModalGeneral } from './modpack-general';
import { ModpackVersions } from './modpack-versions/modpack-version';

export interface ModpackModalFormValues {
	id: string;
	name: string;
	image: File | string;
	description: string;
	authors: string;
}

export function ModpackModal({ modpack, onClose }: { modpack?: Modpack | undefined, onClose: (editedModpack: Modpack | string) => void }) {
	const [isPending, startTransition] = useTransition();
	const [previewImg, setPreviewImg] = useState<string>(modpack?.image ?? '');
	const [windowWidth] = useDeviceSize();

	const form = useForm<ModpackModalFormValues>({
		initialValues: {
			id: modpack?.id || '',
			name: modpack?.name || '',
			description: modpack?.description || '',
			authors: modpack?.authors.join(', ') || '',
			image: modpack?.image || '',
		},
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name for the modpack';
				if (value.length < MIN_NAME_LENGTH) return `The modpack name should be at least ${MIN_NAME_LENGTH} characters long`;
				if (value.length > MAX_NAME_LENGTH) return `The modpack name should be less than ${MAX_NAME_LENGTH} characters long`;
			},
			image: (value) => {
				if (!value) return 'You must provide an image for the modpack';
			},
			authors: (value) => {
				if (!value) return 'You must provide at least one author for the modpack';
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
			let editedModpack: Modpack;

			try {
				const image = values.image;
				values.image = ''; // Avoid sending the image in the body (it's sent as a FormData instead)

				editedModpack = values.id
					? await updateModpack({ ...values, authors: values.authors.split(',') })
					: await createModpack({ ...values, authors: values.authors.split(',') });

				// file upload
				if (image instanceof File) {
					const data = new FormData();
					data.append('file', image);

					editedModpack = await updateModpackPicture(editedModpack.id, data);
				}

				onClose(editedModpack);
			} catch (e) {
				notify('Error', (e as Error).message, 'red');
			}
		});
	};

	const onDelete = (id: string) => {
		startTransition(async () => {
			deleteModpack(id);
			onClose(id);
		});
	};

	return (
		<>
			{modpack
				?
				<Tabs defaultValue="first">
					<Tabs.List>
						<Tabs.Tab value="first">General</Tabs.Tab>
						<Tabs.Tab value="second">Versions</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="first"><ModpackModalGeneral form={form} previewImg={previewImg} modpack={modpack} /></Tabs.Panel>
					<Tabs.Panel value="second"><ModpackVersions modpack={modpack} /></Tabs.Panel>
				</Tabs>
				:
				<ModpackModalGeneral form={form} previewImg={previewImg} modpack={modpack} />
			}

			<Group justify="end" mt="lg">
				{modpack &&
					<Button
						variant="gradient"
						gradient={gradientDanger}
						onClick={() => onDelete(modpack.id)}
						disabled={isPending}
						loading={isPending}
						fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
					>
						Delete Modpack
					</Button>
				}
				<Button
					variant="gradient"
					gradient={gradient}
					onClick={() => onSubmit(form.values)}
					disabled={isPending || !form.isValid()}
					loading={isPending}
					fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
				>
					{modpack ? 'Update' : 'Create'} Modpack
				</Button>
			</Group>
		</>
	);
}
