import type { Modpack } from '@prisma/client';

import { Group, Image, Skeleton, FileInput, TextInput, Badge, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';

import { ModpackModalFormValues } from './modpack-modal';

export function ModpackModalGeneral({ previewImg, modpack, form }: { form: UseFormReturnType<ModpackModalFormValues>, previewImg: string, modpack: Modpack | undefined }) {
	const imageWidth = 210;

	return (
		<Group gap="md" align="start" mt="md">
			<Stack align="center" gap="sm">
				{previewImg !== '' && <Image radius="md" src={previewImg} alt="Modpack image" width={imageWidth} height={imageWidth} fit="contain" className="image-background" style={{ maxWidth: imageWidth + 'px', maxHeight: imageWidth + 'px' }} />}
				{previewImg === '' && <Skeleton width={imageWidth} height={imageWidth} radius="md" animate={false} />}
				{modpack && 
					<>
						<Badge color="teal" variant="filled">Created: {modpack.createdAt.toLocaleString()}</Badge>
						<Badge color="teal" variant="filled">Updated: {modpack.updatedAt.toLocaleString()}</Badge>
					</>
				}
			</Stack>

			<Stack w={`calc(100% - ${imageWidth}px - var(--mantine-spacing-md))`} gap="sm">
				<TextInput label="Name" {...form.getInputProps('name')} required />
				<TextInput label="Description" {...form.getInputProps('description')} placeholder="Give this modpack a nice description"/>
				<FileInput label="Picture" {...form.getInputProps('image')} placeholder={previewImg} accept="image/*"/>
			</Stack>
		</Group>
	)
}