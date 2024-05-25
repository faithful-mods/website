import { Card, CardProps, PolymorphicComponentProps } from '@mantine/core';

export function Tile({ children, ...props }: PolymorphicComponentProps<'div', CardProps>) {
	return (
		<Card
			withBorder
			shadow="sm"
			radius="md"
			padding="md"
			{...props}
		>
			{children}
		</Card>
	);
}
