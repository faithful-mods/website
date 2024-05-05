'use client';

import { Stack, Card, Group, Divider, Code, Image, Text } from '@mantine/core';
import { LinkedTexture, Mod, ModVersion, Resource, Texture } from '@prisma/client';
import { useState } from 'react';
import { FaRegFolderOpen } from 'react-icons/fa';
import { LuFolderGit } from 'react-icons/lu';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { getLinkedTexturesFrom } from '~/server/data/linked-textures';
import { getModsFromIds } from '~/server/data/mods';
import { getModsVersionsFromResources } from '~/server/data/mods-version';
import { getResourceByIds } from '~/server/data/resource';

export interface TextureUsesProps {
	texture: Texture;
}

export function TextureUses({ texture }: TextureUsesProps) {
	const [linkedTextures, setLinkedTextures] = useState<LinkedTexture[]>([]);
	const [resources, setResources] = useState<Resource[]>([]);
	const [modsVersions, setModsVersions] = useState<(ModVersion & { resources: string[] })[]>([]);
	const [mods, setMods] = useState<Mod[]>([]);

	useEffectOnce(() => {
		getLinkedTexturesFrom(texture.id)
			.then((res) => {
				setLinkedTextures(res);
				getResourceByIds(res.map((lt) => lt.resourceId))
					.then((resources) => {
						setResources(resources);
						getModsVersionsFromResources(resources.map((r) => r.id))
							.then((modsVersions) => {
								setModsVersions(modsVersions);
								getModsFromIds(modsVersions.map((mv) => mv.modId))
									.then((mods) => {
										setMods(mods);
									});
							});
					});
			});
	});

	return (
		<Stack ml={0} gap="md" mt="md">
			{mods.map((mod) => (
				<Card key={mod.id} p={0} withBorder>
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
									<Text fw={300}>{mv.version}{mv.mcVersion !== 'unknown' && `(MC: ${mv.mcVersion})`}</Text>
								</Group>

								<Stack ml="xs" gap={0}>
									{resources.filter((r) => mv.resources.includes(r.id)).map((r) => (
										<Stack key={r.id} gap={5}>
											<Group gap="xs"><FaRegFolderOpen /><Text fw={100}>{r.assetFolder}</Text></Group>

											<Stack ml="sm" gap={2}>
												{linkedTextures.filter((lt) => lt.resourceId === r.id).map((lt) => (
													<Code key={lt.id}>{lt.assetPath}</Code>
												))}
											</Stack>
										</Stack>
									))}
								</Stack>
							</Stack>
						))}
					</Stack>

				</Card>
			))}
		</Stack>
	);
}
