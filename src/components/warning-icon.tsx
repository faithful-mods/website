import { TiWarning } from 'react-icons/ti';

import { Button } from '@mantine/core';

import { gradientDanger } from '~/lib/utils';

import type { MantineStyleProp } from '@mantine/core';

export function WarningIcon({ style }: { style?: MantineStyleProp }) {
	return (
		<Button
			color={gradientDanger.from}
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
