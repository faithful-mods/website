
import { Button, Card, Group, Image, Stack, Text } from '@mantine/core';
import { Texture } from '@prisma/client';
import { useState, useTransition } from 'react';
import { FaEdit, FaFileAlt } from 'react-icons/fa';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_DESKTOP_LARGE } from '~/lib/constants';
import { gradient, gradientDanger } from '~/lib/utils';
import { deleteContribution } from '~/server/data/contributions';
import type { ContributionWithCoAuthors } from '~/types';

import './submit.scss';

export interface ContributionDraftItemProps {
	contribution: ContributionWithCoAuthors;
	openModal: (c: ContributionWithCoAuthors) => void;
	onDelete: () => void;
}

export function ContributionDraftItem({ contribution, openModal, onDelete }: ContributionDraftItemProps) {
	const [isPending, startTransition] = useTransition();
	const [windowWidth, _] = useDeviceSize();

	const deleteFn = () => {
		if (contribution === undefined) return;

		startTransition(() => {
			deleteContribution(contribution.id);
			onDelete();
		})
	}

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
				onClick={() => openModal(contribution)}
				color={gradient.to}
				style={{ position: 'absolute', top: 'var(--mantine-spacing-md)', right: 'var(--mantine-spacing-md)' }}
			>
				<FaEdit />
			</Button>
			<Group gap="sm">
				{contribution.filename.endsWith('.png') && 
					<Image
						radius="sm"
						className="image-background image-pixelated"
						src={contribution.file}
						alt=""
						width={90}
						height={90}
						fit="contain"
						style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }} 
					/>
				}
				{
					(contribution.filename.endsWith('.json') || contribution.filename.endsWith('.mcmeta')) &&
					<FaFileAlt 
						style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }} 
					/>
				}
				<Stack gap="0" align="flex-start" pr="sm">
					<Text size="sm" fw={700}>{contribution.filename}</Text>
					<Text size="xs">Resolution : {contribution.resolution}</Text>
					<Text size="xs">Creation : {contribution.createdAt.toLocaleString()}</Text>
					<Text size="xs">Co-authors : {contribution.coAuthors.length === 0 ? 'None' : contribution.coAuthors.map((ca) => ca.name).join(', ')}</Text>
				</Stack>
			</Group>
			<Group justify="flex-end" mt="sm">
				<Button
					variant="gradient"
					gradient={gradientDanger}
					loading={isPending}
					onClick={() => deleteFn()}
				>
					Delete
				</Button>
				<Button
					variant={contribution.textureId === null ? 'gradient' : 'filled'}
					className={contribution.textureId === null ? 'button-disabled-with-bg' : ''}
					color={gradient.to}
					gradient={gradient}
					loading={isPending}
					disabled={contribution.textureId === null}
				>
					Submit
				</Button>
			</Group>
		</Card>
	);
}