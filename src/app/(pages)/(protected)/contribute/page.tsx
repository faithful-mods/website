'use client';

import { Card, Code, Group, Select, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Resolution } from '@prisma/client';
import { useState, useTransition } from 'react';

import { CoAuthorsSelector } from '~/components/submit/co-authors-select';
import { ContributionDraftPanel } from '~/components/submit/drafts/drafts-panel';
import { ContributionSubmittedPanel } from '~/components/submit/submitted/submitted-panel';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { createRawContributions, getSubmittedContributions, getDraftContributions } from '~/server/data/contributions';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll, PublicUser } from '~/types';

const ContributePage = () => {
	const [isPending, startTransition] = useTransition();
	const [windowWidth, _] = useDeviceSize();
	
	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>([]);

	const [contributions, setContributions] = useState<ContributionWithCoAuthorsAndPoll[] | undefined>();
	const [draftContributions, setDraftContributions] = useState<ContributionWithCoAuthors[] | undefined>();

	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	useEffectOnce(() => {
		getDraftContributions(user.id!)
			.then(setDraftContributions)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch draft contributions', 'red');
			});

		reloadSubmitted();
	});

	const reloadSubmitted = () => {
		startTransition(() => {
			getSubmittedContributions(user.id!)
				.then(setContributions)
				.catch((err) => {
					console.error(err);
					notify('Error', 'Failed to fetch contributions', 'red');
				});
		})
	}

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
			{draftContributions && 
				<ContributionDraftPanel
					draftContributions={draftContributions} 
					key={draftContributions.map((c) => c.id).join('')}
					onUpdate={reloadSubmitted}
				/>
			}
			{contributions && 
				<ContributionSubmittedPanel 
					contributions={contributions} 
					key={contributions.map((c) => c.id).join('')}
				/>
			}
		</Stack>
	)
}

export default ContributePage;