
import type { FC } from 'react';

import { Group, Stack, Text } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { Texture } from 'react-minecraft';

import { BREAKPOINT_DESKTOP_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

import { Tile } from '../base/tile';
import { WarningIcon } from '../warning-icon';

import './dashboard.scss';

interface Props {
	image?: string | null,
	title: string,
	description?: string | null,
	warning?: boolean,
	onClick: () => void
}

export const DashboardItem: FC<Props> = ({ image, title, description, onClick, warning }) => {
	const { width } = useViewportSize();

	return (
		<Tile
			p={0}
			className='dashboard-item'
			style={{
				'--dashboard-item-count': width <= BREAKPOINT_MOBILE_LARGE
					? 1
					: width <= BREAKPOINT_DESKTOP_MEDIUM
						? 2
						: width <= BREAKPOINT_DESKTOP_LARGE
							? 3
							: 4,
			}}
		>
			<Group
				onClick={onClick}
				align="start"
				gap="sm"
				wrap="nowrap"
				className="cursor-pointer"
				style={{
					position: 'relative',
				}}
			>
				<Texture
					className="solid-background"
					src={image ?? '/icon.png'}
					size={90}
				/>

				<Stack gap="0" align="flex-start" mt="sm" pr="sm" w="calc(100% - var(--mantine-spacing-sm) - 90px)">
					<Text size="sm" fw={700}>{title}</Text>
					<Text size="xs" lineClamp={2}>{description?.trim() ?? 'No description'}</Text>
				</Stack>

				{warning && (
					<WarningIcon
						style={{
							position:'absolute',
							top: 'calc(var(--mantine-spacing-sm) / 2)',
							left: 'calc(var(--mantine-spacing-sm) / 2)',
						}}
					/>
				)}

			</Group>
		</Tile>
	);
};
