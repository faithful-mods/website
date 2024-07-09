import { Card, CardProps, PolymorphicComponentProps } from '@mantine/core';

interface TileProps {
	shadowless?: boolean;
}

export function Tile({ children, shadowless, ...props }: PolymorphicComponentProps<'div', CardProps> & TileProps) {
	return (
		<Card
			withBorder
			shadow={!shadowless ? 'sm' : 'none'}
			radius="md"
			padding="md"
			{...props}
		>
			{children}
		</Card>
	);
}
