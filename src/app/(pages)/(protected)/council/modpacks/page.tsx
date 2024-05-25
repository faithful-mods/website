'use client';

import { Badge, Group, Text, TextInput, Button, Select, Pagination } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Modpack, UserRole } from '@prisma/client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { TbPlus } from 'react-icons/tb';

import { DashboardItem } from '~/components/dashboard-item/dashboard-item';
import { Modal } from '~/components/modal';
import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { usePrevious } from '~/hooks/use-previous';
import { ITEMS_PER_PAGE } from '~/lib/constants';
import { gradient, gradientDanger, notify, searchFilter, sortByName } from '~/lib/utils';
import { getModpacks, voidModpacks } from '~/server/data/modpacks';

import { ModpackModal } from './modal/modpack-modal';

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
	const [modpacksShownPerPage, setModpacksShownPerPage] = useState<string | null>(itemsPerPage[0]);

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
			<Tile>
				<Group justify="space-between">
					<Text size="md" fw={700}>Modpacks</Text>
					<Badge color="teal" variant="filled">
						{search === '' ? modpacks.length : `${searchedModpacks.length} / ${modpacks.length}`}
					</Badge>
				</Group>
				<Group align="center" mt="md" gap="sm" wrap="nowrap">
					<Button
						variant='gradient'
						gradient={gradient}
						className="navbar-icon-fix"
						onClick={() => handleModalOpen()}
					>
						<TbPlus />
					</Button>
					<TextInput
						className="w-full"
						placeholder="Search modpacks..."
						onChange={(e) => setSearch(e.currentTarget.value)}
					/>
					<Select
						data={itemsPerPage}
						value={modpacksShownPerPage}
						onChange={setModpacksShownPerPage}
						withCheckIcon={false}
						w={120}
					/>
				</Group>

				{modpacks.length === 0 && (
					<Group justify="center">
						<Text mt="md" size="sm" c="dimmed">No modpacks created yet!</Text>
					</Group>
				)}

				{modpacks.length !== 0 && searchedModpacks.length === 0 && (
					<Group justify="center">
						<Text mt="md" size="sm" c="dimmed">No results found!</Text>
					</Group>
				)}

				{searchedModpacks.length > 0 && (
					<Group mt="md" align="start">
						{modpacksShown[activePage - 1] && modpacksShown[activePage - 1].map((modpack, index) => (
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
							gradient={gradientDanger}
							onClick={() => handleVoid()}
							loading={isPending}
							disabled={isPending}
						>
							Delete All Modpacks
						</Button>
					</Group>
				}
			</Tile>
		</>
	);
};

export default ModpacksPanel;
