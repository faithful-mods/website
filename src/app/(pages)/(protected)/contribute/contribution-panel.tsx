import { Button, Divider, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ContributionDeactivation, Status, Texture } from '@prisma/client';
import { startTransition, useMemo, useState } from 'react';

import { Modal } from '~/components/modal';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, notify, sortByName } from '~/lib/utils';
import { submitContributions } from '~/server/data/contributions';
import { getTextures } from '~/server/data/texture';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll } from '~/types';

import { ContributionPanelItem } from './contribution-item';
import { ContributionModal } from './drafts-modal';

export interface ContributionPanelProps {
	drafts: ContributionWithCoAuthors[];
	submitted: ContributionWithCoAuthorsAndPoll[];
	onUpdate: () => void;
}

export function ContributionPanel({ drafts, submitted, onUpdate }: ContributionPanelProps) {
	const ready = useMemo(() => drafts.filter((c) => c.textureId !== null), [drafts]);
	const [windowWidth] = useDeviceSize();
	const author = useCurrentUser()!;

	const [isModalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modalContribution, setModalContribution] = useState<ContributionWithCoAuthors | ContributionWithCoAuthorsAndPoll | null>(null);
	const [textures, setTextures] = useState<(Texture & { disabledContributions: ContributionDeactivation[] })[]>([]);

	const [isHoveringSubmit, setHoveringSubmit] = useState(false);

	const handleModalOpen = (c: ContributionWithCoAuthors | ContributionWithCoAuthorsAndPoll) => {
		setModalContribution(c);
		openModal();
	};

	useEffectOnce(() => {
		getTextures()
			.then((res)=> {
				const sorted = res.sort(sortByName);
				setTextures(sorted);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch textures', 'red');
			});
	});

	const handleContributionsSubmit = () => {
		startTransition(() => {
			submitContributions(author.id!, drafts.filter((c) => c.textureId !== null).map((c) => c.id));
			onUpdate();
		});
	};

	return (
		<>
			<Modal
				forceFullScreen
				opened={isModalOpened}
				onClose={closeModal}
				title="Edit Contribution"
			>
				{modalContribution &&
					<ContributionModal
						contribution={modalContribution}
						textures={textures}
						onClose={(e) => {
							onUpdate();
							closeModal();
						}}
					/>
				}
			</Modal>
			<Stack gap="sm">
				<Group justify="space-between" align="center">
					<Stack gap={0}>
						<Text size="md" fw={700}>Draft(s)</Text>
						{drafts.length === 0 && <Text size="sm" c="dimmed">No drafts!</Text>}
						{drafts.length > 0 && <Text size="sm" c="dimmed">These contributions are not yet submitted and only visible by you.</Text>}
					</Stack>
					<Button
						variant="gradient"
						gradient={gradient}
						disabled={ready.length === 0}
						className={ready.length === 0 ? 'button-disabled-with-bg' : undefined}
						fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
						onClick={() => handleContributionsSubmit()}
						onMouseEnter={() => setHoveringSubmit(true)}
						onMouseLeave={() => setHoveringSubmit(false)}
					>
						Submit {ready.length} draft{ready.length > 1 ? 's' : ''}
					</Button>
				</Group>
				<Group gap="sm">
					{drafts.map((draft) => (
						<ContributionPanelItem
							key={draft.id}
							contribution={draft}
							openModal={handleModalOpen}
							styles={draft.textureId !== null && isHoveringSubmit
								? { boxShadow: '0 0 10px var(--mantine-color-teal-filled)' }
								: undefined
							}
						/>
					))}
				</Group>
				<Divider />
				<Stack gap="xs">
					<Text size="md" fw={700}>Pending</Text>
					<Group gap="sm">
						{submitted.filter((s) => s.status === Status.PENDING).map((submitted) => (
							<ContributionPanelItem
								key={submitted.id}
								contribution={submitted}
								openModal={handleModalOpen}
							/>
						))}
						{submitted.filter((s) => s.status === Status.PENDING).length === 0 && <Text size="sm" c="dimmed" mt={-10}>None</Text>}
					</Group>
					<Text size="md" fw={700}>Rejected</Text>
					<Group gap="sm">
						{submitted.filter((s) => s.status === Status.REJECTED).map((submitted) => (
							<ContributionPanelItem
								key={submitted.id}
								contribution={submitted}
								openModal={handleModalOpen}
							/>
						))}
						{submitted.filter((s) => s.status === Status.REJECTED).length === 0 && <Text size="sm" c="dimmed" mt={-10}>None</Text>}
					</Group>
					<Text size="md" fw={700}>Accepted</Text>
					<Group gap="sm">
						{submitted.filter((s) => s.status === Status.ACCEPTED).map((submitted) => (
							<ContributionPanelItem
								key={submitted.id}
								contribution={submitted}
								openModal={handleModalOpen}
							/>
						))}
						{submitted.filter((s) => s.status === Status.ACCEPTED).length === 0 && <Text size="sm" c="dimmed" mt={-10}>None</Text>}
					</Group>
				</Stack>
			</Stack>

		</>
	);
}
