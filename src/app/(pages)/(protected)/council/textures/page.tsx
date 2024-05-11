'use client';

import { Badge, Card, Group, Pagination, Select, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Texture } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';

import { Modal } from '~/components/modal';
import { TextureImage } from '~/components/texture-img';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_TABLET, ITEMS_PER_PAGE } from '~/lib/constants';
import { notify, searchFilter, sortByName } from '~/lib/utils';
import { getTexture, getTextures } from '~/server/data/texture';

import { TextureModal } from './modal/texture-modal';

import './page.scss';

const CouncilTexturesPage = () => {
	const [windowWidth, _] = useDeviceSize();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const itemsPerRow =  windowWidth <= BREAKPOINT_MOBILE_LARGE
		? 1
		: windowWidth <= BREAKPOINT_TABLET
			? 2
			: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
				? 3
				: 4;

	const [search, setSearch] = useState('');

	const [textures, setTextures] = useState<Texture[]>([]);
	const [searchedTextures, setSearchedTextures] = useState<Texture[]>([]);
	const [textureModal, setTextureModal] = useState<Texture>();

	const [texturesShown, setTexturesShown] = useState<Texture[][]>([[]]);
	const [activePage, setActivePage] = useState(1);
	const [texturesShownPerPage, setTexturesShowPerPage] = useState<string | null>(itemsPerPage[0]);

	useEffectOnce(() => {
		getTextures()
			.then((res) => {
				const sorted = res.sort(sortByName);
				setTextures(sorted);
				setSearchedTextures(sorted);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	useEffect(() => {
		const chunks: Texture[][] = [];
		const int = parseInt(texturesShownPerPage ?? itemsPerPage[0]);

		for (let i = 0; i < searchedTextures.length; i += int) {
			chunks.push(searchedTextures.slice(i, i + int));
		}

		setActivePage(1);
		setTexturesShown(chunks);

	}, [searchedTextures, texturesShownPerPage, itemsPerPage]);

	useEffect(() => {
		if (!search) {
			setSearchedTextures(textures);
			return;
		}

		setSearchedTextures(
			textures
				.filter(searchFilter(search))
				.sort(sortByName)
		);
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
		<>
			<Modal
				opened={modalOpened}
				onClose={() => handleModalClose(textureModal!)}
				title={textureModal?.name}
			>
				<TextureModal texture={textureModal!} textures={textures} />
			</Modal>

			<Card withBorder shadow="sm" radius="md" padding="md">
				<Group justify="space-between">
					<Text size="md" fw={700}>Textures</Text>
					<Badge color="teal" variant="filled">
						{search === '' ? textures.length : `${searchedTextures.length} / ${textures.length}`}
					</Badge>
				</Group>
				<Group align="center" mt="md" mb="md" gap="sm" wrap="nowrap">
					<TextInput
						className="w-full"
						placeholder="Search textures..."
						onChange={(e) => setSearch(e.currentTarget.value)}
					/>
					<Select
						data={itemsPerPage}
						value={texturesShownPerPage}
						onChange={setTexturesShowPerPage}
						withCheckIcon={false}
						w={120}
					/>
				</Group>
				<Group wrap="wrap">
					{texturesShown[activePage - 1] && texturesShown[activePage - 1].map((t) => (
						<Group
							key={t.id}
							align="start"
							gap="sm"
							wrap="nowrap"
							className="texture-item cursor-pointer"
							onClick={() => handleModalOpen(t)}
							style={{
								position: 'relative',
								'--item-per-row': itemsPerRow,
							}}
						>
							<TextureImage
								className="cursor-pointer"
								src={t.filepath ?? '/icon.png'}
								alt={t.name}
								size={90}
							/>
							<Stack gap="0" align="flex-start" mt="sm" pr="sm">
								<Text size="sm" fw={700}>{t.name}</Text>
								<Text size="xs" lineClamp={2}>{t.aliases.join(', ')}</Text>
							</Stack>
						</Group>
					))}
				</Group>

				<Group mt="md" justify="center">
					<Pagination total={texturesShown.length} value={activePage} onChange={setActivePage} />
				</Group>
			</Card>
		</>
	);
};

export default CouncilTexturesPage;
