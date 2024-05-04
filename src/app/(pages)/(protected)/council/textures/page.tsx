'use client';

import { Badge, Card, Code, Group, Image, Modal, Pagination, Select, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Texture } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';

import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_TABLET } from '~/lib/constants';
import { getTexture, getTextures } from '~/server/data/texture';

import { TextureModal } from './modal/texture-modal';

import './page.scss';

const CouncilTexturesPage = () => {
	const [windowWidth, _] = useDeviceSize();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const itemsPerPage = useMemo(() => ['25', '50', '100', '250'], []);
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
				const sorted = res.sort((a, b) => a.name.localeCompare(b.name));
				setTextures(sorted);
				setSearchedTextures(sorted);
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

		setSearchedTextures(textures.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()))));
	}, [search, textures]);

	const openTextureModal = (t: Texture) => {
		if (!t) return;

		setTextureModal(t);
		openModal();
	};

	const closeTextureModal = async (currTexture: Texture) => {
		const newTexture = await getTexture(currTexture.id);
		const newTextures = textures.filter((t) => t.id !== currTexture.id);

		// null if deleted
		if (newTexture) {
			newTextures.push(newTexture);
		}

		setTextures(newTextures);
		setSearch(search); // re-search

		closeModal();
	};

	return (
		<>
			<Modal
				size="100%"
				opened={modalOpened}
				onClose={() => closeTextureModal(textureModal!)}
				title={<Code>{textureModal?.name}</Code>}
			>
				<TextureModal texture={textureModal!} onClose={closeTextureModal} />
			</Modal>

			<Card withBorder shadow="sm" radius="md" padding="md">
				<Group justify="space-between">
					<Text size="md" fw={700}>Textures</Text>
					<Badge color="teal" variant="filled">{searchedTextures.length ?? '?'} / {textures.length ?? '?'}</Badge>
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
							onClick={() => openTextureModal(t)}
							style={{
								position: 'relative',
								'--item-per-row': itemsPerRow,
							}}
						>
							<Image
								radius="sm"
								className="cursor-pointer image-background image-pixelated"
								src={t.filepath ?? '/icon.png'}
								alt=""
								width={90}
								height={90}
								fit="contain"
								style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }}
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
