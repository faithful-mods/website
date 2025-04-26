'use client';

import { useEffect, useState, useTransition } from 'react';
import type { RefObject } from 'react';

import { GoAlert, GoHash, GoLog } from 'react-icons/go';
import { PiApproximateEquals } from 'react-icons/pi';

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

	const [showFullHash, setShowFullHash] = useState(false);
	const [fullHash, setFullHash] = useState<string>('');
	const [hash, setHash] = useState<string | null>(null);

	useEffect(() => {
		if (showFullHash) setHash(fullHash);
		else setHash(fullHash.slice(0, 8) + '...' + fullHash.slice(-8));
	}, [fullHash, showFullHash]);

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

						onMouseEnter={() => {
							setFullHash(texture.hash);
							setShowFullHash(false);
						}}

						tiles={[
							{
								shown: !!texture.vanillaTextureId,
								icon: <GoAlert color="orange" />,
								description: `Vanilla texture : ${texture.vanillaTextureId}`,
							},
							{
								shown: true,
								icon: <GoHash />,
								description: `ID: ${texture.id}`,
							},
							{
								shown: true,
								icon: <GoLog />,
								description: `${hash}`,
								descriptionHoverAction: () => setShowFullHash(!showFullHash),
							},
							{
								shown: texture.aliases.length > 0,
								icon: <PiApproximateEquals />,
								description: texture.aliases.join(', '),
							},
						]}
					/>
				)}
			/>
		</Stack>
	);
}
