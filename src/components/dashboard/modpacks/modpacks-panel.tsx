'use client';

import { Image, Badge, Card, Group, Text, TextInput, Button, Stack, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { Modpack } from '@prisma/client';
import { useState } from 'react';
import { TbPlus } from 'react-icons/tb';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient, notify, sortByName } from '~/lib/utils';
import { getModpacks } from '~/server/data/modpacks';

import { ModpackModal } from './modal/modpack-modal';

export function ModpacksPanel() {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [modalModpack, setModalModpack] = useState<Modpack | undefined>();
	const [modpacks, setModpacks] = useState<[Modpack[] | undefined, Modpack[] | undefined]>();

	const form = useForm<{ search: string }>({
		initialValues: {
			search: '',
		},
	});

	const searchModpack = (search: string) => {
		if (!modpacks) return;

		if (!search || search.length === 0) {
			setModpacks([modpacks[0], modpacks[0]]);
			return;
		}

		const filtered = modpacks[0]?.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setModpacks([modpacks[0], filtered]);
	}

	const openModpackModal = (modpack?: Modpack | undefined) => {
		setModalModpack(modpack);
		openModal();
	};

	const closeModpackModal = (editedModpack: Modpack | string) => {
		const [base, _] = modpacks ?? [];

		// deleted
		if (typeof editedModpack === 'string') {
			
			const cleared = (base?.filter((modpack) => modpack.id !== editedModpack) ?? []).sort(sortByName);
			setModpacks([cleared, cleared]);
			closeModal();
			return;
		}

		// edited
		const updated = [...base?.filter((modpack) => modpack.id !== editedModpack.id) ?? [], editedModpack].sort(sortByName);
		setModpacks([updated, updated]);
		closeModal();
	}

	useEffectOnce(() => {
		getModpacks()
			.then((modpacks) => {
				setModpacks([modpacks.sort(sortByName), modpacks.sort(sortByName)]);
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
				title={modalModpack ? modalModpack.name : 'Create a new modpack'}
			>
				<ModpackModal modpack={modalModpack} onClose={closeModpackModal} />
			</Modal>
			<Card 
				shadow="sm" 
				padding="md" 
				radius="md" 
				withBorder
			>
				<Group justify="space-between">
					<Text size="md" fw={700}>Modpacks</Text>
					<Badge color="teal" variant="filled">{(modpacks && modpacks[0]?.length) ?? '?'}</Badge>
				</Group>
				<Group align="center" mt="md" gap="sm" wrap="nowrap">
					<TextInput 
						className="w-full"
						placeholder="Search modpacks..." 
						onKeyUp={() => searchModpack(form.values.search)}
						{...form.getInputProps('search')}
					/>
					<Button 
						variant='gradient'
						gradient={gradient}
						className="navbar-icon-fix"
						onClick={() => openModpackModal()} 
					>
						<TbPlus />
					</Button>
				</Group>

				{!modpacks && (<Text mt="sm">Loading...</Text>)}
				
				{modpacks && modpacks[0]?.length === 0 && (<Text mt="sm">No modpacks created yet!</Text>)}
				{modpacks && modpacks[0]?.length !== 0 && modpacks[1]?.length === 0 && (<Text mt="sm">No results found!</Text>)}
				
				{modpacks && (modpacks[0]?.length ?? 0) > 0 && (
					<Group mt="md" align="start">
						{modpacks && modpacks[1]?.map((modpack, index) => (
							<Stack gap={5} key={index}>
								<Image 
									radius="sm"
									className='cursor-pointer'
									style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}
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