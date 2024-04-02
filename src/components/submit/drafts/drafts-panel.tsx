import type { Texture } from '@prisma/client';

import { Card, Stack, Group, Image, Badge, Text, Modal, Skeleton, Select, Button, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify } from '~/lib/utils';
import { getTextures } from '~/server/data/texture';
import { ContributionWithCoAuthors } from '~/types';

import { ContributionDraftItem } from '../contribution-draft-item';

export function ContributionDraftPanel({ draftContributions }: { draftContributions: ContributionWithCoAuthors[] }) {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modalContribution, setModalContribution] = useState<ContributionWithCoAuthors | null>(null);
	const [textures, setTextures] = useState<Texture[]>([]);

	const modalImageWidth = 360;

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
				<Group gap="md" className="w-full h-full" wrap="nowrap" justify="space-evenly" align="start">
					<Stack gap="md" className="w-full h-full" align="center" justify="space-between">
						<Stack gap="0" style={{ width: `${modalImageWidth}px` }}>
							<Text size="md" fw={700}>Your Contribution</Text>
							<Text size="sm" c="dimmed">This is the contribution you are currently editing.</Text>
						</Stack>
						<Image 
							src={modalContribution?.file}
							className="image-background image-pixelated"
							width={modalImageWidth}
							height={modalImageWidth}
							fit="contain"
							style={{ maxWidth: `${modalImageWidth}px`, maxHeight: `${modalImageWidth}px`, minWidth: `${modalImageWidth}px`, minHeight: `${modalImageWidth}px` }} 
							alt=""
						/>
						<TextInput value={modalContribution?.filename} disabled />
					</Stack>
					<Stack gap="md" className="w-full h-full" align="center" justify="space-between">
						<Stack gap="0" style={{ width: `${modalImageWidth}px` }}>
							<Text size="md" fw={700}>Default Texture</Text>
							<Text size="sm" c="dimmed">This is the texture that will be contributed to.</Text>
						</Stack>
						<Skeleton width={modalImageWidth} height={modalImageWidth} radius="0" animate={false} />
						<Select />
					</Stack>
					<Stack gap="md" className="w-full h-full" align="center" justify="space-between">
						<Stack gap="0" style={{ width: `${modalImageWidth}px` }}>
							<Text size="md" fw={700}>Others Contributions</Text>
							<Text size="sm" c="dimmed">Existing contribution for the selected texture.</Text>
						</Stack>
						<Skeleton width={modalImageWidth} height={modalImageWidth} radius="0" animate={false} />
						<Group gap="md">
							<Button variant="light"><FaChevronLeft/></Button>
							<Button variant="light"><FaChevronRight/></Button>
						</Group>
					</Stack>
				</Group>
			</Modal>
			<Card withBorder shadow="sm" radius="md" padding="md">
				<Stack gap="sm">
					<Group justify="space-between">
						<Text size="md" fw={700}>Draft contribution(s)</Text>
						<Badge color="teal" variant="filled">{draftContributions.length}</Badge>
					</Group>
					<Text size="sm" c="dimmed">These contributions are not yet submitted and only visible by you.</Text>
					<Group>
						{draftContributions.map((contribution, index) => 
							<ContributionDraftItem key={index} contribution={contribution} openModal={openModalWithContribution} />
						)}
					</Group>
				</Stack>
			</Card>
		</>
	)
}