import type { FC } from 'react';

import { Tile } from './tile';

import type { CardProps, PolymorphicComponentProps } from '@mantine/core';

export const SmallTile: FC<PolymorphicComponentProps<'div', CardProps>> = ({ children, style, ...props }) => {
	return (
		<Tile
			w="100%"
			mih={28}
			style={{
				padding: '5px 8px 6px 8px',
				borderRadius: 0,
				...style,
			}}
			{...props}
		>
			{children}
		</Tile>
	);
};
