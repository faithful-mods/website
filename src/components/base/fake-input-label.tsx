import type { FC } from 'react';

import { Stack, Text } from '@mantine/core';

interface Props {
	children: React.ReactNode;
	label: string;
	description?: string;
	gap?: number | string;
}

export const FakeInputLabel: FC<Props> = ({ gap, label, description, children }) => {
	return (
		<Stack gap={0} mt={2}>
			<Stack gap={0}>
				<Text
					lh="var(--mantine-line-height)"
					size="var(--mantine-font-size-sm)"
					fw={500}
				>
					{label}
				</Text>
				<Text
					lh={1.2}
					size="var(--input-description-size, calc(var(--mantine-font-size-sm) - calc(.125rem * var(--mantine-scale))))"
					c="dimmed"
				>
					{description}
				</Text>
			</Stack>

			<div
				style={{
					marginTop: gap ? gap : description ? 'calc(var(--mantine-spacing-xs) / 2)' : 1,
				}}
			>
				{children}
			</div>
		</Stack>
	);
};
