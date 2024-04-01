import type { Mod } from '@prisma/client';

import { Badge, Button, Card, Group, Image, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { TbPlus } from 'react-icons/tb';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient, notify, sortByName } from '~/lib/utils';
import { getMods } from '~/server/data/mods';

import { ModModal } from './modal/mods-modal';

export function ModsPanel() {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	
	const [modalMod, setModalMod] = useState<Mod | undefined>();
	const [mods, setMods] = useState<[Mod[] | undefined, Mod[] | undefined]>();
	
	const form = useForm<{ search: string }>({
		initialValues: {
			search: '',
		},
	});

	const openModModal = (mod?: Mod | undefined) => {
		setModalMod(mod);
		openModal();
	};

	const closeModModal = (editedMod: Mod | string) => {
		const [base, _] = mods ?? [];

		// deleted
		if (typeof editedMod === 'string') {
			
			const cleared = (base?.filter((modpack) => modpack.id !== editedMod) ?? []).sort(sortByName);
			setMods([cleared, cleared]);
			closeModal();
			return;
		}

		// edited
		const updated = [...base?.filter((modpack) => modpack.id !== editedMod.id) ?? [], editedMod].sort(sortByName);
		setMods([updated, updated]);
		closeModal();
	}

	const searchMods = (search: string) => {
		if (!mods) return;

		if (!search || search.length === 0) {
			setMods([mods[0], mods[0]]);
			return;
		}

		const filtered = mods[0]?.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setMods([mods[0], filtered]);
	}

	useEffectOnce(() => {
		getMods()
			.then((mods) => {
				setMods([mods.sort(sortByName), mods.sort(sortByName)]);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});
	
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
							<Stack gap={5} key={index}>
								<Image
									radius="sm"
									className="cursor-pointer image-background"
									onClick={() => openModModal(mod)}
									src={mod.image ?? './icon.png'}
									alt={mod.name}
									width={90}
									height={90}
									fit="contain"
									style={{ maxWidth: '90px', maxHeight: '90px', minWidth: '90px', minHeight: '90px' }} 
								/>
								<Text size="sm" ta="center" maw={90} truncate="end">{mod.name}</Text>
							</Stack>
						))}
					</Group>
				)}
			</Card>
		</>
	)
}