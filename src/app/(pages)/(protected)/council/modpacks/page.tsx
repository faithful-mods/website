'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

import { Badge, Group, Text, TextInput, Button, Select, Pagination, Stack } from '@mantine/core';
import { useDisclosure, usePrevious } from '@mantine/hooks';
import { UserRole } from '@prisma/client';

import { DashboardItem } from '~/components/dashboard-item/dashboard-item';
import { Modal } from '~/components/modal';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { GRADIENT, GRADIENT_DANGER, ITEMS_PER_PAGE, ITEMS_PER_PAGE_DEFAULT } from '~/lib/constants';
import { notify, searchFilter, sortByName } from '~/lib/utils';
import { getModpacks, voidModpacks } from '~/server/data/modpacks';

import { ModpackModal } from './modal/modpack-modal';

import type { Modpack } from '@prisma/client';

const ModpacksPanel = () => {
	const user = useCurrentUser()!;
	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);

	const [isPending, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [search, setSearch] = useState('');
	const [modpacks, setModpacks] = useState<Modpack[]>([]);
	const [searchedModpacks, setSearchedModpacks] = useState<Modpack[]>([]);
	const [modalModpack, setModalModpack] = useState<Modpack | undefined>();

	const [modpacksShown, setModpacksShown] = useState<Modpack[][]>([[]]);
	const [activePage, setActivePage] = useState(1);
	const [modpacksShownPerPage, setModpacksShownPerPage] = useState<string>(ITEMS_PER_PAGE_DEFAULT);

	const prevSearchedModpacks = usePrevious(searchedModpacks);

	useEffectOnce(() => {
		getModpacks()
			.then((modpacks) => {
				const sorted = modpacks.sort(sortByName);
				setModpacks(sorted);
				setSearchedModpacks(sorted);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	useEffect(() => {
		const chunks: Modpack[][] = [];
		const int = parseInt(modpacksShownPerPage ?? itemsPerPage[0]);

		for (let i = 0; i < searchedModpacks.length; i += int) {
			chunks.push(searchedModpacks.slice(i, i + int));
		}

		if (!prevSearchedModpacks || prevSearchedModpacks.length !== searchedModpacks.length) {
			setActivePage(1);
		}

		setModpacksShown(chunks);
	}, [searchedModpacks, modpacksShownPerPage, prevSearchedModpacks, itemsPerPage]);

	useEffect(() => {
		if (!search) {
			setSearchedModpacks(modpacks);
			return;
		}

		setSearchedModpacks(
			modpacks
				.filter(searchFilter(search))
				.sort(sortByName)
		);
	}, [search, modpacks]);

	const handleModalOpen = (modpack?: Modpack | undefined) => {
		setModalModpack(modpack);
		openModal();
	};

	const handleModalClose = (editedModpack: Modpack | string) => {
		const newModpack = typeof editedModpack === 'string' ? null : editedModpack;
		const newModpacks = modpacks.filter((modpack) => modpack.id !== (typeof editedModpack === 'string' ? editedModpack : editedModpack?.id));

		if (newModpack) newModpacks.push(newModpack);

		setModpacks(newModpacks.sort(sortByName));
		setSearch(search); // re-search

		closeModal();
	};

	const handleVoid = () => {
		startTransition(() => {
			voidModpacks();
			setModpacks([]);
			setModpacksShown([]);
			setSearchedModpacks([]);
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
							{search === '' ? modpacks.length : `${searchedModpacks.length} / ${modpacks.length}`}
						</Badge>
					</Group>
					<Text c="dimmed" size="sm">
						On this page you can view and manage all modpacks.
					</Text>
				</Stack>

				<Group align="end" gap="sm" wrap="nowrap">
					<TextInput
						label="Search"
						className="w-full"
						placeholder="Search modpacks..."
						onChange={(e) => setSearch(e.currentTarget.value)}
					/>
					<Select
						label="Items per page"
						data={itemsPerPage}
						value={modpacksShownPerPage}
						onChange={(e) => e ? setModpacksShownPerPage(e) : null}
						withCheckIcon={false}
						w={120}
					/>
					<Button
						variant='gradient'
						gradient={GRADIENT}
						onClick={() => handleModalOpen()}
						w={200}
					>
						Add Modpack
					</Button>
				</Group>

				{modpacks.length === 0 && (
					<Group
						align="center"
						justify="center"
						h="100px"
						w="100%"
						gap="md"
						style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
					>
						<Text c="dimmed">No modpacks to show :(</Text>
					</Group>
				)}

				{modpacks.length !== 0 && searchedModpacks.length === 0 && (
					<Group
						align="center"
						justify="center"
						h="100px"
						w="100%"
						gap="md"
						style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
					>
						<Text c="dimmed">No results for &quot;{search}&quot;</Text>
					</Group>
				)}

				{searchedModpacks.length > 0 && (
					<Group mt="md" align="start">
						{modpacksShown[activePage - 1] && modpacksShown[activePage - 1]?.map((modpack, index) => (
							<DashboardItem
								key={index}
								image={modpack.image}
								title={modpack.name}
								description={modpack.description}
								onClick={() => handleModalOpen(modpack)}
							/>
						))}
					</Group>
				)}

				<Group mt="md" justify="center">
					<Pagination total={modpacksShown.length} value={activePage} onChange={setActivePage} />
				</Group>

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

export default ModpacksPanel;
