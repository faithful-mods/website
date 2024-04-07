import type { Mod } from '@prisma/client';

import { Code, Group, Modal, Table, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { useState, startTransition } from 'react';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify } from '~/lib/utils';
import { addModVersionsFromJAR, getModVersionsWithModpacks } from '~/server/data/mods-version';
import { ModVersionWithModpacks } from '~/types';

import { ModVersionModal } from './mod-version-modal';

export function ModVersions({ mod }: { mod: Mod }) {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modVersions, setModVersions] = useState<ModVersionWithModpacks[]>([]);
	const [modalModVersion, setModalModVersion] = useState<ModVersionWithModpacks | undefined>();

	useEffectOnce(() => {
		getModVersionsWithModpacks(mod.id)
			.then(setModVersions)
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	const filesDrop = (files: File[]) => {
		startTransition(() => {
			const data = new FormData();
			files.forEach((file) => data.append('files', file));

			addModVersionsFromJAR(data)
				.then((updated) => {
					setModVersions(updated
						.filter((modVer) => modVer.modId === mod.id)
						.map((modVer) => ({ ...modVer, modpacks: [] }))
					);
				});
		});
	};
	
	const openModVersionModal = (modVersion?: ModVersionWithModpacks | undefined) => {
		setModalModVersion(modVersion);
		openModal();
	};

	const closeModVersionModal = async () => {
		setModVersions(await getModVersionsWithModpacks(mod.id));
		closeModal();
	};

	return (
		<>
			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title="Mod Version Edition"
			>
				<ModVersionModal mod={mod} modVersion={modalModVersion} onClose={closeModVersionModal} />
			</Modal>
			<Group gap="md" align="start" mt="md">
				{!modVersions && <Text mt="sm">Loading...</Text>}
				{modVersions.length === 0 && <Text mt="sm">This Mod has no versions yet</Text>}

				{modVersions.length > 0 && <>
					<Table striped highlightOnHover withColumnBorders withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Version</Table.Th>
								<Table.Th>MC Version</Table.Th>
								<Table.Th>Modpacks</Table.Th>
								<Table.Th>Created</Table.Th>
								<Table.Th>Updated</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{modVersions.map((version) => (
								<Table.Tr key={version.id} onClick={() => openModVersionModal(version)} className="cursor-pointer">
									<Table.Td>{version.version}</Table.Td>
									<Table.Td>{version.mcVersion}</Table.Td>
									<Table.Td>{version.modpacks.map((m) => m.name)}</Table.Td>
									<Table.Td>{version.createdAt.toLocaleString()}</Table.Td>
									<Table.Td>{version.updatedAt.toLocaleString()}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</>}

				<Dropzone 
					className="w-full"
					onDrop={filesDrop}
					accept={['application/java-archive']}
					mt="0"
				>
					<div>
						<Text size="l" inline>
							Drag <Code>.JAR</Code> files here or click to select files
						</Text>
						<Text size="sm" c="dimmed" inline mt={7}>
							Attach as many files as you like, each file will be added as a separate mod version.
							If there is another mod in the JAR, it will be added as a new mod and its version added to it.
						</Text>
					</div>
				</Dropzone>
			</Group>
		</>
	);
}