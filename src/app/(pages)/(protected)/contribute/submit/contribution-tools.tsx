import { useEffect, useMemo, useRef, useState } from 'react';

import { GoArrowLeft, GoDownload, GoTrash, GoUpload } from 'react-icons/go';

import { Button, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Status } from '@prisma/client';

import { Modal } from '~/components/modal';
import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { submitContributions } from '~/server/data/contributions';

import { ContributionDeleteModal } from './delete-modal';

import type { ContributionWithCoAuthorsAndPoll } from '~/types';

interface Props {
	activeTab: number,
	contributions: ContributionWithCoAuthorsAndPoll[];
	onUpdate: () => void;
	onSubmitHover: (on: boolean) => void;
	onDeleteMode: (on: boolean) => void;

	contributionToDelete: string[];
	setContributionToDelete: (ids: string[]) => void;
}

export function ContributionTools({
	activeTab,
	contributions,
	onUpdate,
	onDeleteMode,
	onSubmitHover,
	contributionToDelete,
	setContributionToDelete,
}: Props) {
	const [windowWidth] = useDeviceSize();

	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)
	const linkRef = useRef<HTMLAnchorElement>(null);

	const ready = useMemo(() => contributions.filter((c) => c.textureId !== null && c.status === Status.DRAFT), [contributions]);

	const [isDeletionMode, setDeletionMode] = useState(false);
	const [isDeleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

	useEffect(() => {
		if (!isDeletionMode) setContributionToDelete([]);
		onDeleteMode(isDeletionMode);
	}, [isDeletionMode, onDeleteMode, setContributionToDelete]);

	const handleContributionsSubmit = () => {
		submitContributions(user.id!, contributions.filter((c) => c.textureId !== null && c.status === Status.DRAFT).map((c) => c.id))
			.then(() => onUpdate());
	};

	const handleContributionsDownload = async () => {
		fetch(`/api/download/contributions/${user.id}`, { method: 'GET' })
			.then((response) => response.blob())
			.then((blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = linkRef.current;

				if (!link) return;

				link.href = url;
				link.download = 'contributions.zip';
				link.click();
				window.URL.revokeObjectURL(url);
			});
	};

	return (
		<Tile
			maw={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 274}
			w="100%"
			radius={5}
			p="xs"
		>
			<Modal
				opened={isDeleteModalOpened}
				onClose={closeDeleteModal}
				title="Confirmation"
				popup
			>
				<ContributionDeleteModal
					contributions={contributions}
					contributionToDelete={contributionToDelete}
					closeModal={(decision) => {
						if (decision === 'yes') onUpdate();

						setDeletionMode(false);
						closeDeleteModal();
					}}
				/>
			</Modal>

			<Stack gap="xs">
				<Button
					variant="gradient"
					gradient={GRADIENT}
					disabled={contributions.length === 0}
					className={contributions.length === 0 ? 'button-disabled-with-bg' : undefined}
					onClick={handleContributionsDownload}
					justify="space-between"
					rightSection={<GoDownload />}
				>
					Download all contributions
					<a ref={linkRef} style={{ display: 'none' }} />
				</Button>

				{!isDeletionMode && (
					<Button
						fullWidth
						variant="gradient"
						gradient={GRADIENT_DANGER}
						onClick={() => setDeletionMode(true)}
						disabled={contributions.length === 0}
						className={contributions.length === 0 ? 'button-disabled-with-bg' : undefined}
						justify="space-between"
						rightSection={<GoTrash />}
					>
						Enable deletion mode
					</Button>
				)}

				{isDeletionMode && (
					<Group gap="xs" wrap="nowrap">
						<Button
							variant="default"
							className="navbar-icon-fix"
							onClick={() => setDeletionMode(false)}
							p={0}
						>
							<GoArrowLeft />
						</Button>
						<Button
							fullWidth
							variant="gradient"
							gradient={GRADIENT_DANGER}
							onClick={openDeleteModal}
							disabled={contributionToDelete.length === 0}
							className={contributionToDelete.length === 0 ? 'button-disabled-with-bg' : undefined}
						>
							Delete {contributionToDelete.length > 1 ? contributionToDelete.length : ''} contribution{contributionToDelete.length > 1 ? 's' : ''}
						</Button>
					</Group>
				)}

				{activeTab === 0 && (
					<Button
						variant="gradient"
						gradient={GRADIENT}
						disabled={ready.length === 0 || isDeletionMode}
						className={(ready.length === 0 || isDeletionMode) ? 'button-disabled-with-bg' : undefined}
						fullWidth
						onClick={() => handleContributionsSubmit()}
						onMouseEnter={() => onSubmitHover(true)}
						onMouseLeave={() => onSubmitHover(false)}
						justify="space-between"
						rightSection={<GoUpload />}
					>
						Submit {ready.length > 1 ? ready.length : ''} draft{ready.length > 1 ? 's' : ''}
					</Button>
				)}
			</Stack>
		</Tile>
	);
}
