import { TiWarning } from 'react-icons/ti';

import { Button } from '@mantine/core';

import type { MantineStyleProp } from '@mantine/core';

export function WarningIcon({ style }: { style?: MantineStyleProp }) {
	return (
		<Button
			color="red"
			w={20}
			h={20}
			p={0}
			className="cursor-clickable"
			style={style}
		>
			<TiWarning />
		</Button>
	);
}
