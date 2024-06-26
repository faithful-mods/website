import type { ContributionDeactivation, Texture } from '@prisma/client';

import { Stack, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';

import { Modal } from '~/components/modal';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify, sortByName } from '~/lib/utils';
import { getTextures } from '~/server/data/texture';
import { ContributionWithCoAuthors } from '~/types';

import { ContributionDraftItem } from './drafts-item';
import { ContributionDraftModal } from './drafts-modal';

export interface ContributionDraftPanelProps {
	draftContributions: ContributionWithCoAuthors[];
	onUpdate: () => void;
}

export function ContributionDraftPanel({ draftContributions, onUpdate }: ContributionDraftPanelProps) {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modalContribution, setModalContribution] = useState<ContributionWithCoAuthors | null>(null);
	const [contributions, setContributions] = useState<ContributionWithCoAuthors[]>(draftContributions);
	const [textures, setTextures] = useState<(Texture & { disabledContributions: ContributionDeactivation[] })[]>([]);

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

	const openModalWithContribution = (contribution: ContributionWithCoAuthors) => {
		setModalContribution(contribution);
		openModal();
	};

	return (
		<>
			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title="Draft Edition"
			>
				{modalContribution &&
					<ContributionDraftModal
						contribution={modalContribution}
						textures={textures}
						onClose={(editedDraft) => {
							setContributions([
								...contributions.filter((c) => c.id !== editedDraft.id),
								editedDraft,
							].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
							closeModal();
						}}
					/>
				}
			</Modal>

			<Stack gap="sm">
				{contributions.length === 0 && <Text size="sm" c="dimmed">No drafts!</Text>}
				{contributions.length > 0 && <Text size="sm" c="dimmed">These contributions are not yet submitted and only visible by you.</Text>}
				<Group>
					{contributions.map((contribution, index) =>
						<ContributionDraftItem
							key={index}
							contribution={contribution}
							onDelete={() => {
								setContributions(contributions.filter((c) => c.id !== contribution.id));
								onUpdate();
							}}
							openModal={openModalWithContribution}
						/>
					)}
				</Group>
			</Stack>
		</>
	);
}
