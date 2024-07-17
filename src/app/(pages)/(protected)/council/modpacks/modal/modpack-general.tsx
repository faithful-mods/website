import type { Modpack } from '@prisma/client';

import { Group, FileInput, TextInput, Badge, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';

import { TextureImage } from '~/components/texture-img';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

import { ModpackModalFormValues } from './modpack-modal';

export function ModpackModalGeneral({ previewImg, modpack, form }: { form: UseFormReturnType<ModpackModalFormValues>, previewImg: string, modpack: Modpack | undefined }) {
	const [windowWidth] = useDeviceSize();
	const imageWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE ? windowWidth * 0.7 : 220;

	return (
		<Group gap="md" align="start" mt="md">
			<Stack align="center" gap="sm" ml="auto" mr="auto">
				<TextureImage
					notPixelated
					size={imageWidth}
					src={previewImg}
					alt={modpack?.name + ' image'}
				/>
				{modpack &&
					<>
						<Badge color="teal" variant="filled">Created: {modpack.createdAt.toLocaleString()}</Badge>
						<Badge color="teal" variant="filled">Updated: {modpack.updatedAt.toLocaleString()}</Badge>
					</>
				}
			</Stack>

			<Stack w={windowWidth > BREAKPOINT_MOBILE_LARGE ? `calc(100% - ${imageWidth}px - var(--mantine-spacing-md))` : '100%'} gap="sm">
				<TextInput label="Name" required {...form.getInputProps('name')} />
				<TextInput label="Description" placeholder="Give this modpack a nice description" {...form.getInputProps('description')} />
				<TextInput label="Authors" description="Use a comma to separate multiple authors" required {...form.getInputProps('authors')} />
				<FileInput label="Picture" placeholder={previewImg} accept="image/*" required {...form.getInputProps('image')} />
			</Stack>
		</Group>
	);
}
