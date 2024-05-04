'use client';

import type { Mod } from '@prisma/client';

import { Badge, Button, Card, Group, Modal, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useState, useTransition } from 'react';
import { TbPlus, TbReload } from 'react-icons/tb';

import { DashboardItem } from '~/components/dashboard/dashboard-item';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient, gradientDanger, notify, sortByName } from '~/lib/utils';
import { getMods, modHasUnknownVersion, voidMods } from '~/server/data/mods';

import { ModModal } from './modal/mods-modal';

const ModsPanel = () => {
	const [isPending, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [modalMod, setModalMod] = useState<Mod | undefined>();
	const [mods, setMods] = useState<[(Mod & { unknownVersion: boolean })[], (Mod & { unknownVersion: boolean })[]]>([[], []]);

	const form = useForm<{ search: string }>({
		initialValues: {
			search: '',
		},
	});

	useEffectOnce(() => reloadMods());

	const reloadMods = () => {
		getMods()
			.then((mods) => {
				setMods([mods.sort(sortByName), mods.sort(sortByName)]);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	};

	const openModModal = (mod?: Mod | undefined) => {
		setModalMod(mod);
		openModal();
	};

	const closeModModal = async (editedMod: Mod | string) => {
		const [base, _] = mods ?? [];

		// deleted
		if (typeof editedMod === 'string') {
			const cleared = (base?.filter((modpack) => modpack.id !== editedMod) ?? []).sort(sortByName);
			setMods([cleared, cleared]);
			closeModal();
			return;
		}

		// edited
		const updated = [
			{
				...editedMod,
				unknownVersion: await modHasUnknownVersion(editedMod.id),
			},
			...base?.filter((mod) => mod.id !== editedMod.id) ?? [],
		].sort(sortByName);

		setMods([updated, updated]);
		closeModal();
	};

	const searchMods = (search: string) => {
		if (!mods) return;

		if (!search || search.length === 0) {
			setMods([mods[0], mods[0]]);
			return;
		}

		const filtered = mods[0]?.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setMods([mods[0], filtered]);
	};

	const deleteAllMods = () => {
		startTransition(() => {
			voidMods();
			setMods([[], []]);
		});
	};

	return (
		<>
			<Modal
				size="100%"
				opened={modalOpened}
				onClose={closeModal}
				title="Mod Edition"
			>
				<ModModal mod={modalMod} onClose={closeModModal} />
			</Modal>
			<Card
				shadow="sm"
				padding="md"
				radius="md"
				withBorder
			>
				<Group justify="space-between">
					<Text size="md" fw={700}>Mods</Text>
					<Badge color="teal" variant="filled">{(mods && mods[0]?.length) ?? '?'}</Badge>
				</Group>
				<Group align="center" mt="md" gap="sm" wrap="nowrap">
					<TextInput
						className="w-full"
						placeholder="Search mods..."
						onKeyUp={() => searchMods(form.values.search)}
						{...form.getInputProps('search')}
					></TextInput>
					<Button
						variant='gradient'
						gradient={gradient}
						className="navbar-icon-fix"
						onClick={() => reloadMods()}
					>
						<TbReload />
					</Button>
					<Button
						variant='gradient'
						gradient={gradient}
						className="navbar-icon-fix"
						onClick={() => openModModal()}
					>
						<TbPlus />
					</Button>
				</Group>

				{!mods && (<Text mt="sm">Loading...</Text>)}

				{mods && mods[0]?.length === 0 && (<Text mt="sm">No mods created yet!</Text>)}
				{mods && mods[0]?.length !== 0 && mods[1]?.length === 0 && (<Text mt="sm">No results found!</Text>)}

				{mods && (mods[0]?.length ?? 0) > 0 && (
					<Group mt="md" align="start">
						{mods && mods[1]?.map((mod, index) => (
							<DashboardItem
								key={index}
								image={mod.image}
								title={mod.name}
								description={mod.description}
								onClick={() => openModModal(mod)}
								warning={mod.unknownVersion ? 'Unknown version' : undefined}
							/>
						))}
					</Group>
				)}

				{mods && mods[0] && mods[0].length > 0 &&
					<Group justify="flex-end" mt="md">
						<Button
							variant="gradient"
							gradient={gradientDanger}
							onClick={() => deleteAllMods()}
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
