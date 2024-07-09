import { Button, Group, MultiSelect, MultiSelectProps, Stack, Text } from '@mantine/core';
import { Texture } from '@prisma/client';
import { useState } from 'react';
import { TbPlus } from 'react-icons/tb';

import { TextureImage } from '~/components/texture-img';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET } from '~/lib/constants';
import { gradient, gradientDanger, sortByName } from '~/lib/utils';
import { addRelationsToTexture, getRelatedTextures, removeRelationFromTexture } from '~/server/data/texture';
import { MCMETA } from '~/types';

interface TextureRelationsProps {
	texture: Texture;
	textures: Texture[];
}

export function TextureRelations({ texture, textures }: TextureRelationsProps) {
	const [relatedTextures, setRelatedTextures] = useState<Texture[]>([]);
	const [newRelatedTextures, setNewRelatedTexturesIds] = useState<string[]>([]);

	const [windowWidth, _] = useDeviceSize();

	const texturePerRow = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 2 : windowWidth <= BREAKPOINT_TABLET ? 4 : 6;
	const parentWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE
		? `${windowWidth}px`
		: `calc(${windowWidth}px - (2 * var(--modal-inner-x-offset, var(--modal-x-offset))))`;

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

	const handleRelationRemove = async (id: string) => {
		removeRelationFromTexture(texture.id, id)
			.then((res) => setRelatedTextures(res.sort(sortByName)));
	};

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const texture = textures.find((u) => u.id === option.value)!;

		return (
			<Group gap="sm" wrap="nowrap">
				<TextureImage
					src={texture.filepath}
					size={40}
					alt={texture.name}
					mcmeta={texture.mcmeta as unknown as MCMETA}
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
						.map((t) => ({ value: t.id, label: t.name ?? 'Unknown', disabled: relatedTextures.map((t) => t.id).includes(t.id) }))
					}
					renderOption={renderMultiSelectOption}
					defaultValue={[]}
					onChange={setNewRelatedTexturesIds}
					hidePickedOptions
					searchable
					clearable
					className="w-full"
				/>
				<Button
					variant="gradient"
					gradient={gradient}
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
								gradient={gradientDanger}
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
