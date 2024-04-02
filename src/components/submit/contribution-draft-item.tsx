
import { Button, Card, Group, Image, Stack, Text } from '@mantine/core';
import { Texture } from '@prisma/client';
import { useState } from 'react';
import { FaEdit, FaFileAlt } from 'react-icons/fa';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_DESKTOP_LARGE } from '~/lib/constants';
import { gradient, gradientDanger } from '~/lib/utils';
import { ContributionWithCoAuthors } from '~/types';

import './submit.scss';

export function ContributionDraftItem({ contribution, openModal }: { contribution: ContributionWithCoAuthors, openModal: (c: ContributionWithCoAuthors) => void }) {
	const [_contribution, setContribution] = useState<ContributionWithCoAuthors>(contribution);
	const [windowWidth, _] = useDeviceSize();

	return (
		<Card 
			withBorder 
			shadow="0"
			className="contribution-item"
			style={{ 
				'position': 'relative', 
				'--contribution-item-count': windowWidth <= BREAKPOINT_MOBILE_LARGE 
					? 1 
					: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
						? 2
						: windowWidth <= BREAKPOINT_DESKTOP_LARGE
							? 3
							: 4
			}}
		>
			<Button
				variant="light"
				className="navbar-icon-fix"
				onClick={() => openModal(_contribution)}
				color={gradient.to}
				style={{ position: 'absolute', top: 'var(--mantine-spacing-md)', right: 'var(--mantine-spacing-md)' }}
			>
				<FaEdit />
			</Button>
			<Group gap="sm">
				{_contribution.filename.endsWith('.png') && 
					<Image
						radius="sm"
						className="image-background image-pixelated"
						src={_contribution.file}
						alt=""
						width={90}
						height={90}
						fit="contain"
						style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }} 
					/>
				}
				{
					(_contribution.filename.endsWith('.json') || _contribution.filename.endsWith('.mcmeta')) &&
					<FaFileAlt 
						style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }} 
					/>
				}
				<Stack gap="0" align="flex-start" pr="sm">
					<Text size="sm" fw={700}>{_contribution.filename}</Text>
					<Text size="xs">Resolution : {_contribution.resolution}</Text>
					<Text size="xs">Creation : {_contribution.createdAt.toLocaleString()}</Text>
					<Text size="xs">Co-authors : {_contribution.coAuthors.length === 0 ? 'None' : _contribution.coAuthors.map((ca) => ca.name).join(', ')}</Text>
				</Stack>
			</Group>
			<Group justify="flex-end" mt="sm">
				<Button
					variant="gradient"
					gradient={gradientDanger}
				>
					Delete
				</Button>
				<Button
					variant={_contribution.textureId === null ? 'gradient' : 'filled'}
					className={_contribution.textureId === null ? 'button-disabled-with-bg' : ''}
					color={gradient.to}
					gradient={gradient}
					disabled={_contribution.textureId === null}
				>
					Submit
				</Button>
			</Group>
		</Card>
	);
}