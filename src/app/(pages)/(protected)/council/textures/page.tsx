'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { Badge, Group, Loader, Pagination, Select, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { Modal } from '~/components/modal';
import { GalleryTexture } from '~/components/texture';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { usePrevious } from '~/hooks/use-previous';
import { BREAKPOINT_MOBILE_LARGE, ITEMS_PER_PAGE, ITEMS_PER_ROW } from '~/lib/constants';
import { notify, searchFilter, sortByName } from '~/lib/utils';
import { getTexture, getTextures } from '~/server/data/texture';

import { TextureModal } from './modal/texture-modal';

import type { Texture } from '@prisma/client';

const CouncilTexturesPage = () => {
	const [isLoading, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const itemsPerRow = useMemo(() => ITEMS_PER_ROW, []);

	const [search, setSearch] = useState('');

	const [textures, setTextures] = useState<Texture[]>([]);
	const [texturesFiltered, setTexturesFiltered] = useState<Texture[]>([]);
	const [textureModal, setTextureModal] = useState<Texture>();

	const [texturesShown, setTexturesShown] = useState<Texture[][]>([[]]);
	const [activePage, setActivePage] = useState(1);
	const [texturesShownPerPage, setTexturesShownPerPage] = useState<string>('96');
	const [texturesShownPerRow, setTexturesShownPerRow] = useState<number>(12);

	const prevSearchedTextures = usePrevious(texturesFiltered);

	const texturesGroupRef = useRef<HTMLDivElement>(null);

	useEffectOnce(() => {
		startTransition(() => {
			getTextures()
				.then((res) => {
					const sorted = res.sort(sortByName);
					setTextures(sorted);
					setTexturesFiltered(sorted);
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	});

	useEffect(() => {
		startTransition(() => {
			const chunks: Texture[][] = [];
			const int = parseInt(texturesShownPerPage ?? itemsPerPage[0]);

			for (let i = 0; i < texturesFiltered.length; i += int) {
				chunks.push(texturesFiltered.slice(i, i + int));
			}

			if (!prevSearchedTextures || texturesFiltered.length !== prevSearchedTextures.length) {
				setActivePage(1);
			}

			setTexturesShown(chunks);
		});
	}, [texturesFiltered, texturesShownPerPage, prevSearchedTextures, activePage, itemsPerPage]);

	useEffect(() => {
		startTransition(() => {
			if (!search) {
				setTexturesFiltered(textures);
				return;
			}

			setTexturesFiltered(
				textures
					.filter(searchFilter(search))
					.sort(sortByName)
			);
		});
	}, [search, textures]);

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
		setSearch(search); // re-search

		closeModal();
	};

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
						{search === '' ? textures.length : `${texturesFiltered.length} / ${textures.length}`}
					</Badge>
				</Group>
				<Text c="dimmed" size="sm">
					On this page you can view and manage all textures.
				</Text>
			</Stack>

			<Group align="center" gap="sm" wrap="nowrap">
				<TextInput
					label="Search"
					placeholder="Search for a texture name..."
					w="100%"
					maw="calc(100% - var(--mantine-spacing-sm) - 240px)"
					onChange={(e) => setSearch(e.currentTarget.value)}
				/>
				<Select
					label="Textures per page"
					data={itemsPerPage}
					value={texturesShownPerPage}
					onChange={(e) => e ? setTexturesShownPerPage(e) : null}
					checkIconPosition="right"
					w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'calc(50% - var(--mantine-spacing-sm) / 2)' : 120}
				/>
				<Select
					label="Textures per row"
					data={itemsPerRow}
					value={texturesShownPerRow.toString()}
					onChange={(e) => e ? setTexturesShownPerRow(parseInt(e)) : null}
					checkIconPosition="right"
					w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'calc(50% - var(--mantine-spacing-sm) / 2)' : 120}
				/>
			</Group>

			<Group w="100%" gap={10} ref={texturesGroupRef} maw="1417">
				{isLoading && (
					<Group
						align="center"
						justify="center"
						h="100px"
						w="100%"
						gap="md"
						style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
					>
						<Loader color="blue" mt={5} />
					</Group>
				)}

				{!isLoading && search !== '' && texturesFiltered.length === 0 && (
					<Group
						align="center"
						justify="center"
						h="100px"
						w="100%"
						gap="md"
						style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
					>
						<Text c="dimmed">No results for &quot;{search}&quot;</Text>
					</Group>
				)}

				{!isLoading && texturesShown[activePage - 1] && texturesShown[activePage - 1]?.map((t) => (
					<GalleryTexture
						key={t.id}
						texture={t}
						rowItemsGap={10}
						rowItemsLength={texturesShownPerRow}
						container={texturesGroupRef}

						className="cursor-pointer"
						onClick={() => handleModalOpen(t)}
					/>
				))}
			</Group>

			{!isLoading && (
				<Group mt="md" justify="center">
					<Pagination total={texturesShown.length} value={activePage} onChange={setActivePage} />
				</Group>
			)}
		</Stack>
	);
};

export default CouncilTexturesPage;

// <Group
// 	key={t.id}
// 	align="start"
// 	gap="sm"
// 	wrap="nowrap"
// 	style={{
// 		position: 'relative',
// 		'--item-per-row': itemsPerRow,
// 	}}
// >
// 	<TextureImage
// 		className="cursor-pointer"
// 		src={t.filepath ?? '/icon.png'}
// 		alt={t.name}
// 		mcmeta={t.mcmeta}
// 		size={90}
// 	/>
// 	<Stack
// 		gap="0"
// 		align="flex-start"
// 		mt="sm"
// 		pr="sm"
// 		style={{
// 			overflow: 'hidden',
// 		}}
// 	>
// 		<Text size="sm" fw={700}>{t.name}</Text>
// 		<Text size="xs" lineClamp={2}>{t.aliases.join(', ')}</Text>
// 	</Stack>
