'use client';

import { useState, useTransition } from 'react';
import type { RefObject } from 'react';

import { Badge, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { Modal } from '~/components/base/modal';
import { PaginatedList } from '~/components/base/paginated-list';
import { GalleryTexture } from '~/components/textures/texture-gallery';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify, sortByName } from '~/lib/utils';
import { getTexture, getTextures } from '~/server/data/texture';

import { TextureModal } from './modal/texture-modal';

import type { Texture } from '@prisma/client';

export default function CouncilTexturesPage() {
	const [isLoading, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [textures, setTextures] = useState<Texture[]>([]);
	const [textureModal, setTextureModal] = useState<Texture>();

	const [texturesFiltered, setTexturesFiltered] = useState(0);
	const [search, setSearch] = useState('');
	const [itemsPerRow, setItemsPerRow] = useState(0);

	const [texturesGroupRef, setRef] = useState<RefObject<HTMLDivElement>>();

	useEffectOnce(() => {
		startTransition(() => {
			getTextures()
				.then((res) => {
					const sorted = res.sort(sortByName);
					setTextures(sorted);
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	});

	const handleModalOpen = (t: Texture) => {
		if (!t) return;

		setTextureModal(t);
		openModal();
	};

	const handleModalClose = async (currTexture: Texture) => {
		const newTexture = await getTexture(currTexture.id);
		const newTextures = textures.filter((t) => t.id !== currTexture.id);

		// null if deleted
		if (newTexture) {
			newTextures.push(newTexture);
		}

		setTextures(newTextures.sort(sortByName));
		closeModal();
	};

	if (isLoading) return null;

	return (
		<Stack gap="sm">
			<Modal
				forceFullScreen
				opened={modalOpened}
				onClose={() => handleModalClose(textureModal!)}
				title={textureModal?.name}
			>
				<TextureModal texture={textureModal!} textures={textures} />
			</Modal>

			<Stack gap={0}>
				<Group justify="space-between">
					<Text size="md" fw={700}>Textures</Text>
					<Badge color="teal" variant="filled">
						{search === '' ? textures.length : `${texturesFiltered} / ${textures.length}`}
					</Badge>
				</Group>
				<Text c="dimmed" size="sm">
					On this page you can view and manage all textures.
				</Text>
			</Stack>

			<PaginatedList
				items={textures}

				onUpdate={({ search, searchResults, itemsPerRow, containerRef }) => {
					setTexturesFiltered(searchResults);
					setSearch(search);
					setItemsPerRow(itemsPerRow);
					setRef(containerRef);
				}}

				renderItem={(texture) => (
					<GalleryTexture
						key={texture.id}
						texture={texture}
						rowItemsGap={10}
						rowItemsLength={itemsPerRow}
						container={texturesGroupRef}

						className="cursor-pointer"
						onClick={() => handleModalOpen(texture)}
					/>
				)}
			/>
		</Stack>
	);
}
