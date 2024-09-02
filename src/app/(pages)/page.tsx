'use client';

import { Stack } from '@mantine/core';
import { BlockModel } from 'react-minecraft';

export default function HomePage() {
	return (
		<Stack mah="calc(100% - 120px)" gap="0" h="100%">
			{/* <Stack align="center" justify="center" gap="sm" h="100%">
				<Image src="/icon.png" alt="FM" h={64} w={64} />
				<Stack gap={0}>
					<Text className="w-full" ta="center">Faithful Mods</Text>
					<Text size="sm" className="w-full" ta="center">x32&nbsp;•&nbsp;x64</Text>
				</Stack>
			</Stack> */}

			<BlockModel
				textures={{
					'#glass': {
						src: 'https://raw.githubusercontent.com/Faithful-Resource-Pack/Faithful-Java-32x/1.20.6/assets/minecraft/textures/block/glass.png',
					},
					'#obsidian': 'https://raw.githubusercontent.com/Faithful-Resource-Pack/Faithful-Java-32x/1.20.6/assets/minecraft/textures/block/obsidian.png',
					'#beacon': 'https://raw.githubusercontent.com/Faithful-Resource-Pack/Faithful-Java-32x/1.20.6/assets/minecraft/textures/block/beacon.png',
				}}

				model={{
					textures: {
						'glass': 'minecraft:block/glass',
						'obsidian': 'minecraft:block/obsidian',
						'beacon': 'block/beacon',
					},
					elements: [
						{
							from: [0, 0, 0],
							to: [16, 16, 16],
							faces: {
								north: { uv: [0, 0, 16, 16], texture: '#glass' },
								east: { uv: [0, 0, 16, 16], texture: '#glass' },
								south: { uv: [0, 0, 16, 16], texture: '#glass' },
								west: { uv: [0, 0, 16, 16], texture: '#glass' },
								up: { uv: [0, 0, 16, 16], texture: '#glass' },
								down: { uv: [0, 0, 16, 16], texture: '#glass' },
							},
						},
						// {
						// 	from: [2, 0.1, 2],
						// 	to: [14, 3, 14],
						// 	faces: {
						// 		north: { uv: [2, 13, 14, 16], texture: '#obsidian' },
						// 		east: { uv: [2, 13, 14, 16], texture: '#obsidian' },
						// 		south: { uv: [2, 13, 14, 16], texture: '#obsidian' },
						// 		west: { uv: [2, 13, 14, 16], texture: '#obsidian' },
						// 		up: { uv: [2, 2, 14, 14], texture: '#obsidian' },
						// 		down: { uv: [2, 2, 14, 14], texture: '#obsidian' },
						// 	},
						// },
						// {
						// 	from: [-16, -16, 0],
						// 	to: [0, 0, 16],
						// 	faces: {
						// 		north: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		east: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		south: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		west: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		up: { uv: [3, 3, 13, 13], texture: '#beacon' },
						// 		down: { uv: [3, 3, 13, 13], texture: '#beacon' },
						// 	},
						// },
						// {
						// 	from: [3, 3, 3],
						// 	to: [13, 14, 13],
						// 	faces: {
						// 		north: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		east: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		south: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		west: { uv: [3, 2, 13, 13], texture: '#beacon' },
						// 		up: { uv: [3, 3, 13, 13], texture: '#beacon' },
						// 		down: { uv: [3, 3, 13, 13], texture: '#beacon' },
						// 	},
						// },
					],
				}}

			/>

			{/* <Stack align="center" className="w-full" h={60} gap={5}>
				<Text fw={300} size="xl" className="w-full" ta="center">🚧 Website under construction 🚧</Text>
				<Text fw={300} size="l" className="w-full" ta="center">Help us on GitHub: <a href="https://github.com/faithful-mods/website" target="_blank">https://github.com/faithful-mods/website</a></Text>
			</Stack> */}
		</Stack>
	);
}
