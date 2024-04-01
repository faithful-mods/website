import type { ModModalFormValues } from './mods-modal';
import type { Mod } from '@prisma/client';

import { Badge, FileInput, Group, Image, Skeleton, Stack, TextInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';

export interface ModModalGeneralProps {
	form: UseFormReturnType<ModModalFormValues>;
	previewImg: string;
	mod: Mod;
}

export function ModModalGeneral({ previewImg, mod, form }: ModModalGeneralProps) {
	return (
		<Group gap="md" align="start" mt="md">
			{previewImg !== '' && <Image radius="md" src={previewImg} alt="Mod image" width={200} height={200} fit="contain" className="image-background" style={{ maxWidth: '200px', maxHeight: '200px' }} />}
			{previewImg === '' && <Skeleton width={200} height={200} radius="md" animate={false} />}

			<Stack w="calc(100% - 200px - var(--mantine-spacing-md))" gap="sm">
				{mod && 
					<Group gap="sm">
						<Badge mt="sm" color="teal" variant="filled">Created: {mod.createdAt.toLocaleString()}</Badge>
						<Badge mt="sm" color="teal" variant="filled">Updated: {mod.updatedAt.toLocaleString()}</Badge>
					</Group>
				}

				<FileInput label="Mod picture" {...form.getInputProps('image')} placeholder={previewImg} accept="image/*"/>
				<TextInput label="Name" {...form.getInputProps('name')} />
				<TextInput label="Authors" {...form.getInputProps('authors')} />
				<TextInput label="Description" {...form.getInputProps('description')} />
				<TextInput label="URL" {...form.getInputProps('url')} />
				<TextInput label="Forge ID" {...form.getInputProps('forgeId')} />
			</Stack>
		</Group>
	)
}
