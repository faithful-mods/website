'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

import { Badge, Button, Group, Pagination, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useDisclosure, usePrevious, useViewportSize } from '@mantine/hooks';
import { UserRole } from '@prisma/client';

import { DashboardItem } from '~/components/dashboard-item/dashboard-item';
import { Modal } from '~/components/modal';
import { ModUpload } from '~/components/mods-upload';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, GRADIENT_DANGER, ITEMS_PER_PAGE, ITEMS_PER_PAGE_DEFAULT } from '~/lib/constants';
import { searchFilter, sortByName } from '~/lib/utils';
import { getMods, modHasUnknownVersion, voidMods } from '~/server/data/mods';

import { ModModal } from './modal/mods-modal';

import type { Mod } from '@prisma/client';

type ModWVer = Mod & { unknownVersion: boolean };

const ModsPanel = () => {
	const user = useCurrentUser()!;
	const { width } = useViewportSize();

	const [isPending, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const [activePage, setActivePage] = useState(1);
	const [modsShownPerPage, setModsShownPerPage] = useState<string>(ITEMS_PER_PAGE_DEFAULT);
	const [search, setSearch] = useState('');

	const [mods, setMods] = useState<ModWVer[]>([]);
	const [modsShown, setModsShown] = useState<ModWVer[][]>([[]]);
	const [searchedMods, setSearchedMods] = useState<ModWVer[]>([]);
	const [modalMod, setModalMod] = useState<Mod | undefined>();

	const prevSearchedMods = usePrevious(searchedMods);

	const [showUnknown, setShowUnknown] = useState(false);

	const init = async () => {
		const mods = await getMods();
		setMods(mods);
		setSearchedMods(mods);
	};

	useEffectOnce(() => {
		init();
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
		const newMod = (typeof editedMod === 'string') ? null : { ...editedMod, unknownVersion: await modHasUnknownVersion(editedMod.id) };
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

	const handleOnUpload = () => {
		startTransition(() => {
			init();
			setSearch('');
		});
	};

	return (
		<>
			{modalMod && (
				<Modal
					opened={modalOpened}
					onClose={closeModal}
					title={modalMod.name}
				>
					<ModModal mod={modalMod} onClose={handleModalClose} />
				</Modal>
			)}
			<Stack gap="sm">
				<Stack gap={0}>
					<Group justify="space-between">
						<Text size="md" fw={700}>Mods</Text>
						<Badge color="teal" variant="filled">
							{search === '' ? mods.length : `${searchedMods.length} / ${mods.length}`}
						</Badge>
					</Group>
					<Text c="dimmed" size="sm">
						On this page you can view and manage all mods.
					</Text>
				</Stack>

				<ModUpload onUpload={handleOnUpload} />

				<Group
					align="center"
					gap="sm"
					wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
				>
					<Group align="center" gap="sm" wrap="nowrap" className="w-full">
						<Select
							data={itemsPerPage}
							value={modsShownPerPage}
							onChange={(e) => e ? setModsShownPerPage(e) : null}
							label="Items per page"
							withCheckIcon={false}
							w={250}
						/>
						<TextInput
							className="w-full"
							placeholder="Search mods..."
							label="Search"
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
					</Group>

					<Switch
						label="Only show mods with unknown MC version"
						mt={width <= BREAKPOINT_MOBILE_LARGE ? 0 : 22}
						className="w-full"
						checked={showUnknown}
						onChange={(e) =>{
							setShowUnknown(e.currentTarget.checked);
						}}
					/>
				</Group>
			</Stack>

			{mods.length === 0 && (
				<Group
					align="center"
					justify="center"
					h="100px"
					w="100%"
					gap="md"
					style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
				>
					<Text c="dimmed">No mods to show :(</Text>
				</Group>
			)}

			{mods.length !== 0 && searchedMods.length === 0 && (
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

			{searchedMods.length > 0 && (
				<Group mt="md" align="start">
					{modsShown[activePage - 1] && modsShown[activePage - 1]?.map((mod, index) => (
						<DashboardItem
							key={index}
							image={mod.image}
							title={mod.name}
							description={mod.description}
							onClick={() => handleModalOpen(mod)}
							warning={mod.unknownVersion ? true : undefined}
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
							gradient={GRADIENT_DANGER}
							onClick={() => handleVoid()}
							loading={isPending}
							disabled={isPending}
						>
							Delete All Mods
						</Button>
					</Group>
			}
		</>
	);
};

export default ModsPanel;
