
import { useState } from 'react';
import type { RefObject } from 'react';

import { TbPlus } from 'react-icons/tb';

import { Button, Group, MultiSelect, Stack, Text } from '@mantine/core';

import { PaginatedList } from '~/components/base/paginated-list';
import { GalleryTexture } from '~/components/textures/texture-gallery';
import { TextureImage } from '~/components/textures/texture-img';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { GRADIENT } from '~/lib/constants';
import { sortByName } from '~/lib/utils';
import { addRelationsToTexture, getRelatedTextures, removeRelationFromTexture } from '~/server/data/texture';

import type { MultiSelectProps } from '@mantine/core';
import type { Texture } from '@prisma/client';

interface TextureRelationsProps {
	texture: Texture;
	textures: Texture[];
}

export function TextureRelations({ texture, textures }: TextureRelationsProps) {
	const [relatedTextures, setRelatedTextures] = useState<Texture[]>([]);
	const [newRelatedTextures, setNewRelatedTexturesIds] = useState<number[]>([]);

	const [itemsPerRow, setItemsPerRow] = useState(0);
	const [texturesGroupRef, setRef] = useState<RefObject<HTMLDivElement>>();

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

			<PaginatedList
				items={relatedTextures}

				onUpdate={({ itemsPerRow, containerRef }) => {
					setItemsPerRow(itemsPerRow);
					setRef(containerRef);
				}}

				renderItem={(relatedTexture) => (
					<GalleryTexture
						key={relatedTexture.id}
						texture={relatedTexture}
						rowItemsGap={10}
						rowItemsLength={itemsPerRow}
						container={texturesGroupRef}

						className="cursor-pointer"
						onClick={() => handleRelationRemove(relatedTexture.id)}
					/>
				)}
			/>
		</Stack>
	);
}
