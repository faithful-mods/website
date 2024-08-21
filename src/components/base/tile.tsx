import type { FC } from 'react';

import { Card } from '@mantine/core';

import type { CardProps, MantineColor, PolymorphicComponentProps } from '@mantine/core';

interface Props {
	shadowless?: boolean;
	transparent?: boolean;
	color?: MantineColor;
}

export const Tile: FC<PolymorphicComponentProps<'div', CardProps> & Props> = ({
	children,
	shadowless,
	transparent,
	color,
	...props
}) => {
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
};
