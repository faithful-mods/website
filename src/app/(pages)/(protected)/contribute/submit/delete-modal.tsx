import { Button, Group, Stack, Text } from '@mantine/core';

import { useCurrentUser } from '~/hooks/use-current-user';
import { GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { deleteContributions } from '~/server/data/contributions';

import { ContributionPanelItem } from './contribution-item';

import type { ContributionWithCoAuthors } from '~/types';

export interface ContributionDeleteModalProps {
	contributionsAndDrafts: ContributionWithCoAuthors[];
	contributionToDelete: string[];
	closeModal: (decision: 'yes' | 'no') => void;
}

export function ContributionDeleteModal({ contributionsAndDrafts, contributionToDelete, closeModal }: ContributionDeleteModalProps) {
	const userId = useCurrentUser()!.id!;

	const handleContributionsDelete = async () => {
		await deleteContributions(userId, contributionToDelete);
		closeModal('yes');
	};

	return (
		<Stack gap="md">
			<Stack gap={0}>
				<Text size="sm">Are you sure you want to delete {contributionToDelete.length} contribution{contributionToDelete.length > 1 ? 's' : ''} ?</Text>
				<Text size="sm" c="red">
					Please note that this action is irreversible and the contribution{contributionToDelete.length > 1 ? 's' : ''} will be permanently deleted.
				</Text>
			</Stack>
			<Stack>
				<Text>
					Contribution{contributionToDelete.length > 1 ? 's' : ''} to delete :
				</Text>
				<Group gap="sm">
					{contributionToDelete.map((id) =>
						<ContributionPanelItem
							key={id}
							contribution={contributionsAndDrafts.find((c) => c.id === id)!}
						/>
					)}
				</Group>
			</Stack>
			<Group gap="sm" wrap="nowrap">
				<Button
					variant="gradient"
					gradient={GRADIENT}
					onClick={() => closeModal('no')}
					fullWidth
				>
					No
				</Button>
				<Button
					variant="gradient"
					gradient={GRADIENT_DANGER}
					onClick={handleContributionsDelete}
					fullWidth
				>
					Yes
				</Button>
			</Group>
		</Stack>
	);
}
