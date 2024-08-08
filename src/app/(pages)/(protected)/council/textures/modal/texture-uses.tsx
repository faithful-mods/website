'use client';

import { useState } from 'react';

import { FaRegFolderOpen } from 'react-icons/fa';
import { LuFolderGit } from 'react-icons/lu';
import { TbHttpDelete } from 'react-icons/tb';

import { Stack, Group, Divider, Code, Image, Text, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { Modal } from '~/components/modal';
import { Tile } from '~/components/tile';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { extractSemver, gradient, gradientDanger } from '~/lib/utils';
import { deleteLinkedTexture, getLinkedTexturesFrom } from '~/server/data/linked-textures';
import { getModsFromIds } from '~/server/data/mods';
import { getModsVersionsFromResources } from '~/server/data/mods-version';
import { getResourceByIds } from '~/server/data/resource';

import { TextureUsesLinkedPopup } from './texture-use-linked-popup';

import type { LinkedTexture, Mod, ModVersion, Resource, Texture } from '@prisma/client';

export interface TextureUsesProps {
	texture: Texture;
}

export function TextureUses({ texture }: TextureUsesProps) {
	const [linkedTextures, setLinkedTextures] = useState<LinkedTexture[]>([]);
	const [resources, setResources] = useState<Resource[]>([]);
	const [modsVersions, setModsVersions] = useState<(ModVersion & { resources: string[] })[]>([]);
	const [mods, setMods] = useState<Mod[]>([]);
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const init = async () => {
		const linkedTextures = await getLinkedTexturesFrom(texture.id);
		setLinkedTextures(linkedTextures);

		const resources = await getResourceByIds(linkedTextures.map((lt) => lt.resourceId));
		setResources(resources);

		const modsVersions = await getModsVersionsFromResources(resources.map((r) => r.id));
		setModsVersions(modsVersions);

		const mods = await getModsFromIds(modsVersions.map((mv) => mv.modId));
		setMods(mods);
	};

	const handleLinkedTextureDelete = async (id: string) => {
		await deleteLinkedTexture(id);
		init();
	};

	useEffectOnce(() => {
		init();
	});

	return (
		<Stack ml={0} gap="md" mt="md">
			<Modal
				opened={modalOpened}
				onClose={() => closeModal()}
				title="Add a Linked Texture to this Texture"
			>
				<TextureUsesLinkedPopup
					textureId={texture.id}
					onUpdate={() => {
						init();
						closeModal();
					}}
				/>
			</Modal>
			{mods.map((mod) => (
				<Tile key={mod.id} p={0}>
					<Group gap="xs" m="xs">
						<Image src={mod.image ?? '/icon.png'} alt="" width={16} height={16} />
						<Text fw={500}>{mod.name}</Text>
					</Group>

					<Divider />

					<Stack m="xs" gap="sm">
						{modsVersions.filter((mv) => mv.modId === mod.id).map((mv) => (
							<Stack key={mv.id} gap={0} >
								<Group gap="xs">
									<LuFolderGit />
									<Text fw={300}>{mv.version}&nbsp;{!mv.mcVersion.some((v) => extractSemver(v) === null) && mv.mcVersion.length > 0 && `(MC: ${mv.mcVersion.join(', ')})`}</Text>
								</Group>

								<Stack ml="xs" gap={0}>
									{resources.filter((r) => mv.resources.includes(r.id)).map((r) => (
										<Stack key={r.id} gap={5}>
											<Group gap="xs"><FaRegFolderOpen /><Text fw={100}>{r.assetFolder}</Text></Group>

											<Stack ml="sm" gap={2}>
												{linkedTextures.filter((lt) => lt.resourceId === r.id).map((lt) => (
													<Group key={lt.id} gap={2} wrap="nowrap">
														<Code className="w-full">{lt.assetPath}</Code>
														<Button
															p={0}
															w={32}
															h={22}
															disabled={linkedTextures.length === 1}
															gradient={gradientDanger}
															variant="gradient"
															onClick={() => {
																handleLinkedTextureDelete(lt.id);
															}}
														>
															<TbHttpDelete
																className="navbar-icon-fix"
																style={{
																	// @ts-expect-error
																	'--size': '24px',
																}}
															/>
														</Button>
													</Group>
												))}
											</Stack>
										</Stack>
									))}
								</Stack>
							</Stack>
						))}
					</Stack>
				</Tile>
			))}
			<Button
				variant="gradient"
				gradient={gradient}
				onClick={() => openModal()}
			>
				Add a linked Texture
			</Button>
		</Stack>
	);
}
