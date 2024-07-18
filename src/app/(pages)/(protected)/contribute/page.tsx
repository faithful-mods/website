'use client';

import { Accordion, Badge, Button, Code, Group, Select, Stack, Tabs, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Resolution, Status } from '@prisma/client';
import { useEffect, useState, useTransition } from 'react';

import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, gradientDanger, gradientWarning, notify } from '~/lib/utils';
import { createRawContributions, getCoSubmittedContributions, getDraftContributions, getSubmittedContributions } from '~/server/data/contributions';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll, PublicUser } from '~/types';

import { CoAuthorsSelector } from './co-authors-select';
import { ContributionPanelItem } from './contribution-item';
import { ContributionPanel } from './contribution-panel';

const ContributePage = () => {
	const [isPending, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();

	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>([]);

	const [contributions, setContributions] = useState<ContributionWithCoAuthorsAndPoll[] | undefined>();
	const [draftContributions, setDraftContributions] = useState<ContributionWithCoAuthors[] | undefined>();
	const [coContributions, setCoContributions] = useState<ContributionWithCoAuthorsAndPoll[] | undefined>();

	const [counts, setCounts] = useState<[number, number, number]>([0, 0, 0]);

	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	useEffectOnce(() => {
		reload();
	});

	useEffect(() => {
		if (contributions && contributions.length > 0) {
			const pending = contributions.filter((c) => c.status === Status.PENDING).length;
			const accepted = contributions.filter((c) => c.status === Status.ACCEPTED).length;
			const rejected = contributions.filter((c) => c.status === Status.REJECTED).length;

			setCounts([pending, accepted, rejected]);
		}
	}, [contributions]);

	const reload = () => {
		startTransition(() => {
			getDraftContributions(user.id!)
				.then((res) => setDraftContributions(res.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())))
				.catch((err) => {
					console.error(err);
					notify('Error', 'Failed to fetch draft contributions', 'red');
				});

			getCoSubmittedContributions(user.id!)
				.then(setCoContributions)
				.catch((err) => {
					console.error(err);
					notify('Error', 'Failed to fetch submitted contributions', 'red');
				});

			getSubmittedContributions(user.id!)
				.then((res) => setContributions(res.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())))
				.catch((err) => {
					console.error(err);
					notify('Error', 'Failed to fetch contributions', 'red');
				});
		});
	};

	const filesDrop = (files: File[]) => {
		startTransition(async () => {
			const data = new FormData();
			files.forEach((file) => data.append('files', file));

			await createRawContributions(user.id!, selectedCoAuthors.map((u) => u.id), resolution, data)
				.then(() => {
					getDraftContributions(user.id!).then(setDraftContributions);
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	};

	return (
		<Stack gap="sm" pb="sm">
			<Tabs
				orientation={windowWidth > BREAKPOINT_MOBILE_LARGE ? 'vertical' : 'horizontal'}
				defaultValue="about"
				ml={-2}
			>
				<Tabs.List mah="297">
					<Tabs.Tab value="about">About</Tabs.Tab>
					<Tabs.Tab value="submission">Submit</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel
					value="submission"
					pl={windowWidth > BREAKPOINT_MOBILE_LARGE ? 'sm' : '0'}
					pt={windowWidth > BREAKPOINT_MOBILE_LARGE ? '0' : 'sm'}
				>
					<Stack gap="sm">
						<Tile>
							<Stack gap="sm">
								<Stack gap={0}>
									<Text size="md" fw={700}>New contribution(s)</Text>
									<Text size="sm">
										By contributing to the platform, you agree to the <Text component="a" href="/docs/tos" c="blue" target="_blank">Terms of Service</Text>.<br />
										<Text component="span" size="sm" c="dimmed" fs="italic">Please do not submit textures for unsupported mod/modpack. Ask the admins to add it first.</Text>
									</Text>
								</Stack>
								<Group gap="md">
									<Select
										label="Resolution"
										data={Object.keys(Resolution)}
										allowDeselect={false}
										defaultValue={Resolution.x32}
										onChange={(value) => setResolution(value as Resolution)}
										style={windowWidth <= BREAKPOINT_MOBILE_LARGE ? { width: '100%' } : { width: 'calc((100% - var(--mantine-spacing-md)) * .2)' }}
										required
									/>
									<CoAuthorsSelector
										author={user}
										onCoAuthorsSelect={setSelectedCoAuthors}
										style={windowWidth <= BREAKPOINT_MOBILE_LARGE
											? { width: '100%' }
											: { width: 'calc((100% - var(--mantine-spacing-md)) * .8)' }
										}
									/>
								</Group>
								<Stack gap="2">
									<Text size="sm" fw={500}>Files</Text>
									<Dropzone
										onDrop={filesDrop}
										accept={['image/png']}
										loading={isPending}
										mt="0"
									>
										<div>
											<Text size="l" inline>
											Drag <Code>.PNG</Code> files here or click to select files
											</Text>
											<Text size="sm" c="dimmed" inline mt={7}>
											Attach as many files as you like, each file will be added as a separate contribution
											based on the settings above.
											</Text>
										</div>
									</Dropzone>
									<Text size="xs" c="dimmed" fs="italic">
									You can always edit them later on.
									</Text>
								</Stack>

							</Stack>
						</Tile>

						<Accordion
							variant="separated"
							chevronPosition="left"
							defaultValue="owned"
							radius="md"
						>
							<Accordion.Item value="owned">
								{draftContributions && contributions && (
									<>
										<Accordion.Control icon={
											<Group gap="sm">
												<Badge color={gradient.to} variant="filled">{draftContributions.length}</Badge>
												<Badge color={gradientWarning.from} variant="filled">{counts[0]}</Badge>
												<Badge color={gradientDanger.from} variant="filled">{counts[1]}</Badge>
												<Badge color="teal" variant="filled">{counts[2]}</Badge>
											</Group>
										}>
											<Text size="md" fw={700}>Your contributions</Text>
										</Accordion.Control>

										<Accordion.Panel>
											<ContributionPanel
												drafts={draftContributions}
												submitted={contributions}
												onUpdate={reload}
											/>
										</Accordion.Panel>
									</>
								)
								}
							</Accordion.Item>

							{coContributions &&
								<Accordion.Item value="coSubmitted" mt="sm">
									<Accordion.Control icon={
										<Group gap="sm">
											<Badge color="teal" variant="filled">{coContributions?.length ?? '?'}</Badge>
										</Group>
									}>
										<Text size="md" fw={700}>Co-Submitted</Text>
									</Accordion.Control>
									<Accordion.Panel>
										<Text mb="sm" size="sm">Contributions where you appear as a co-author.</Text>
										<Group gap="sm">
											{coContributions.map((coContribution) => (
												<ContributionPanelItem
													key={coContribution.id}
													contribution={coContribution}
													isCoAuthorContribution
													onUpdate={reload}
												/>
											))}
										</Group>
									</Accordion.Panel>
								</Accordion.Item>
							}
						</Accordion>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel
					value="about"
					pl={windowWidth > BREAKPOINT_MOBILE_LARGE ? 'sm' : '0'}
					pt={windowWidth > BREAKPOINT_MOBILE_LARGE ? '0' : 'sm'}
				>
					<Tile>
						{windowWidth > BREAKPOINT_MOBILE_LARGE && <Button pos="absolute" right="var(--mantine-spacing-md)" disabled>Apply for Council</Button>}
						<Text size="md" fw={700}>Submission Process</Text>
						<Text size="sm">
							Once submitted, your submissions are subject to a voting process by the council and their decision is final.<br/>
							When all counselors have voted, the following will happen:
						</Text>
						<ul>
							<Text size="sm" component="li">
								If the contribution has more upvotes than downvotes, it will be <Badge component="span" color="teal">accepted</Badge>
							</Text>
							<Text size="sm" component="li">
								If there is more downvotes or the same amount of upvotes and downvotes, it will be <Badge component="span" color={gradientDanger.from}>rejected</Badge>
							</Text>
						</ul>
						<Text size="sm">
							When your submissions are in <Badge component="span" color={gradient.to}>draft</Badge> or <Badge component="span" color={gradientWarning.from}>pending</Badge> status,
							you can edit them as many times as you like.
						</Text>
						<Text size="sm" fs="italic" c="dimmed" mt="sm">
							Note that if you edit your contribution, its status will be reset to <Badge component="span" color={gradient.to}>draft</Badge> and will need to be re-submitted and re-voted on.
						</Text>
						{windowWidth <= BREAKPOINT_MOBILE_LARGE && <Button mt="sm" disabled>Apply for Council</Button>}
					</Tile>
				</Tabs.Panel>
			</Tabs>


			{/*


			 */}
		</Stack>
	);
};

export default ContributePage;
