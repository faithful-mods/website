import { Stack, Tabs } from '@mantine/core';
import { Texture } from '@prisma/client';
import { useState } from 'react';

import { TextureImage } from '~/components/texture-img';
import { MCMETA } from '~/types';

import { TextureGeneral } from './texture-general';
import { TextureMCMETA } from './texture-mcmeta';
import { TextureRelations } from './texture-relations';
import { TextureUses } from './texture-uses';

export interface TextureModalProps {
	texture: Texture;
	textures: Texture[];
}

export function TextureModal({ texture, textures }: TextureModalProps) {
	const [mcmeta, setMCMETA] = useState<MCMETA | undefined>(texture.mcmeta as unknown as MCMETA);

	return (
		<Stack>
			<TextureImage
				src={texture.filepath}
				alt={texture.name}
				size={256}
				style={{ margin: 'auto' }}
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
					<TextureMCMETA texture={texture} onUpdate={setMCMETA} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
