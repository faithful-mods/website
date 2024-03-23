import type { Modpack } from '@prisma/client';

import { Group, Image, Skeleton, FileInput, TextInput, Badge, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';

export function ModpackModalGeneral({ previewImg, modpack, form }: { form: UseFormReturnType<{ id: string, name: string, image: File | string }>, previewImg: string, modpack: Modpack | undefined }) {
	console.log(modpack, form.values.image);

	return (
		<Group gap="md" align="start" mt="md">
			{previewImg !== '' && <Image radius="md" src={previewImg} alt="Modpack image" width={200} height={200} fit="contain" />}
			{previewImg === '' && <Skeleton width={200} height={200} radius="md" animate={false} />}

			<Stack w="calc(100% - 200px - var(--mantine-spacing-md))" gap="sm">
				<FileInput label="Modpack picture" placeholder="test" {...form.getInputProps('image')} />
				<TextInput label="Name" {...form.getInputProps('name')} />

				{modpack && <Group gap="sm">
					<Badge mt="sm" color="teal" variant="filled">Created: {modpack.createdAt.toLocaleString()}</Badge>
					<Badge mt="sm" color="teal" variant="filled">Updated: {modpack.updatedAt.toLocaleString()}</Badge>
				</Group>}
			</Stack>
		</Group>
	)
}