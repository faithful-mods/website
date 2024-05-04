import { Image, Stack, Tabs } from '@mantine/core';
import { Texture } from '@prisma/client';

import { TextureGeneral } from './texture-general';
import { TextureUses } from './texture-uses';

export interface TextureModalProps {
	texture: Texture;
	onClose: (t: Texture) => void;
}

export function TextureModal({ texture, onClose }: TextureModalProps) {
	return (
		<Stack>
			<Image
				className="image-pixelated"
				src={texture.filepath}
				fit='contain'
				alt=""
				style={{
					maxWidth: '256px',
					maxHeight: '256px',
					margin: '0 auto',
				}}
			/>
			<Tabs defaultValue="general">
				<Tabs.List>
					<Tabs.Tab value="general">
						General
					</Tabs.Tab>
					<Tabs.Tab value="uses">
						Uses
					</Tabs.Tab>
					<Tabs.Tab value="mcmeta" disabled>
						MCMETA
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="general">
					<TextureGeneral texture={texture} />
				</Tabs.Panel>
				<Tabs.Panel value="uses">
					<TextureUses texture={texture} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
