
import { Group, FileInput, TextInput, Badge, Stack, Text } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';

import { TextureImage } from '~/components/textures/texture-img';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

import type { ModpackModalFormValues } from './modpack-modal';
import type { FileInputProps } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { Modpack } from '@prisma/client';

export function ModpackModalGeneral({ previewImg, modpack, form }: { form: UseFormReturnType<ModpackModalFormValues>, previewImg: string, modpack: Modpack | undefined }) {
	const { width } = useViewportSize();
	const imageWidth = width <= BREAKPOINT_MOBILE_LARGE ? width * 0.7 : 220;

	const filename: FileInputProps['valueComponent'] = ({ value }) => {
		if (value === null) return <Text size="sm" c="dimmed">None</Text>;
		if (typeof value === 'string') return <Text size="sm" c="dimmed">{value}</Text>;

		if (Array.isArray(value)) return <Text size="sm" c="dimmed">{value.map(file => file.name).join(', ')}</Text>;
		return <Text size="sm" c="dimmed">{value.name}</Text>;
	};

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

			<Stack w={width > BREAKPOINT_MOBILE_LARGE ? `calc(100% - ${imageWidth}px - var(--mantine-spacing-md))` : '100%'} gap="sm">
				<TextInput label="Name" required {...form.getInputProps('name')} />
				<TextInput label="Description" placeholder="Give this modpack a nice description" {...form.getInputProps('description')} />
				<TextInput label="Authors" description="Use a comma to separate multiple authors" required {...form.getInputProps('authors')} />
				<FileInput label="Picture" placeholder={previewImg} accept="image/*" required {...form.getInputProps('image')} valueComponent={filename} />
			</Stack>
		</Group>
	);
}
