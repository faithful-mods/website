
import { useState } from 'react';

import { TbPlus } from 'react-icons/tb';

import { Button, Group, MultiSelect, Stack, Text } from '@mantine/core';

import { TextureImage } from '~/components/texture-img';
import { useViewportSize } from '@mantine/hooks';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { sortByName } from '~/lib/utils';
import { addRelationsToTexture, getRelatedTextures, removeRelationFromTexture } from '~/server/data/texture';

import type { MultiSelectProps } from '@mantine/core';
import type{ Texture } from '@prisma/client';

interface TextureRelationsProps {
	texture: Texture;
	textures: Texture[];
}

export function TextureRelations({ texture, textures }: TextureRelationsProps) {
	const [relatedTextures, setRelatedTextures] = useState<Texture[]>([]);
	const [newRelatedTextures, setNewRelatedTexturesIds] = useState<number[]>([]);

	const { width } = useViewportSize();

	const texturePerRow = width <= BREAKPOINT_MOBILE_LARGE ? 2 : width <= BREAKPOINT_TABLET ? 4 : 6;
	const parentWidth = width <= BREAKPOINT_MOBILE_LARGE
		? `${width}px`
		: `calc(${width}px - (2 * var(--modal-inner-x-offset, var(--modal-x-offset))))`;

	// texture width = (parent width - side padding - gap) / items per row
	const textureWidth = `calc((${parentWidth} - (2 * var(--mantine-spacing-md)) - (${texturePerRow - 1} * var(--mantine-spacing-md))) / ${texturePerRow})`;

	useEffectOnce(() => {
		getRelatedTextures(texture.id)
			.then((res) => {
				setRelatedTextures(res.sort(sortByName));
			});
	});

	const handleRelationAdd = async () => {
		addRelationsToTexture(texture.id, newRelatedTextures)
			.then((res) => setRelatedTextures(res.sort(sortByName)));
	};

	const handleRelationRemove = async (id: number) => {
		removeRelationFromTexture(texture.id, id)
			.then((res) => setRelatedTextures(res.sort(sortByName)));
	};

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const texture = textures.find((u) => u.id === parseInt(option.value, 10))!;

		return (
			<Group gap="sm" wrap="nowrap">
				<TextureImage
					src={texture.filepath}
					size={40}
					alt={texture.name}
					mcmeta={texture.mcmeta}
				/>
				<div>
					<Text size="sm">{texture.name}</Text>
					{option.disabled && <Text size="xs" c="dimmed">Already selected!</Text>}
					{!option.disabled && <Text size="xs" c="dimmed">{texture.aliases.join(', ')}</Text>}
				</div>
			</Group>
		);
	};

	return (
		<Stack mt="md">
			<Text size="sm">
				Here you can add relations to this texture. Relations are textures that are similar to this one.
			</Text>

			<Group wrap="nowrap" align="end" gap="sm">
				<MultiSelect
					limit={10}
					label="Add relations"
					placeholder="Select or search textures..."
					data={textures
						.filter((t) => t.id !== texture.id)
						.map((t) => ({
							value: t.id.toString(),
							label: t.name ?? 'Unknown',
							disabled: relatedTextures.map((t) => t.id).includes(t.id),
						}))
					}
					renderOption={renderMultiSelectOption}
					defaultValue={[]}
					onChange={(e) => setNewRelatedTexturesIds(e.map((t) => parseInt(t, 10)))}
					hidePickedOptions
					searchable
					clearable
					className="w-full"
				/>
				<Button
					variant="gradient"
					gradient={GRADIENT}
					className="navbar-icon-fix"
					onClick={handleRelationAdd}
				>
					<TbPlus />
				</Button>
			</Group>

			<Text fw={500} size="var(--input-label-size, var(--mantine-font-size-sm))">Related to</Text>
			<Group mt={-10}>
				{relatedTextures.length === 0 && (
					<Text size="xs" c="dimmed">No relation yet.</Text>
				)}

				{relatedTextures.length > 0 && relatedTextures.map((t) => (
					<TextureImage
						key={t.id}
						src={t.filepath}
						alt={t.name}
						size={textureWidth}
					>
						<Stack gap="xs">
							{t.name}

							<Button
								variant="gradient"
								gradient={GRADIENT_DANGER}
								onClick={() => handleRelationRemove(t.id)}
							>
								Delete relation
							</Button>
						</Stack>
					</TextureImage>
				))}
			</Group>
		</Stack>
	);
}
