import { Stack, Text, Title } from '@mantine/core';

export default async function Home() {
	return (
		<Stack 
			align="center" 
			justify="center" 
			gap="md"
			style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
		>
			<Title>404</Title>
			<Text size="lg">Page Not Found</Text>
		</Stack>
	)
}
