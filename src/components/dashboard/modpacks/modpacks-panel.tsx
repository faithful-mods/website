'use client';

import { Badge, Card, Group, Text, TextInput, Button, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { Modpack } from '@prisma/client';
import { useState, useTransition } from 'react';
import { TbPlus, TbReload } from 'react-icons/tb';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient, gradientDanger, notify, sortByName } from '~/lib/utils';
import { getModpacks, voidModpacks } from '~/server/data/modpacks';

import { ModpackModal } from './modal/modpack-modal';
import { DashboardItem } from '../dashboard-item';

export function ModpacksPanel() {
	const [isPending, startTransition] = useTransition();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	const [modalModpack, setModalModpack] = useState<Modpack | undefined>();
	const [modpacks, setModpacks] = useState<[Modpack[] | undefined, Modpack[] | undefined]>();

	const form = useForm<{ search: string }>({
		initialValues: {
			search: '',
		},
	});

	useEffectOnce(() => reloadModpacks());

	const reloadModpacks = () => {
		getModpacks()
			.then((modpacks) => {
				setModpacks([modpacks.sort(sortByName), modpacks.sort(sortByName)]);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	};

	const searchModpack = (search: string) => {
		if (!modpacks) return;

		if (!search || search.length === 0) {
			setModpacks([modpacks[0], modpacks[0]]);
			return;
		}

		const filtered = modpacks[0]?.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setModpacks([modpacks[0], filtered]);
	};

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
	};

	const deleteAllModpacks = () => {
		startTransition(() => {
			voidModpacks();
			setModpacks([[], []]);
		});
	};

	return (
		<>
			<Modal 
				size="100%"
				opened={modalOpened} 
				onClose={closeModal} 
				title="Modpack Edition"
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
						onClick={() => reloadModpacks()} 
					>
						<TbReload />
					</Button>
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
							<DashboardItem 
								key={index}
								image={modpack.image}
								title={modpack.name}
								description={modpack.description}
								onClick={() => openModpackModal(modpack)}
							/>
						))}
					</Group>
				)}

				{modpacks && modpacks[0] && modpacks[0].length > 0 &&
					<Group justify="flex-end" mt="md">
						<Button
							variant="gradient"
							gradient={gradientDanger}
							onClick={() => deleteAllModpacks()}
							loading={isPending}
							disabled={isPending}
						>
							Delete All Modpacks
						</Button>
					</Group>
				}
			</Card>
		</>
	);
}