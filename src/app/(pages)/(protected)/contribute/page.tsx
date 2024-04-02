'use client';

import { Avatar, Badge, Card, Code, Group, MultiSelect, MultiSelectProps, Select, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Resolution } from '@prisma/client';
import { useState, useTransition } from 'react';

import { ContributionDraftPanel } from '~/components/submit/drafts/drafts-panel';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { createRawContributions, getSubmittedContributions, getDraftContributions } from '~/server/data/contributions';
import { getPublicUsers } from '~/server/data/user';
import type { ContributionWithCoAuthors, PublicUser } from '~/types';

const ContributePage = () => {
	const [isPending, startTransition] = useTransition();
	const [windowWidth, _] = useDeviceSize();
	
	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const [users, setUsers] = useState<PublicUser[]>([]);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<string[]>([]);

	const [contributions, setContributions] = useState<ContributionWithCoAuthors[] | undefined>();
	const [draftContributions, setDraftContributions] = useState<ContributionWithCoAuthors[] | undefined>();

	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	useEffectOnce(() => {
		getSubmittedContributions(user.id!)
			.then(setContributions)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch contributions', 'red');
			});

		getDraftContributions(user.id!)
			.then(setDraftContributions)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch draft contributions', 'red');
			});

		getPublicUsers()
			.then(setUsers)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch users', 'red');
			});
	})

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const user = users.find((u) => u.id === option.value)!;

		return (
			<Group gap="sm" wrap="nowrap">
				<Avatar src={user.image} size={30} radius="xl" />
				<div>
					<Text size="sm">{option.label}</Text>
					{option.disabled && <Text size="xs" c="dimmed">That&apos;s you!</Text>}
				</div>
			</Group>
		);
	};

	const filesDrop = (files: File[]) => {
		startTransition(async () => {
			const data = new FormData();
			files.forEach((file) => data.append('files', file));
	
			await createRawContributions(user.id!, selectedCoAuthors, resolution, data);
			getDraftContributions(user.id!).then(setDraftContributions);
		});
	};

	return (
		<Stack gap="sm">
			<Card withBorder shadow="sm" radius="md" padding="md">
				<Stack gap="sm">
					<Group justify="space-between">
						<Text size="md" fw={700}>New contribution(s)</Text>
					</Group>
					<Text size="sm" c="red">Please do not submit textures for unsupported mod. Ask the admins to add the mod first.</Text>
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
						<MultiSelect 
							limit={10}
							label="Co-authors"
							data={users.map((u) => ({ value: u.id, label: u.name ?? 'Unknown', disabled: u.id === user.id }))}
							renderOption={renderMultiSelectOption}
							defaultValue={[]}
							onChange={setSelectedCoAuthors}
							style={windowWidth <= BREAKPOINT_MOBILE_LARGE ? { width: '100%' } : { width: 'calc((100% - var(--mantine-spacing-md)) * .8)' }}
							hidePickedOptions
							searchable
							clearable
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
			{draftContributions && draftContributions.length > 0 && <ContributionDraftPanel draftContributions={draftContributions} />}
			<Card withBorder shadow="sm" radius="md" padding="md" mb="sm">
				<Stack gap="sm">
					<Group justify="space-between">
						<Text size="md" fw={700}>Submitted contribution(s)</Text>
						<Badge color="teal" variant="filled">{contributions?.length ?? '?'}</Badge>
					</Group>

					{!contributions && <Text size="sm" c="dimmed">Loading...</Text>}
					{contributions && contributions.length === 0 && <Text size="sm" c="dimmed">Nothing yet</Text>}
					{contributions && contributions.length > 0 && <p>TODO</p>}
				</Stack>
			</Card>
		</Stack>
	)
}

export default ContributePage;