'use client';

import { Accordion, Badge, Card, Code, Group, Select, Stack, Text, Title } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Resolution } from '@prisma/client';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { CoAuthorsSelector } from '~/components/submit/co-authors-select';
import { ContributionDraftPanel } from '~/components/submit/drafts/drafts-panel';
import { ContributionSubmittedPanel } from '~/components/submit/submitted/submitted-panel';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, notify } from '~/lib/utils';
import { createRawContributions, getSubmittedContributions, getDraftContributions, getCoSubmittedContributions } from '~/server/data/contributions';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll, PublicUser } from '~/types';

const ContributePage = () => {
	const [isPending, startTransition] = useTransition();
	const [windowWidth, _] = useDeviceSize();
	
	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>([]);

	const [contributions, setContributions] = useState<ContributionWithCoAuthorsAndPoll[] | undefined>();
	const [draftContributions, setDraftContributions] = useState<ContributionWithCoAuthors[] | undefined>();
	const [coContributions, setCoContributions] = useState<ContributionWithCoAuthorsAndPoll[] | undefined>();

	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	useEffectOnce(() => {
		reload();
	});
	
	const reload = () => {
		startTransition(() => {
			getDraftContributions(user.id!)
				.then(setDraftContributions)
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
				.then(setContributions)
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
	
			await createRawContributions(user.id!, selectedCoAuthors.map((u) => u.id), resolution, data);
			getDraftContributions(user.id!).then(setDraftContributions);
		});
	};

	return (
		<Stack gap="sm" pb="sm">
			<Card withBorder shadow="sm" radius="md" padding="md">
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
						If there is more downvotes or the same amount of upvotes and downvotes, it will be <Badge component="span" color="red">rejected</Badge>
					</Text>
				</ul>
				<Text size="sm">
					When your submissions are in <Badge component="span" color={gradient.to}>draft</Badge> status, 
					you can edit them as many times as you like. But if you want to switch the texture file, please reupload it and delete your draft.<br/>
				</Text>
				<Text size="sm" fs="italic" c="dimmed" mt="sm">You want to join the council ? Apply here (soon).</Text>
			</Card>

			<Card withBorder shadow="sm" radius="md" padding="md">
				<Stack gap="sm">
					<Group justify="space-between">
						<Text size="md" fw={700}>New contribution(s)</Text>
					</Group>
					<Text size="sm" c="red">Please do not submit textures for unsupported mod/modpack. Ask the admins to add it first.</Text>
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
							You can always edit them when they are in draft status.
						</Text>
					</Stack>
				</Stack>
			</Card>

			<Accordion variant="separated" defaultValue={draftContributions?.length ? 'drafts' : 'submitted'} radius="md">
				{draftContributions && 
					<Accordion.Item value="drafts">
						<Accordion.Control icon={
							<Badge color="teal" variant="filled">{draftContributions.length}</Badge>
						}>
							<Text size="md" fw={700}>Drafts</Text>
						</Accordion.Control>
						<Accordion.Panel>
							<ContributionDraftPanel
								draftContributions={draftContributions} 
								key={draftContributions.map((c) => c.id).join('')}
								onUpdate={reload}
							/>
						</Accordion.Panel>
					</Accordion.Item>
				}

				{contributions && 
					<Accordion.Item value="submitted">
						<Accordion.Control icon={
							<Badge color="teal" variant="filled">{contributions.length}</Badge>
						}>
							<Text size="md" fw={700}>Submitted</Text>
						</Accordion.Control>
						<Accordion.Panel>
							<Text mb="sm">Contributions you own and have submitted.</Text>
							<ContributionSubmittedPanel 
								contributions={contributions} 
								key={contributions.map((c) => c.id).join('')}
								onUpdate={reload}
							/>
						</Accordion.Panel>
					</Accordion.Item>
				}

				{coContributions && 
					<Accordion.Item value="coSubmitted">
						<Accordion.Control icon={
							<Badge color="teal" variant="filled">{coContributions.length}</Badge>
						}>
							<Text size="md" fw={700}>Co-Submitted</Text>
						</Accordion.Control>
						<Accordion.Panel>
							<Text mb="sm">Contributions where you appear as a co-author.</Text>
							<ContributionSubmittedPanel
								coSubmitted 
								contributions={coContributions} 
								key={coContributions.map((c) => c.id).join('')}
								onUpdate={reload}
							/>
						</Accordion.Panel>
					</Accordion.Item>
				}
			</Accordion>
		</Stack>
	);
};

export default ContributePage;