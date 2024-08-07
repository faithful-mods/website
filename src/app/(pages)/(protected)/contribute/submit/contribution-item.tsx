
import { useState } from 'react';

import { LuArrowUpDown } from 'react-icons/lu';
import { RxCross2 } from 'react-icons/rx';

import { Button, Code, Group, Stack, Text } from '@mantine/core';
import { Status } from '@prisma/client';

import { TextureImage } from '~/components/texture-img';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { removeCoAuthor } from '~/server/data/contributions';
import { getPollResult } from '~/server/data/polls';

import type { CSSProperties } from '@mantine/core';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll, PollResults } from '~/types';

export interface ContributionPanelItemProps {
	contribution: ContributionWithCoAuthors | ContributionWithCoAuthorsAndPoll;
	isCoAuthorContribution?: boolean;
	openModal?: (c: ContributionWithCoAuthors | ContributionWithCoAuthorsAndPoll) => void;
	onUpdate?: () => void;
	styles?: CSSProperties;
}

export function ContributionPanelItem({ contribution, openModal, onUpdate, styles, isCoAuthorContribution }: ContributionPanelItemProps) {
	const [windowWidth] = useDeviceSize();
	const imgWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE ? 60 : 90;
	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	const [poll, setPoll] = useState<PollResults | null>(null);
	const isDraft = contribution.status === Status.DRAFT;

	useEffectOnce(() => {
		getPollResult(contribution.pollId)
			.then(setPoll);
	});

	return (
		<Stack gap="sm" align="center">

			<TextureImage
				src={contribution.file}
				alt=""
				size={imgWidth}
				mcmeta={contribution.mcmeta}
				onClick={() => openModal?.(contribution)}
				styles={styles}
			>
				<Group align="baseline" justify="space-between" >
					<Group>
						<Text size="sm" mb="sm" fw={700}>{contribution.filename}</Text>
					</Group>
					{!isDraft && poll && (
						<Group gap="xs" justify="center">
							<Text component="span" size="xs">{poll.upvotes - poll.downvotes}</Text>
							<Text size="xs" style={{ display: 'flex' }}><LuArrowUpDown /></Text>
						</Group>
					)}
				</Group>
				<Stack gap={2} align="flex-start" mt="0">
					{isCoAuthorContribution && (
						<Group>
							<Text w={70} size="xs">Author: </Text>
							<Text size="xs"><Code component="span">{contribution.owner.name}</Code></Text>
						</Group>
					)}
					{contribution.coAuthors.length > 0 && (<Group>
						<Text w={70} size="xs">Co-authors:</Text>
						<Text size="xs">{contribution.coAuthors.map((ca) => {
							if (ca.id === user.id) {
								return(
									<Button
										key={ca.id}
										component="span"
										color="red"
										leftSection={<RxCross2 />}
										h={18}
										mr={2}
										mt={-1}
										style={{
											fontSize: 'var(--mantine-font-size-xs)',
											fontFamily: 'var(--mantine-font-family-monospace)',
											lineHeight: 'var(--mantine-line-height)',
											padding: '2px calc(var(--mantine-spacing-xs) / 2)',
										}}
										onClick={() => {
											removeCoAuthor(user.id!, ca.id, contribution.id);
											onUpdate?.();
										}}
									>
										{ca.name}
									</Button>
								);
							}
							return <Code component="span" key={ca.id} mr={2}>{ca.name}</Code>;
						})}</Text>
					</Group>)}
					<Group>
						<Text w={70} size="xs">Texture ID:</Text>
						<Text size="xs">
							{contribution.textureId && <Code component="span">{contribution.textureId}</Code>}
							{!contribution.textureId && '-'}
						</Text>
					</Group>
					<Group>
						<Text w={70} size="xs">Resolution:</Text>
						<Text size="xs"><Code component="span">{contribution.resolution}</Code></Text>
					</Group>
					<Group>
						<Text w={70} size="xs">Drafted:</Text>
						<Text size="xs"><Code component="span">{contribution.createdAt.toLocaleString()}</Code></Text>
					</Group>
					<Group>
						<Text w={70} size="xs">Updated:</Text>
						<Text size="xs"><Code component="span">{contribution.updatedAt.toLocaleString()}</Code></Text>
					</Group>
				</Stack>
			</TextureImage>
		</Stack>
	);
}
