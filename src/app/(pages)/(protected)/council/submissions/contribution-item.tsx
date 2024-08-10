
import { useMemo, useTransition } from 'react';

import { LuArrowDown, LuArrowUp, LuArrowUpDown } from 'react-icons/lu';

import { Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { ReactCompareSlider } from 'react-compare-slider';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET } from '~/lib/constants';
import { checkContributionStatus } from '~/server/data/contributions';
import { editPollChoice } from '~/server/data/polls';

import type { Texture } from '@prisma/client';
import type { PublicUser, ContributionWithCoAuthorsAndFullPoll } from '~/types';

export interface CouncilContributionItemProps {
	counselors: PublicUser[];
	contribution: ContributionWithCoAuthorsAndFullPoll;
	disabled: boolean;
	isLightBackground: boolean;
	hasBorder: boolean;
	texture: Texture;
	onVote: () => void;
}

export function CouncilContributionItem({ disabled, contribution, isLightBackground, hasBorder, texture, counselors, onVote }: CouncilContributionItemProps) {
	const [, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();
	const counselor = useCurrentUser()!;

	const itemsPerRow = useMemo(() => {
		if (windowWidth <= BREAKPOINT_MOBILE_LARGE) return 1;
		if (windowWidth <= BREAKPOINT_TABLET) return 3;
		if (windowWidth <= BREAKPOINT_DESKTOP_MEDIUM) return 4;

		return 6;
	}, [windowWidth]);

	const switchVote = (kind: 'up' | 'down' | 'none') => {
		if (disabled) return;

		startTransition(() => {
			editPollChoice(contribution.poll.id, counselor.id!, kind)
				.then(() => {
					checkContributionStatus(contribution.id);
					onVote();
				});
		});
	};

	return (
		<Tile w={`calc((100% - (${itemsPerRow - 1} * var(--mantine-spacing-sm))) / ${itemsPerRow})`}>
			<Group
				gap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'sm' : 'md'}
				justify="center"
				align="start"
			>
				<div style={{ border: `1px solid ${hasBorder ? 'red' : 'transparent'}` }}>
					<ReactCompareSlider
						disabled={disabled}
						itemTwo={
							<TextureImage
								styles={{
									backgroundColor: isLightBackground ? '#fff' : '#252525',
								}}
								size={190}
								mcmeta={texture?.mcmeta}
								src={texture?.filepath ?? '/icon.png'}
								alt=''
							/>
						}
						itemOne={
							<TextureImage
								styles={{
									backgroundColor: isLightBackground ? '#fff' : '#252525',
								}}
								size={190}
								mcmeta={contribution?.mcmeta}
								src={contribution.file}
								alt=''
							/>
						}
					/>
				</div>
				<Stack
					justify="left"
					className="w-full"
					gap="0"
				>
					<Text size="sm" fw={700}>{contribution.filename}</Text>
					<Group justify="space-between" wrap="nowrap"><Text size="xs" fw={300}>Resolution:</Text><Text size="xs">{contribution.resolution}</Text></Group>
					<Group justify="space-between" wrap="nowrap"><Text size="xs" fw={300}>Author:</Text><Text size="xs">{contribution.owner.name}</Text></Group>
					<Group justify="space-between" wrap="nowrap">
						<Text size="xs" fw={300} component="span">Co-Author{contribution.coAuthors.length > 1 ? 's' : ''}:</Text>
						{contribution.coAuthors.length === 0
							? <Text size="xs" c="dimmed" fs="italic">None</Text>
							: (
								<Tooltip
									label={'Co-authors: ' + contribution.coAuthors.map((author) => author.name).join(', ')}
									withArrow
									arrowSize={8}
								>
									<Text component="span" c="teal" size="xs">see more</Text>
								</Tooltip>
							)
						}
					</Group>
					{texture && (
						<Group justify="center" mt="sm" gap="sm" className="w-full" wrap="nowrap">
							<Button
								p={0}
								fullWidth
								disabled={disabled}
								className={disabled ? 'button-disabled-with-bg' : undefined}
								leftSection={<LuArrowUp/>}
								variant={contribution.poll.upvotes.find((v) => v.id === counselor.id) ? 'filled' : 'light'}
								onClick={() => switchVote('up')}
							>
								{contribution.poll.upvotes.length}
							</Button>
							<Button
								p={0}
								fullWidth
								disabled={disabled}
								className={disabled ? 'button-disabled-with-bg' : undefined}
								leftSection={<LuArrowDown/>}
								variant={contribution.poll.downvotes.find((v) => v.id === counselor.id) ? 'filled' : 'light'}
								onClick={() => switchVote('down')}
							>
								{contribution.poll.downvotes.length}
							</Button>
							<Button
								p={0}
								fullWidth
								disabled={disabled}
								className={disabled ? 'button-disabled-with-bg' : undefined}
								leftSection={<LuArrowUpDown/>}
								variant={contribution.poll.upvotes.find((v) => v.id === counselor.id) === undefined && contribution.poll.downvotes.find((v) => v.id === counselor.id) === undefined ? 'filled' : 'light'}
								onClick={() => switchVote('none')}
							>
								{counselors.length - (contribution.poll.upvotes.length + contribution.poll.downvotes.length)}
							</Button>
						</Group>
					)}
				</Stack>
			</Group>
		</Tile>
	);
}