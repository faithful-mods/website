'use client';

import { Badge, Button, Card, Group, Pagination, Select, Switch, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { UserRole, Mod } from '@prisma/client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { TbPlus } from 'react-icons/tb';

import { DashboardItem } from '~/components/dashboard-item/dashboard-item';
import { Modal } from '~/components/modal';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { usePrevious } from '~/hooks/use-previous';
import { ITEMS_PER_PAGE } from '~/lib/constants';
import { gradient, gradientDanger, notify, searchFilter, sortByName } from '~/lib/utils';
import { getMods, modHasUnknownVersion, voidMods } from '~/server/data/mods';

import { ModModal } from './modal/mods-modal';

type ModWVer = Mod & { unknownVersion: boolean };

const ModsPanel = () => {
	const user = useCurrentUser()!;

	const [isPending, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const [activePage, setActivePage] = useState(1);
	const [modsShownPerPage, setModsShownPerPage] = useState<string | null>(itemsPerPage[0]);
	const [search, setSearch] = useState('');

	const [mods, setMods] = useState<ModWVer[]>([]);
	const [modsShown, setModsShown] = useState<ModWVer[][]>([[]]);
	const [searchedMods, setSearchedMods] = useState<ModWVer[]>([]);
	const [modalMod, setModalMod] = useState<Mod | undefined>();

	const prevSearchedMods = usePrevious(searchedMods);

	const [showUnknown, setShowUnknown] = useState(false);

	useEffectOnce(() => {
		getMods()
			.then((mods) => {
				const sorted = mods.sort(sortByName);
				setMods(sorted);
				setSearchedMods(sorted);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	useEffect(() => {
		const chunks: ModWVer[][] = [];
		const int = parseInt(modsShownPerPage ?? itemsPerPage[0]);

		for (let i = 0; i < searchedMods.length; i += int) {
			chunks.push(searchedMods.slice(i, i + int));
		}

		if (!prevSearchedMods || prevSearchedMods.length !== searchedMods.length) {
			setActivePage(1);
		}

		setModsShown(chunks);
	}, [searchedMods, modsShownPerPage, prevSearchedMods, itemsPerPage]);

	useEffect(() => {
		if (!search) {
			setSearchedMods(mods.filter((m) => showUnknown ? m.unknownVersion === true : true));
			return;
		}

		setSearchedMods(
			mods
				.filter((m) => showUnknown ? m.unknownVersion === true : true)
				.filter(searchFilter(search))
				.sort(sortByName)
		);

	}, [search, mods, showUnknown]);

	const handleModalOpen = (mod?: Mod | undefined) => {
		setModalMod(mod);
		openModal();
	};

	const handleModalClose = async (editedMod: Mod | string) => {
		const newMod = (typeof editedMod === 'string') ? null : {...editedMod, unknownVersion: await modHasUnknownVersion(editedMod.id) };
		const newMods = mods.filter((mod) => mod.id !== (typeof editedMod === 'string' ? editedMod : editedMod?.id));

		if (newMod) newMods.push(newMod);

		setMods(newMods.sort(sortByName));
		setSearch(search); // re-search

		closeModal();
	};

	const handleVoid = () => {
		startTransition(() => {
			voidMods();
			setMods([]);
			setModsShown([]);
			setSearchedMods([]);
		});
	};

	return (
		<>
			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title={modalMod ? modalMod.name : 'Add new mods'}
			>
				<ModModal mod={modalMod} onClose={handleModalClose} />
			</Modal>
			<Card
				shadow="sm"
				padding="md"
				radius="md"
				withBorder
			>
				<Group justify="space-between">
					<Text size="md" fw={700}>Mods</Text>
					<Badge color="teal" variant="filled">
						{search === '' ? mods.length : `${searchedMods.length} / ${mods.length}`}
					</Badge>
				</Group>
				<Text c="dimmed" size="sm">
					Here you can manage mods and their versions. Click on a mod to view or edit it.
				</Text>
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
						placeholder="Search mods..."
						onChange={(e) => setSearch(e.currentTarget.value)}
					/>
					<Select
						data={itemsPerPage}
						value={modsShownPerPage}
						onChange={setModsShownPerPage}
						withCheckIcon={false}
						w={120}
					/>
				</Group>

				<Switch
					mt="md"
					label="Only show mods with unknown MC version"
					checked={showUnknown}
					onChange={(e) =>{
						setShowUnknown(e.currentTarget.checked);
					}}
				/>

				{mods.length === 0 && (
					<Group justify="center">
						<Text mt="md" size="sm" c="dimmed">No mods created yet!</Text>
					</Group>
				)}

				{mods.length !== 0 && searchedMods.length === 0 && (
					<Group justify="center">
						<Text mt="md" size="sm" c="dimmed">No results found!</Text>
					</Group>
				)}

				{searchedMods.length > 0 && (
					<Group mt="md" align="start">
						{modsShown[activePage - 1] && modsShown[activePage - 1].map((mod, index) => (
							<DashboardItem
								key={index}
								image={mod.image}
								title={mod.name}
								description={mod.description}
								onClick={() => handleModalOpen(mod)}
								warning={mod.unknownVersion ? 'Unknown version' : undefined}
							/>
						))}
					</Group>
				)}

				<Group mt="md" justify="center">
					<Pagination total={modsShown.length} value={activePage} onChange={setActivePage} />
				</Group>

				{mods.length > 0 && user.role === UserRole.ADMIN &&
					<Group justify="flex-end" mt="md">
						<Button
							variant="gradient"
							gradient={gradientDanger}
							onClick={() => handleVoid()}
							loading={isPending}
							disabled={isPending}
						>
							Delete All Mods
						</Button>
					</Group>
				}
			</Card>
		</>
	);
};

export default ModsPanel;
