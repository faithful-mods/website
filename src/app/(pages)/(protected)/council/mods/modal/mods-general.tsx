import type { ModModalFormValues } from './mods-modal';
import type { Mod } from '@prisma/client';

import { Badge, FileInput, Group, MultiSelect, Stack, TextInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';

import { TextureImage } from '~/components/texture-img';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, MODS_LOADERS } from '~/lib/constants';

export interface ModModalGeneralProps {
	form: UseFormReturnType<ModModalFormValues>;
	previewImg: string;
	mod: Mod;
}

export function ModModalGeneral({ previewImg, mod, form }: ModModalGeneralProps) {
	const [windowWidth] = useDeviceSize();
	const imageWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE ? windowWidth * 0.7 : 220;

	return (
		<Group gap="md" align="start" mt="md">
			<Stack align="center" gap="sm" ml="auto" mr="auto">
				<TextureImage
					notPixelated
					size={imageWidth}
					src={previewImg}
					alt={mod?.name + ' image'}
				/>
				{mod &&
					<>
						<Badge color="teal" variant="filled">Created: {mod.createdAt.toLocaleString()}</Badge>
						<Badge color="teal" variant="filled">Updated: {mod.updatedAt.toLocaleString()}</Badge>
					</>
				}
			</Stack>

			<Stack w={windowWidth > BREAKPOINT_MOBILE_LARGE ? `calc(100% - ${imageWidth}px - var(--mantine-spacing-md))` : '100%'} gap="sm">
				<TextInput label="Name" required {...form.getInputProps('name')} />
				<TextInput label="Description" {...form.getInputProps('description')} />
				<TextInput label="Author(s)" required description="Use a comma to separate multiple authors" {...form.getInputProps('authors')} />
				<FileInput label="Picture" required accept="image/*"{...form.getInputProps('image')} />
				<TextInput label="Page URL" {...form.getInputProps('url')} />
				<MultiSelect data={MODS_LOADERS} label="Mod loader(s)" required {...form.getInputProps('loaders')} />
				<TextInput label="Forge Mod ID" required {...form.getInputProps('forgeId')} />
			</Stack>
		</Group>
	);
}
