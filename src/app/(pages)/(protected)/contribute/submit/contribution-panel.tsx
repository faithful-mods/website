import { startTransition, useEffect, useMemo, useState } from 'react';

import { Button, Checkbox, Divider, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Status } from '@prisma/client';

import { Modal } from '~/components/modal';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, gradientDanger, notify, sortByName } from '~/lib/utils';
import { submitContributions } from '~/server/data/contributions';
import { getTextures } from '~/server/data/texture';

import { ContributionPanelItem } from './contribution-item';
import { ContributionDeleteModal } from './delete-modal';
import { ContributionModal } from './drafts-modal';

import type { ContributionDeactivation, Texture } from '@prisma/client';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll } from '~/types';

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

	const [isDeletionMode, setDeletionMode] = useState(false);
	const [isDeleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
	const [contributionToDelete, setContributionToDelete] = useState<string[]>([]);

	const pending = useMemo(() => submitted.filter((s) => s.status === Status.PENDING), [submitted]);
	const rejected = useMemo(() => submitted.filter((s) => s.status === Status.REJECTED), [submitted]);
	const accepted = useMemo(() => submitted.filter((s) => s.status === Status.ACCEPTED), [submitted]);

	const handleContributionClick = (c: ContributionWithCoAuthors | ContributionWithCoAuthorsAndPoll) => {
		if (isDeletionMode) {
			if (contributionToDelete.includes(c.id)) setContributionToDelete(contributionToDelete.filter((id) => id !== c.id));
			else setContributionToDelete([...contributionToDelete, c.id]);
		}
		else {
			setModalContribution(c);
			openModal();
		}
	};

	const handleContributionsSubmit = () => {
		startTransition(() => {
			submitContributions(author.id!, drafts.filter((c) => c.textureId !== null).map((c) => c.id));
			onUpdate();
		});
	};

	const getBorderStyles = (c: ContributionWithCoAuthors | ContributionWithCoAuthorsAndPoll) => {
		if (contributionToDelete.includes(c.id))
			return { boxShadow: '0 0 10px var(--mantine-color-red-filled)' };

		if (c.textureId !== null && isHoveringSubmit && c.status === Status.DRAFT)
			return { boxShadow: '0 0 10px var(--mantine-color-teal-filled)' };
	};

	useEffect(() => {
		if (!isDeletionMode) setContributionToDelete([]);
	}, [isDeletionMode]);

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

	return (
		<>
			<Modal
				opened={isDeleteModalOpened}
				onClose={closeDeleteModal}
				title="Confirmation"
				popup
			>
				<ContributionDeleteModal
					contributionsAndDrafts={[...drafts, ...submitted]}
					contributionToDelete={contributionToDelete}
					closeModal={(decision) => {
						if (decision === 'yes') onUpdate();
						setDeletionMode(false);
						closeDeleteModal();
					}}
				/>
			</Modal>
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
				<Group
					wrap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
					w="100%"
					mb="md"
				>
					<Button
						variant="gradient"
						gradient={gradient}
						disabled={ready.length === 0 || isDeletionMode}
						className={(ready.length === 0 || isDeletionMode) ? 'button-disabled-with-bg' : undefined}
						fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
						onClick={() => handleContributionsSubmit()}
						onMouseEnter={() => setHoveringSubmit(true)}
						onMouseLeave={() => setHoveringSubmit(false)}
					>
						Submit {ready.length > 1 ? ready.length : ''} draft{ready.length > 1 ? 's' : ''}
					</Button>

					{windowWidth > BREAKPOINT_MOBILE_LARGE && (
						<Divider orientation="vertical" size="sm" h={20} mt="auto" mb="auto" />
					)}

					<Group
						gap="md"
						wrap="nowrap"
						className="w-full"
						maw={BREAKPOINT_MOBILE_LARGE}
					>
						<Button
							variant="gradient"
							gradient={gradientDanger}
							disabled={!isDeletionMode || contributionToDelete.length === 0}
							className={(!isDeletionMode || contributionToDelete.length === 0) ? 'w-full button-disabled-with-bg' : 'w-full'}
							onClick={openDeleteModal}
						>
							Delete {contributionToDelete.length > 1 ? contributionToDelete.length : ''} contribution{contributionToDelete.length > 1 ? 's' : ''}
						</Button>
						<Checkbox
							label="Delete mode"
							color={gradientDanger.to}
							checked={isDeletionMode}
							className="w-full"
							onChange={(e) => setDeletionMode(e.target.checked)}
							disabled={drafts.length === 0 && submitted.length === 0}
						/>
					</Group>
				</Group>

				<Stack gap={0}>
					<Text size="md" fw={700}>Draft(s)</Text>
					<Text size="sm" c="dimmed">These contributions are not yet submitted and only visible by you.</Text>
				</Stack>
				<Group gap="sm">
					{drafts.map((draft) => (
						<ContributionPanelItem
							key={draft.id}
							contribution={draft}
							onClick={handleContributionClick}
							styles={getBorderStyles(draft)}
						/>
					))}
					{drafts.length === 0 && (
						<Text size="sm" c="dimmed" fs="italic">
							No drafts.
						</Text>
					)}
				</Group>

				<Divider mt="md" mb="sm" />

				<Stack gap={0} mb="sm">
					<Text size="md" fw={700}>Pending</Text>
					<Text size="sm" c="dimmed">These contributions are awaiting review from the council.</Text>
				</Stack>
				<Group gap="sm">
					{pending.map((submitted) => (
						<ContributionPanelItem
							key={submitted.id}
							contribution={submitted}
							onClick={handleContributionClick}
							styles={getBorderStyles(submitted)}
						/>
					))}
					{pending.length === 0 && (
						<Text size="sm" c="dimmed" mt={-10} fs="italic">
							No contributions pending yet.
						</Text>
					)}
				</Group>

				<Divider mt="md" mb="sm" />

				<Stack gap={0} mb="sm">
					<Text size="md" fw={700}>Rejected</Text>
					<Text size="sm" c="dimmed">The council has rejected these contributions. You can edit and resubmit them within 6 months.</Text>
				</Stack>
				<Group gap="sm">
					{rejected.map((submitted) => (
						<ContributionPanelItem
							key={submitted.id}
							contribution={submitted}
							onClick={handleContributionClick}
							styles={getBorderStyles(submitted)}
						/>
					))}
					{rejected.length === 0 && (
						<Text size="sm" c="dimmed" mt={-10} fs="italic">
							No contributions rejected yet. Keep up the good work!
						</Text>
					)}
				</Group>
				<Divider mt="md" mb="sm" />
				<Stack gap={0} mb="sm">
					<Text size="md" fw={700}>Accepted</Text>
					<Text size="sm" c="dimmed">These contributions are live on the website.</Text>
				</Stack>
				<Group gap="sm">
					{accepted.map((submitted) => (
						<ContributionPanelItem
							key={submitted.id}
							contribution={submitted}
							onClick={handleContributionClick}
							styles={getBorderStyles(submitted)}
						/>
					))}
					{accepted.length === 0 && (
						<Text size="sm" c="dimmed" mt={-10} fs="italic">
							No contributions accepted yet. Submit some drafts!
						</Text>
					)}
				</Group>
			</Stack>
		</>
	);
}
