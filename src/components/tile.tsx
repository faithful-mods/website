import { Card } from '@mantine/core';

import type { CardProps, PolymorphicComponentProps } from '@mantine/core';

interface TileProps {
	shadowless?: boolean;
	transparent?: boolean;
}

export function Tile({ children, shadowless, transparent, ...props }: PolymorphicComponentProps<'div', CardProps> & TileProps) {
	return (
		<Card
			shadow={!shadowless ? 'sm' : 'none'}
			radius="md"
			padding="md"
			{...props}
			className={transparent ? `transparent ${props.className}` : props.className}
		>
			{children}
		</Card>
	);
}
