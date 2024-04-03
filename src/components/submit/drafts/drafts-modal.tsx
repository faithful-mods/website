import type { Texture } from '@prisma/client';

import { Button, Group, Image, Select, Skeleton, Stack, Text, TextInput } from '@mantine/core';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import type { ContributionWithCoAuthors } from '~/types';

export interface ContributionDraftModalProps {
	contribution: ContributionWithCoAuthors;
	textures: Texture[];
}

export function ContributionDraftModal({ contribution, textures }: ContributionDraftModalProps) {
	const modalImageWidth = 360;

	return (
		<Group gap="md" className="w-full h-full" wrap="nowrap" justify="space-evenly" align="start">
			<Stack gap="md" className="w-full h-full" align="center" justify="space-between">
				<Stack gap="0" style={{ width: `${modalImageWidth}px` }}>
					<Text size="md" fw={700}>Your Contribution</Text>
					<Text size="sm" c="dimmed">This is the contribution you are currently editing.</Text>
				</Stack>
				<Image 
					src={contribution.file}
					className="image-background image-pixelated"
					width={modalImageWidth}
					height={modalImageWidth}
					fit="contain"
					style={{ maxWidth: `${modalImageWidth}px`, maxHeight: `${modalImageWidth}px`, minWidth: `${modalImageWidth}px`, minHeight: `${modalImageWidth}px` }} 
					alt=""
				/>
				<TextInput value={contribution.filename} disabled />
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
	)
}