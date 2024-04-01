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
	const imageWidth = 210;

	return (
		<Group gap="md" align="start" mt="md">
			<Stack align="center" gap="sm">
				{previewImg !== '' && <Image radius="md" src={previewImg} alt="Mod image" width={imageWidth} height={imageWidth} fit="contain" className="image-background" style={{ maxWidth: imageWidth + 'px', maxHeight: imageWidth + 'px' }} />}
				{previewImg === '' && <Skeleton width={imageWidth} height={imageWidth} radius="md" animate={false} />}
				{mod &&
					<>
						<Badge color="teal" variant="filled">Created: {mod.createdAt.toLocaleString()}</Badge>
						<Badge color="teal" variant="filled">Updated: {mod.updatedAt.toLocaleString()}</Badge>
					</>
				}
			</Stack>

			<Stack w={`calc(100% - ${imageWidth}px - var(--mantine-spacing-md))`} gap="sm">
				<TextInput label="Name" required {...form.getInputProps('name')} />
				<TextInput label="Description" {...form.getInputProps('description')} />
				<TextInput label="Author(s)" description="Use a comma to separate multiple authors" {...form.getInputProps('authors')} />
				<FileInput label="Picture" required accept="image/*"{...form.getInputProps('image')} />
				<TextInput label="Page URL" {...form.getInputProps('url')} />
				<TextInput label="Forge Mod ID" required {...form.getInputProps('forgeId')} />
			</Stack>
		</Group>
	)
}
