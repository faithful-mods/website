'use client';

import type { Modpack } from '@prisma/client';

import { Button, Group, Table, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';

import { Modal } from '~/components/modal';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, notify } from '~/lib/utils';
import { getModpackVersions } from '~/server/data/modpacks-version';
import type { ModpackVersionWithMods } from '~/types';

import { ModpackVersionModal } from './modpack-version-modal';

export function ModpackVersions({ modpack }: { modpack: Modpack }) {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modalModpackVersion, setModalModpackVersion] = useState<ModpackVersionWithMods | undefined>();
	const [modpackVersions, setModpackVersions] = useState<ModpackVersionWithMods[]>([]);

	const [windowWidth] = useDeviceSize();

	useEffectOnce(() => {
		getModpackVersions(modpack.id)
			.then(setModpackVersions)
			.catch((error) => {
				console.error(error);
				notify('Error', error.message, 'red');
			});
	});

	const openModpackVersionModal = (modpackVersion?: ModpackVersionWithMods | undefined) => {
		setModalModpackVersion(modpackVersion);
		openModal();
	};

	const closeModpackVersionModal = async () => {
		setModpackVersions(await getModpackVersions(modpack.id));
		closeModal();
	};

	return (
		<>
			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title="Modpack Version Edition"
			>
				<ModpackVersionModal modpack={modpack} modpackVersion={modalModpackVersion} onClose={closeModpackVersionModal} />
			</Modal>
			<Group gap="md" align="start" mt="md">
				{!modpackVersions && <Text mt="sm">Loading...</Text>}
				{modpackVersions.length === 0 && <Text mt="sm">This Modpack has no versions yet</Text>}

				{modpackVersions.length > 0 && <>
					<Table striped highlightOnHover withColumnBorders withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Version</Table.Th>
								{windowWidth > BREAKPOINT_MOBILE_LARGE && <Table.Th>Number of mods</Table.Th>}
								<Table.Th>Created</Table.Th>
								<Table.Th>Updated</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{modpackVersions.map((version) => (
								<Table.Tr key={version.id} onClick={() => openModpackVersionModal(version)} className="cursor-pointer">
									<Table.Td>{version.version}</Table.Td>
									{windowWidth > BREAKPOINT_MOBILE_LARGE && <Table.Td>{version.mods.length}</Table.Td>}
									<Table.Td>{version.createdAt.toLocaleString()}</Table.Td>
									<Table.Td>{version.updatedAt.toLocaleString()}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table></>
				}

				<Button
					variant="light"
					color={gradient.to}
					fullWidth
					onClick={() => openModpackVersionModal()}
				>
					Add new modpack version
				</Button>
			</Group>
		</>
	);
}
