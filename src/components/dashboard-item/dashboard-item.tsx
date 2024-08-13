
import { Group, Image, Stack, Text } from '@mantine/core';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_DESKTOP_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

import { Tile } from '../tile';
import { WarningIcon } from '../warning-icon';

import './dashboard.scss';

export interface ItemDisplayProps {
	image?: string | null,
	title: string,
	description?: string | null,
	warning?: boolean,
	onClick: () => void
}

export function DashboardItem({ image, title, description, onClick, warning }: ItemDisplayProps) {
	const [windowWidth] = useDeviceSize();

	return (
		<Tile
			p={0}
			className='dashboard-item'
			style={{
				'--dashboard-item-count': windowWidth <= BREAKPOINT_MOBILE_LARGE
					? 1
					: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
						? 2
						: windowWidth <= BREAKPOINT_DESKTOP_LARGE
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
				<Image
					radius="sm"
					className="cursor-pointer solid-background"
					src={image ?? '/icon.png'}
					alt=""
					width={90}
					height={90}
					fit="contain"
					style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }}
				/>
				<Stack gap="0" align="flex-start" mt="sm" pr="sm">
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
}
