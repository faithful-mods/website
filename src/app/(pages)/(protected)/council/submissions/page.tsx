'use client';

import { useState } from 'react';

import { GoAlert, GoCheckCircle, GoCircleSlash } from 'react-icons/go';

import { Accordion, Badge, Group, Select, Stack, Switch, Text } from '@mantine/core';
import { Resolution, UserRole } from '@prisma/client';

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
	const [showVoted, setShowVoted] = useState(false);

	const [counselors, setCounselors] = useState<PublicUser[]>([]);
	const [counselorVoted, setCounselorVoted] = useState<ContributionWithCoAuthorsAndFullPoll[]>([]);
	const [counselorUnvoted, setCounselorUnvoted] = useState<ContributionWithCoAuthorsAndFullPoll[]>([]);

	const counselor = useCurrentUser()!;

	const infoType = counselor.role === UserRole.ADMIN ? 'red' : counselorUnvoted.length > 0 ? 'yellow' : 'teal';
	const infoTypeText = counselor.role === UserRole.ADMIN ? 'var(--text-color)' : counselorUnvoted.length > 0 ? 'black' : 'white';

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

			<Accordion chevronPosition="right">
				<Accordion.Item value="about">
					<Accordion.Control>
						<Text size="md" fw={700}>
							About the submissions review process
						</Text>
					</Accordion.Control>
					<Accordion.Panel>
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
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>

			<Tile color={infoType}>
				<Group gap="xs" wrap="nowrap">
					{infoType === 'red' && (
						<>
							<GoCircleSlash color={infoTypeText} />
							<Text size="sm" c={infoTypeText}>
								You are an admin, you can&apos;t vote on contributions.
							</Text>
						</>
					)}

					{infoType === 'yellow' && (
						<>
							<GoAlert color={infoTypeText} />
							<Text size="sm" c={infoTypeText}>
								There {counselorUnvoted.length === 1 ? 'is' : 'are'} {counselorUnvoted.length} contribution{counselorUnvoted.length > 1 ? 's' : ''} waiting for your vote.
							</Text>
						</>
					)}

					{infoType === 'teal' && (
						<>
							<GoCheckCircle size={20} color={infoTypeText} />
							<Text size="sm" c={infoTypeText}>
								No more contributions to vote on. Good job!
							</Text>
						</>
					)}
				</Group>
			</Tile>

			<Tile p="xs" pl="md">
				<Group justify="space-between">
					<Group gap="sm">
						<Switch
							label="Show voted contributions"
							checked={showVoted}
							onChange={(e) => setShowVoted(e.target.checked)}
						/>
						<Switch
							label="Light background"
							checked={isLightBackground}
							onChange={(e) => setLightBackground(e.target.checked)}
						/>
						<Switch
							label="Add border"
							checked={hasBorder}
							onChange={(e) => setBorder(e.target.checked)}
						/>
					</Group>
					<Select
						placeholder="All resolutions"
						data={Object.keys(Resolution).map((r) => ({ value: r, label: r }))}
						checkIconPosition="right"
						clearable
						w={140}
					/>
				</Group>
			</Tile>

			{(counselorVoted.length > 0 || infoType !== 'teal') && (
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
					{showVoted && counselorVoted.map((c, i) =>
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
			)}
		</Stack>
	);
};

export default CouncilContributionsPanel;
