'use client';

import { Image, Badge, Card, Group, Text, TextInput, Button, Stack, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { Modpack } from '@prisma/client';
import { useEffect, useState } from 'react';
import { TbPlus } from 'react-icons/tb';

import { gradient, notify } from '@/lib/utils';
import { getModpacks } from '@/server/actions/admin';

import { ModpackModal } from './modpack-modal';

export function ModpacksPanel() {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modalModpack, setModalModpack] = useState<Modpack | undefined>();

	const [modpacks, setModpacks] = useState<Modpack[] | undefined>();
	const [filteredModpacks, setFilteredUsers] = useState<Modpack[] | undefined>();


	const form = useForm({
		initialValues: {
			search: '',
		},
	});

	const sortModpacks = (a: Modpack, b: Modpack) => a.name?.localeCompare(b.name ?? '') || 0;

	const filterModpacks = () => {
		const search = form.values['search'];
		if (!search || search.length === 0 || !modpacks) {
			setFilteredUsers(modpacks?.sort(sortModpacks));
			return;
		}

		const filtered = modpacks.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setFilteredUsers(filtered.sort(sortModpacks));
	}

	const openModpackModal = (modpack?: Modpack | undefined) => {
		setModalModpack(modpack);
		openModal();
	};

	useEffect(() => {
		getModpacks()
			.then((data) => {
				if (!data.success) return notify('Error', data.error, 'red');

				setModpacks(data.result.modpacks.sort(sortModpacks));
				setFilteredUsers(data.result.modpacks.sort(sortModpacks));
			})
			.catch((err) => {
				console.error(err);
				notify('Error', 'Something went wrong', 'red');
			});
	}, []);

	return (
		<>
			<Modal 
				size="100%"
				opened={modalOpened} 
				onClose={closeModal} 
				title={modalModpack ? `Update ${modalModpack.name}` : 'Create a new modpack'}
			>
				<ModpackModal modpack={modalModpack} onClose={closeModal} />
			</Modal>
			<Card 
				shadow="sm" 
				padding="md" 
				radius="md" 
				withBorder
			>
				<Group justify="space-between">
					<Text size="md" fw={700}>Modpacks</Text>
					<Badge color="teal" variant="filled">{modpacks?.length ?? '?'}</Badge>
				</Group>
				<TextInput 
					placeholder="Search modpacks..." 
					onKeyUp={filterModpacks}
					{...form.getInputProps('search')}
					mt="md"
				/>

				{!modpacks && (<Text mt="sm">Loading...</Text>)}
				{filteredModpacks && (
					<Group mt="md" align="start">
						<Stack gap={5}>
							<Button 
								variant='gradient'
								gradient={gradient}
								onClick={() => openModpackModal()} 
								className="w-[90px] h-[90px]"
							>
								<TbPlus className="w-[45px] h-[45px]"/>
							</Button>
							<Text size="sm" ta="center" maw={90}>Add</Text>
						</Stack>

						{filteredModpacks.map((modpack, index) => (
							<Stack gap={5} key={index}>
								<Image 
									radius="sm"
									className='cursor-pointer'
									onClick={() => openModpackModal(modpack)} 
									src={modpack.image}
									alt={modpack.name} 
									width={90} 
									height={90} />
								<Text size="sm" ta="center" maw={90} truncate="end">{modpack.name}</Text>
							</Stack>
						))}
					</Group>
				)}
			</Card>
		</>
	);
}