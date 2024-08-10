'use client';

import { useState } from 'react';

import { GoInfo } from 'react-icons/go';

import { Badge, Group, Stack, Switch, Text } from '@mantine/core';
import { UserRole } from '@prisma/client';

import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { getPendingContributions } from '~/server/data/contributions';
import { getTextures } from '~/server/data/texture';
import { getCounselors } from '~/server/data/user';

import { CouncilContributionItem } from './contribution-item';

import type { Texture } from '@prisma/client';
import type { ContributionWithCoAuthorsAndFullPoll, PublicUser } from '~/types';

const CouncilContributionsPanel = () => {
	const [textures, setTextures] = useState<Texture[]>([]);
	const [isLightBackground, setLightBackground] = useState(false);
	const [hasBorder, setBorder] = useState(false);

	const [counselors, setCounselors] = useState<PublicUser[]>([]);
	const [counselorVoted, setCounselorVoted] = useState<ContributionWithCoAuthorsAndFullPoll[]>([]);
	const [counselorUnvoted, setCounselorUnvoted] = useState<ContributionWithCoAuthorsAndFullPoll[]>([]);

	const counselor = useCurrentUser()!;

	useEffectOnce(() => {
		getTextures()
			.then(setTextures)
			.catch((err) => console.error(err));

		loadContributions();

		getCounselors()
			.then(setCounselors)
			.catch((err) => console.error(err));
	});

	const loadContributions = () => {
		getPendingContributions()
			.then((res) => {
				const unvoted: ContributionWithCoAuthorsAndFullPoll[] = [];
				const voted: ContributionWithCoAuthorsAndFullPoll[] = [];

				res.forEach((c) => {
					if (c.poll.downvotes.find((dv) => dv.id === counselor.id) || c.poll.upvotes.find((uv) => uv.id === counselor.id))
						voted.push(c);
					else
						unvoted.push(c);
				});

				setCounselorUnvoted(unvoted);
				setCounselorVoted(voted);
			})
			.catch((err) => console.error(err));
	};

	return (
		<Stack gap="sm" mb="sm">
			<Tile>
				<Text size="md" fw={700}>Submission Process</Text>
				<Text size="sm" c="dimmed">
					Contributors submissions are reviewed here by the council. Seing this page means you are part of the council (congrats!)
				</Text>
				<Text size="sm">
					All contributions submitted by contributors will be reviewed by all council members. Each council member will have to vote for each contribution.
					Once all council members have voted, the contribution will be accepted or rejected following these rules:
				</Text>
				<ul>
					<Text component="li" size="sm">
						If the contribution has more upvotes than downvotes, it will be <Badge component="span" color="teal">accepted</Badge>
					</Text>
					<Text component="li" size="sm">
						If there is more downvotes or the same amount of upvotes and downvotes, it will be <Badge component="span" color="red">rejected</Badge>
					</Text>
					<Text component="li" c="red" size="sm">
						Once the voted is ended, the contribution status will be definitive.
					</Text>
				</ul>
			</Tile>
			<Tile color={counselor.role === UserRole.ADMIN ? 'red' : counselorUnvoted.length > 0 ? 'yellow': 'teal'}>
				<Group wrap="nowrap">
					<GoInfo size={20} color={counselor.role === UserRole.ADMIN ? 'var(--text-color)' : counselorUnvoted.length > 0 ? 'black' : 'white'} />
					{counselor.role === UserRole.COUNCIL && (
						<Text size="sm" c={counselorUnvoted.length > 0 ? 'black' : 'white'}>
							{counselorUnvoted.length === 0 && counselorVoted.length === 0 && (
								'No more contributions in the voting process, nice!'
							)}
							{counselorUnvoted.length > 0 && (
								`There ${counselorUnvoted.length === 1 ? 'is' : 'are'} ${counselorUnvoted.length} contribution${counselorUnvoted.length > 1 ? 's' : ''} waiting for your vote.`
							)}
						</Text>
					)}
					{counselor.role === UserRole.ADMIN && (
						<Text size="sm">
							You&apos;re an admin, you can&apos;t vote on contributions.
						</Text>
					)}
				</Group>
			</Tile>

			<Tile>
				<Group gap="sm">
					<Switch
						label="Light background"
						checked={isLightBackground}
						onChange={() => setLightBackground(!isLightBackground)}
					/>
					<Switch
						label="Add border"
						checked={hasBorder}
						onChange={() => setBorder(!hasBorder)}
					/>
				</Group>
			</Tile>

			<Group gap="sm">
				{counselorUnvoted.map((c, i) =>
					<CouncilContributionItem
						disabled={counselor.role === UserRole.ADMIN}
						key={i}
						counselors={counselors}
						contribution={c}
						texture={textures.find(t => t.id === c.textureId)!}
						onVote={loadContributions}
						isLightBackground={isLightBackground}
						hasBorder={hasBorder}
					/>
				)}
			</Group>
			{counselorVoted.length > 0 && (
				<Tile>
					<Text>
						Contributions that you have already voted on and that are waiting for other council members to vote on:
					</Text>
				</Tile>
			)}
			<Group gap="sm">
				{counselorVoted.map((c, i) =>
					<CouncilContributionItem
						disabled={counselor.role === UserRole.ADMIN}
						key={i}
						counselors={counselors}
						contribution={c}
						texture={textures.find(t => t.id === c.textureId)!}
						onVote={loadContributions}
						isLightBackground={isLightBackground}
						hasBorder={hasBorder}
					/>
				)}
			</Group>
		</Stack>
	);
};

export default CouncilContributionsPanel;
