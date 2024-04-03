import type { Texture } from '@prisma/client';

import { Card, Stack, Group, Image, Badge, Text, Modal, Skeleton, Select, Button, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify } from '~/lib/utils';
import { getTextures } from '~/server/data/texture';
import { ContributionWithCoAuthors } from '~/types';

import { ContributionDraftModal } from './drafts-modal';
import { ContributionDraftItem } from '../contribution-draft-item';

export function ContributionDraftPanel({ draftContributions }: { draftContributions: ContributionWithCoAuthors[] }) {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modalContribution, setModalContribution] = useState<ContributionWithCoAuthors | null>(null);
	const [contributions, setContributions] = useState<ContributionWithCoAuthors[]>(draftContributions);
	const [textures, setTextures] = useState<Texture[]>([]);

	useEffectOnce(() => {
		getTextures()
			.then(setTextures)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch textures', 'red');
			});
	})

	const openModalWithContribution = (contribution: ContributionWithCoAuthors) => {
		setModalContribution(contribution);
		openModal();
	}

	return (
		<>
			<Modal
				size="100%"
				opened={modalOpened} 
				onClose={closeModal} 
				title="Texture Contribution Edition"
			>
				{modalContribution && <ContributionDraftModal contribution={modalContribution} textures={textures} />}
			</Modal>
			<Card withBorder shadow="sm" radius="md" padding="md">
				<Stack gap="sm">
					<Group justify="space-between">
						<Text size="md" fw={700}>Draft contribution(s)</Text>
						<Badge color="teal" variant="filled">{contributions.length}</Badge>
					</Group>
					<Text size="sm" c="dimmed">These contributions are not yet submitted and only visible by you.</Text>
					<Group>
						{contributions.map((contribution, index) => 
							<ContributionDraftItem 
								key={index} 
								contribution={contribution} 
								onDelete={() => {
									setContributions(contributions.filter((c) => c.id !== contribution.id));
								}} 
								openModal={openModalWithContribution} 
							/>
						)}
					</Group>
				</Stack>
			</Card>
		</>
	)
}