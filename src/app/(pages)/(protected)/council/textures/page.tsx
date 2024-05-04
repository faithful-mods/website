'use client';

import { Badge, Card, Code, Group, Image, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { Texture } from '@prisma/client';
import { useState } from 'react';

import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_TABLET } from '~/lib/constants';
import { getTextures } from '~/server/data/texture';

import { TextureModal } from './modal/texture-modal';

import './page.scss';

const CouncilTexturesPage = () => {
	const [windowWidth, _] = useDeviceSize();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [textures, setTextures] = useState<[Texture[], Texture[]]>([[], []]);
	const [textureModal, setTextureModal] = useState<Texture>();

	useEffectOnce(() => {
		getTextures()
			.then((res) => {
				const sorted = res.sort((a, b) => a.name.localeCompare(b.name));
				setTextures([sorted, sorted]);
			});
	});

	const form = useForm<{ search: string }>({
		initialValues: {
			search: '',
		},
	});

	const itemPerRow =  windowWidth <= BREAKPOINT_MOBILE_LARGE
		? 1
		: windowWidth <= BREAKPOINT_TABLET
			? 2
			: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
				? 3
				: 4;

	const handleSearch = (search: string) => {
		if (!search || search.length === 0) {
			setTextures([textures[0], textures[0]]);
			return;
		}

		const filtered = textures[0].filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase())));
		setTextures([textures[0], filtered]);
	};

	const openTextureModal = (t: Texture) => {
		if (!t) return;

		setTextureModal(t);
		openModal();
	};

	const closeTextureModal = (t: Texture) => {};

	return (
		<>
			<Modal
				size="100%"
				opened={modalOpened}
				onClose={closeModal}
				title={<Code>{textureModal?.name}</Code>}
			>
				<TextureModal texture={textureModal!} onClose={closeTextureModal} />
			</Modal>

			<Card withBorder shadow="sm" radius="md" padding="md">
				<Group justify="space-between">
					<Text size="md" fw={700}>Textures</Text>
					<Badge color="teal" variant="filled">{textures[1].length ?? '?'} / {textures[0].length ?? '?'}</Badge>
				</Group>
				<Group align="center" mt="md" mb="md" gap="sm" wrap="nowrap">
					<TextInput
						className="w-full"
						placeholder="Search textures..."
						onKeyUp={() => handleSearch(form.values.search)}
						{...form.getInputProps('search')}
					/>
				</Group>
				<Group wrap="wrap">
					{textures[1].map((t) => (
						<Group
							key={t.id}
							align="start"
							gap="sm"
							wrap="nowrap"
							className="texture-item cursor-pointer"
							onClick={() => openTextureModal(t)}
							style={{
								position: 'relative',
								'--item-per-row': itemPerRow,
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
			</Card>
		</>
	);
};

export default CouncilTexturesPage;
