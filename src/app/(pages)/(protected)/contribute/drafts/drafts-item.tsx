
import { Button, Group, Image, Stack, Text } from '@mantine/core';
import { useTransition } from 'react';
import { FaEdit, FaFileAlt } from 'react-icons/fa';

import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_TABLET } from '~/lib/constants';
import { cn, gradient, gradientDanger } from '~/lib/utils';
import { deleteContributions, submitContribution } from '~/server/data/contributions';
import type { ContributionWithCoAuthors } from '~/types';

import '../submit.scss';

export interface ContributionDraftItemProps {
	contribution: ContributionWithCoAuthors;
	openModal: (c: ContributionWithCoAuthors) => void;
	onDelete: () => void;
}

export function ContributionDraftItem({ contribution, openModal, onDelete }: ContributionDraftItemProps) {
	const [isPending, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();

	const imgWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 60 : 90;
	const author = useCurrentUser()!;

	const deleteFn = () => {
		if (contribution === undefined) return;

		startTransition(() => {
			deleteContributions(author.id!, contribution.id);
			onDelete();
		});
	};

	const submit = () => {
		startTransition(() => {
			submitContribution(author.id!, contribution.id);
			onDelete();
		});
	};

	return (
		<Tile
			shadow="0"
			className="contribution-item"
			style={{
				'position': 'relative',
				'--contribution-item-count': windowWidth <= BREAKPOINT_MOBILE_LARGE
					? 1
					: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
						? 2
						: 3,
			}}
		>
			{windowWidth > BREAKPOINT_TABLET &&
				<Button
					variant="light"
					className="navbar-icon-fix"
					onClick={() => openModal(contribution)}
					color={gradient.to}
					style={{ position: 'absolute', top: 'var(--mantine-spacing-md)', right: 'var(--mantine-spacing-md)' }}
				>
					<FaEdit />
				</Button>
			}
			<Group gap="sm" wrap="nowrap">
				{contribution.filename.endsWith('.png') &&
					<Image
						radius="sm"
						className="image-background image-pixelated"
						src={contribution.file}
						alt=""
						width={imgWidth}
						height={imgWidth}
						fit="contain"
						style={{ maxWidth: `${imgWidth}px`, maxHeight: `${imgWidth}px`, minWidth: `${imgWidth}px`, minHeight: `${imgWidth}px` }}
					/>
				}
				{
					(contribution.filename.endsWith('.json') || contribution.filename.endsWith('.mcmeta')) &&
					<FaFileAlt
						style={{ maxWidth: `${imgWidth}px`, maxHeight: `${imgWidth}px`, minWidth: `${imgWidth}px`, minHeight: `${imgWidth}px` }}
					/>
				}
				<Stack gap="0" align="flex-start" mt="0">
					<Text size="sm" fw={700}>{contribution.filename}</Text>
					<Text size="xs">Resolution : {contribution.resolution}</Text>
					<Text size="xs">Creation : {contribution.createdAt.toLocaleString()}</Text>
					<Text size="xs">Co-authors : {contribution.coAuthors.length === 0 ? 'None' : contribution.coAuthors.map((ca) => ca.name).join(', ')}</Text>
				</Stack>
			</Group>
			<Group justify="flex-end" mt="sm" wrap="nowrap">
				<Button
					variant="gradient"
					gradient={gradientDanger}
					loading={isPending}
					onClick={() => deleteFn()}
					className={windowWidth <= BREAKPOINT_TABLET ? 'w-full' : ''}
				>
					Delete
				</Button>
				{windowWidth <= BREAKPOINT_TABLET &&
					<Button
						onClick={() => openModal(contribution)}
						variant="gradient"
						gradient={gradient}
						className="w-full"
					>
						Edit
					</Button>
				}
				<Button
					variant={contribution.textureId === null ? 'gradient' : 'filled'}
					className={cn(
						contribution.textureId === null ? 'button-disabled-with-bg' : '',
						windowWidth <= BREAKPOINT_TABLET ? 'w-full' : ''
					)}
					color={gradient.to}
					gradient={gradient}
					loading={isPending}
					disabled={contribution.textureId === null}
					onClick={submit}
				>
					Submit
				</Button>
			</Group>
		</Tile>
	);
}
