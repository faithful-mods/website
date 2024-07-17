import { Badge, Group, Image, Stack, Text } from '@mantine/core';
import { Texture } from '@prisma/client';
import { useTransition } from 'react';
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from 'react-icons/lu';

import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { checkContributionStatus } from '~/server/data/contributions';
import { editPollChoice } from '~/server/data/polls';
import type { PublicUser, ContributionWithCoAuthorsAndFullPoll } from '~/types';


export interface CouncilContributionItemProps {
	counselors: PublicUser[];
	contribution: ContributionWithCoAuthorsAndFullPoll;
	texture?: Texture;
	onVote: () => void;
}

export function CouncilContributionItem({ contribution, texture, counselors, onVote }: CouncilContributionItemProps) {
	const [, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();
	const counselor = useCurrentUser()!;

	const imageStyle = {
		maxWidth: 'calc(50% - (var(--mantine-spacing-md) / 2))',
		maxHeight: 'calc(50% - (var(--mantine-spacing-md) / 2))',
		minWidth: 'calc(50% - (var(--mantine-spacing-md) / 2))',
		minHeight: 'calc(50% - (var(--mantine-spacing-md) / 2))',
	};

	const switchVote = (kind: 'up' | 'down' | 'none') => {
		startTransition(() => {
			editPollChoice(contribution.poll.id, counselor.id!, kind)
				.then(() => {
					checkContributionStatus(contribution.id);
					onVote();
				});
		});
	};

	return (
		<Tile shadow="0">
			<Group gap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'sm' : 'md'} justify="left" align="start">
				<Group
					gap="md"
					justify={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'space-between' : 'start'}
					w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc(100% / 3)'}
				>
					<Image
						style={imageStyle}
						className="texture-background image-pixelated"
						src={texture?.filepath ?? '/icon.png'} alt=""
					/>
					<Image
						style={imageStyle}
						className="texture-background image-pixelated"
						src={contribution.file} alt=""
					/>
				</Group>
				<Stack justify="start" gap="0">
					<Text fw={700}>{contribution.filename}</Text>
					<Text>Author: {contribution.owner.name}</Text>
					<Text>Co-Authors: {contribution.coAuthors.length === 0 ? 'None' : contribution.coAuthors.map((author) => author.name).join(', ')}</Text>
					{!texture && (
						<Text c="red" size="xs">The texture for this contribution is missing/has been deleted!</Text>
					)}
					{texture && (
						<Group mt="sm" gap="sm">
							<Badge
								leftSection={<LuArrowUp/>}
								variant={contribution.poll.upvotes.find((v) => v.id === counselor.id) ? 'filled' : 'light'}
								className="cursor-pointer"
								onClick={() => switchVote('up')}
							>
								{contribution.poll.upvotes.length}
							</Badge>
							<Badge
								leftSection={<LuArrowDown/>}
								variant={contribution.poll.downvotes.find((v) => v.id === counselor.id) ? 'filled' : 'light'}
								className="cursor-pointer"
								onClick={() => switchVote('down')}
							>
								{contribution.poll.downvotes.length}
							</Badge>
							<Badge
								leftSection={<LuArrowUpDown/>}
								variant={contribution.poll.upvotes.find((v) => v.id === counselor.id) === undefined && contribution.poll.downvotes.find((v) => v.id === counselor.id) === undefined ? 'filled' : 'light'}
								className="cursor-pointer"
								onClick={() => switchVote('none')}
							>
								{counselors.length - (contribution.poll.upvotes.length + contribution.poll.downvotes.length)}
							</Badge>
						</Group>
					)}
				</Stack>
			</Group>
		</Tile>
	);
}
