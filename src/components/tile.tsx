import { Card } from '@mantine/core';

import type { CardProps, MantineColor, PolymorphicComponentProps } from '@mantine/core';

interface TileProps {
	shadowless?: boolean;
	transparent?: boolean;
	color?: MantineColor;
}

export function Tile({ children, shadowless, transparent, color, ...props }: PolymorphicComponentProps<'div', CardProps> & TileProps) {
	return (
		<Card
			shadow={!shadowless ? 'sm' : 'none'}
			radius="md"
			padding="md"
			{...props}
			className={transparent ? `transparent ${props.className}` : props.className}
			style={{
				backgroundColor: color ? `var(--mantine-color-${color}-filled)` : undefined,
				...props.style,
			}}
		>
			{children}
		</Card>
	);
}
