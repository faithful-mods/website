'use client';

import { useState, useTransition } from 'react';

import { Badge, Group, Text, Button, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { UserRole } from '@prisma/client';

import { Modal } from '~/components/base/modal';
import { PaginatedList } from '~/components/base/paginated-list';
import { DashboardItem } from '~/components/dashboard-item/dashboard-item';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { notify, sortByName } from '~/lib/utils';
import { getModpacks, voidModpacks } from '~/server/data/modpacks';

import { ModpackModal } from './modal/modpack-modal';

import type { Modpack } from '@prisma/client';

export default function ModpacksPage() {
	const user = useCurrentUser()!;

	const [isPending, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [modpacks, setModpacks] = useState<Modpack[]>([]);
	const [modalModpack, setModalModpack] = useState<Modpack | undefined>();

	const [search, setSearch] = useState('');
	const [searchedModpacks, setSearchedModpacks] = useState<number>(0);

	useEffectOnce(() => {
		getModpacks()
			.then((modpacks) => {
				const sorted = modpacks.sort(sortByName);
				setModpacks(sorted);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	const handleModalOpen = (modpack?: Modpack | undefined) => {
		setModalModpack(modpack);
		openModal();
	};

	const handleModalClose = (editedModpack: Modpack | string) => {
		const newModpack = typeof editedModpack === 'string' ? null : editedModpack;
		const newModpacks = modpacks.filter((modpack) => modpack.id !== (typeof editedModpack === 'string' ? editedModpack : editedModpack?.id));

		if (newModpack) newModpacks.push(newModpack);

		setModpacks(newModpacks.sort(sortByName));
		closeModal();
	};

	const handleVoid = () => {
		startTransition(() => {
			voidModpacks();
			setModpacks([]);
		});
	};

	return (
		<>
			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title="Modpack Edition"
			>
				<ModpackModal modpack={modalModpack} onClose={handleModalClose} />
			</Modal>

			<Stack gap="sm">
				<Stack gap={0}>
					<Group justify="space-between">
						<Text size="md" fw={700}>Modpacks</Text>
						<Badge color="teal" variant="filled">
							{search === '' ? modpacks.length : `${searchedModpacks} / ${modpacks.length}`}
						</Badge>
					</Group>
					<Text c="dimmed" size="sm">
						On this page you can view and manage all modpacks.
					</Text>
				</Stack>

				<PaginatedList
					items={modpacks}

					onUpdate={({ search, searchResults }) => {
						setSearch(search);
						setSearchedModpacks(searchResults);
					}}

					rightFilters={
						<Button
							variant='gradient'
							gradient={GRADIENT}
							onClick={() => handleModalOpen()}
							w={200}
						>
							Add Modpack
						</Button>
					}

					renderItem={(modpack) => (
						<DashboardItem
							key={modpack.id}
							image={modpack.image}
							title={modpack.name}
							description={modpack.description}
							onClick={() => handleModalOpen(modpack)}
						/>
					)}
				/>

				{modpacks.length > 0 && user.role === UserRole.ADMIN &&
					<Group justify="flex-end" mt="md">
						<Button
							variant="gradient"
							gradient={GRADIENT_DANGER}
							onClick={() => handleVoid()}
							loading={isPending}
							disabled={isPending}
						>
							Delete All Modpacks
						</Button>
					</Group>
				}
			</Stack>
		</>
	);
};
