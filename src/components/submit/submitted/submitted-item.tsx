import { Badge, Card, Group, Image, Stack, Text } from '@mantine/core';
import { Poll, Status } from '@prisma/client';
import { ClassValue } from 'clsx';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFileAlt } from 'react-icons/fa';

import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET } from '~/lib/constants';
import { cn } from '~/lib/utils';
import { getPollResult } from '~/server/data/polls';
import { ContributionWithCoAuthorsAndPoll, PollResults } from '~/types';

export interface ContributionSubmittedItemProps {
	contribution: ContributionWithCoAuthorsAndPoll;
	className?: ClassValue[] | ClassValue;
	onClick?: () => void;
}

export function ContributionSubmittedItem({ contribution, className, onClick }: ContributionSubmittedItemProps) {
	const [windowWidth, _] = useDeviceSize();
	const imgWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 60 : 90; 
	const [poll, setPoll] = useState<PollResults>();

	useEffectOnce(() => {
		getPollResult(contribution.pollId).then((res) => setPoll(res));
	})
	
	return (
		<Card 
			withBorder 
			shadow="0"
			onClick={onClick}
			className={cn(className, 'contribution-item')}
			style={{ 
				'position': 'relative', 
				'--contribution-item-count': windowWidth <= BREAKPOINT_MOBILE_LARGE
					? 1 
					: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
						? 2
						: 3
			}}
		>
			<Group gap="sm" wrap="nowrap" justify="space-between" align="start">
				<Group wrap="nowrap">
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
				<Stack align="right" gap="xs">
					<Badge 
						color={
							contribution.status === Status.ACCEPTED 
								? 'teal' 
								: contribution.status === Status.REJECTED 
									? 'red' 
									: 'orange'
						}
						variant="filled"
					>
						{windowWidth <= BREAKPOINT_TABLET ? contribution.status.slice(0, 1) : contribution.status}
					</Badge>
					{poll && contribution.status === Status.ACCEPTED &&
						<Stack gap="0">
							<Group gap="xs" justify="right" align="center">
								<Text component="span" c="dimmed" size="xs">{poll.upvotes}</Text>
								<Text c="dimmed" size="xs" style={{ display: 'flex' }}><FaArrowUp /></Text>
							</Group>
							<Group gap="xs" justify="right" align="center">
								<Text component="span" c="dimmed" size="xs">{poll.downvotes}</Text>
								<Text c="dimmed" size="xs" style={{ display: 'flex' }}><FaArrowDown /></Text>
							</Group>
						</Stack>
					}
				</Stack>
			</Group>
		</Card>
	)
}