import { Badge, Group, Image, Stack, Text } from '@mantine/core';
import { TiWarning } from 'react-icons/ti';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_DESKTOP_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import './dashboard.scss';
import { gradientDanger } from '~/lib/utils';

export interface ItemDisplayProps {
	image?: string | null,
	title: string,
	description?: string | null,
	warning?: string,
	onClick: () => void
}

export function DashboardItem({ image, title, description, onClick, warning }: ItemDisplayProps) {
	const [windowWidth, _] = useDeviceSize();

	return (
		<Group
			onClick={onClick}
			align="start"
			gap="sm"
			wrap="nowrap"
			className="cursor-pointer dashboard-item"
			style={{
				position: 'relative',
				'--dashboard-item-count': windowWidth <= BREAKPOINT_MOBILE_LARGE
					? 1
					: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
						? 2
						: windowWidth <= BREAKPOINT_DESKTOP_LARGE
							? 3
							: 4,
			}}
		>
			<Image
				radius="sm"
				className="cursor-pointer image-background"
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
				<Badge
					color={gradientDanger.from}
					size="xs"
					style={{
						position:'absolute',
						bottom: 'calc(var(--mantine-spacing-sm) / 2)',
						right: 'calc(var(--mantine-spacing-sm) / 2)',
					}}
					leftSection={<TiWarning />}
				>
					{warning}
				</Badge>
			)}

		</Group>
	);
}
