import { Image, Text, Stack } from '@mantine/core';

export default async function HomePage() {
	return (
		<Stack mah="calc(100% - 120px)" gap="0" h="100%">
			<Stack align="center" justify="center" gap="sm" h="100%">
				<Image src="/icon.png" alt="FM" h={64} w={64} />
				<Stack gap={0}>
					<Text className="w-full" ta="center">Faithful Mods</Text>
					<Text size="sm" className="w-full" ta="center">x32&nbsp;•&nbsp;x64</Text>
				</Stack>
			</Stack>

			<Stack align="center" className="w-full" h={60} gap={5}>
				<Text fw={300} size="xl" className="w-full" ta="center">🚧 Website under construction 🚧</Text>
				<Text fw={300} size="l" className="w-full" ta="center">Help us on GitHub: <a href="https://github.com/faithful-mods/website" target="_blank">https://github.com/faithful-mods/website</a></Text>
			</Stack>
		</Stack>
	);
}
