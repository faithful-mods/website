import { Stack, Text, Title } from '@mantine/core';

export default async function NotFoundPage() {
	return (
		<Stack
			align="center"
			justify="center"
			gap="md"
			style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
		>
			<Title>404&nbsp;<Text component="span" fw={300} inherit>Page Not Found</Text></Title>
			<Text size="lg">The page you are looking for does not exist</Text>
		</Stack>
	);
}
