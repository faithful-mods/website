
import { useState } from 'react';

import { Stack, Tabs } from '@mantine/core';

import { TextureImage } from '~/components/textures/texture-img';

import { TextureGeneral } from './texture-general';
import { TextureMCMETAEdition } from './texture-mcmeta';
import { TextureRelations } from './texture-relations';
import { TextureUses } from './texture-uses';

import type{ Texture } from '@prisma/client';
import type { TextureMCMETA } from '~/types';

export interface TextureModalProps {
	texture: Texture;
	textures: Texture[];
}

export function TextureModal({ texture, textures }: TextureModalProps) {
	const [mcmeta, setMCMETA] = useState<TextureMCMETA | null>(texture.mcmeta);

	return (
		<Stack>
			<TextureImage
				src={texture.filepath}
				alt={texture.name}
				size={256}
				styles={{ margin: 'auto' }}
				mcmeta={mcmeta}
			/>
			<Tabs defaultValue="general">
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
						MCMETA
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
					<TextureMCMETAEdition texture={texture} onUpdate={setMCMETA} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
