'use client';

import { Accordion, Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Texture } from '@prisma/client';
import { useState } from 'react';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { getPendingContributions } from '~/server/data/contributions';
import { getTextures } from '~/server/data/texture';
import { getCounselors } from '~/server/data/user';
import { ContributionWithCoAuthorsAndFullPoll, PublicUser } from '~/types';

import { CouncilContributionItem } from './contribution-item';

export function CouncilContributionsPanel() {
	const [textures, setTextures] = useState<Texture[]>([]);
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
		<Stack gap="sm">
			<Card withBorder shadow="sm" radius="md" padding="md">
				<Text size="md" fw={700}>Submission Process</Text>
				<Text size="sm">
					Once all counselors have voted:
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
				<Text size="sm">
					There is actually {counselorUnvoted.length + counselorVoted.length} contribution(s) in the voting process 
					and {counselors.length} counselor(s) in the council.
				</Text>
			</Card>

			<Accordion variant="separated">
				<Accordion.Item value="unvoted">
					<Accordion.Control
						icon={<Badge color="orange" variant="filled">{counselorUnvoted.length}</Badge>}
					>Need your vote</Accordion.Control>
					<Accordion.Panel>
						<Stack>
							<Text size="sm" c="dimmed">
								{
									counselorUnvoted.length === 0 
										? 'No more contributions waiting for you, nice!' 
										: 'Please vote for the following contributions:'
								}
							</Text>
							{counselorUnvoted.map((c, i) => 
								<CouncilContributionItem
									key={i}
									counselors={counselors}
									contribution={c}
									texture={textures.find(t => t.id === c.textureId)!} 
									onVote={loadContributions}
								/>
							)}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="voted" mb="sm">
					<Accordion.Control
						icon={<Badge color="teal" variant="filled">{counselorVoted.length}</Badge>}
					>Voted!</Accordion.Control>
					<Accordion.Panel>
						<Stack>
							<Text size="sm" c="dimmed">
								{
									counselorVoted.length === 0 
										? 'No more contributions waiting in the voting process, nice!' 
										: 'Here you can edit your votes:'
								}
							</Text>
							{counselorVoted.map((c, i) => 
								<CouncilContributionItem
									key={i}
									counselors={counselors}
									contribution={c}
									texture={textures.find(t => t.id === c.textureId)!} 
									onVote={loadContributions}
								/>
							)}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</Stack>
	);
}