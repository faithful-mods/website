
import { useState } from 'react';

import { Group, Stack, Tabs, Text } from '@mantine/core';

import { TextureImage } from '~/components/textures/texture-img';

import { TextureGeneral } from './texture-general';
import { TextureMCMetaEdition } from './texture-mcmeta';
import { TextureRelations } from './texture-relations';
import { TextureUses } from './texture-uses';

import type{ Texture } from '@prisma/client';
import type { TextureMCMeta } from 'react-minecraft';

export interface TextureModalProps {
	texture: Texture;
	textures: Texture[];
}

export function TextureModal({ texture, textures }: TextureModalProps) {
	const [mcmeta, setMCMETA] = useState<TextureMCMeta | null>(texture.mcmeta);

	return (
		<Group
			h="calc(100vh - 90px)"
			gap="md"
			align="start"
			wrap="nowrap"
		>
			<Stack>
				<TextureImage
					src={texture.filepath}
					alt={texture.name}
					isTiled={texture.name.includes('flow')}
					size={512}
					styles={{ margin: 'auto' }}
					mcmeta={mcmeta}
				/>
				<Text size="xs" mx="auto" ff="monospace">{texture.hash}</Text>
			</Stack>
			<Tabs defaultValue="general" w="100%">
				<Tabs.List>
					<Tabs.Tab value="general">
						General
					</Tabs.Tab>
					<Tabs.Tab value="uses">
						Uses
					</Tabs.Tab>
					<Tabs.Tab value="relations">
						Relations
					</Tabs.Tab>
					<Tabs.Tab value="mcmeta">
						Animation
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="general">
					<TextureGeneral texture={texture} />
				</Tabs.Panel>
				<Tabs.Panel value="relations">
					<TextureRelations texture={texture} textures={textures} />
				</Tabs.Panel>
				<Tabs.Panel value="uses">
					<TextureUses texture={texture} />
				</Tabs.Panel>
				<Tabs.Panel value="mcmeta">
					<TextureMCMetaEdition texture={texture} onUpdate={setMCMETA} />
				</Tabs.Panel>
			</Tabs>
		</Group>
	);
}
