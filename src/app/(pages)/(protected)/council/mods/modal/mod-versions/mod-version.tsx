'use client';

import { useState } from 'react';

import { Group, Table, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { Modal } from '~/components/modal';
import { ModUpload } from '~/components/mods-upload';
import { WarningIcon } from '~/components/warning-icon';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET } from '~/lib/constants';
import { extractSemver, notify } from '~/lib/utils';
import { getModVersionsWithModpacks, getNumberOfTextureFromModVersion } from '~/server/data/mods-version';

import { ModVersionModal } from './mod-version-modal';

import type { Mod } from '@prisma/client';
import type { ModVersionExtended } from '~/types';

export function ModVersions({ mod }: { mod: Mod }) {
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [modVersions, setModVersions] = useState<ModVersionExtended[]>([]);
	const [modalModVersion, setModalModVersion] = useState<ModVersionExtended | undefined>();

	const [windowWidth] = useDeviceSize();

	useEffectOnce(() => {
		getModVersionsWithModpacks(mod.id)
			.then((res) => {
				Promise.all(
					res.map((modVersions) =>
						getNumberOfTextureFromModVersion(modVersions.id).then((r) => ({
							...modVersions,
							linked: r[0]!,
							textures: r[1]!,
						}))
					)
				).then(setModVersions);
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	const handleOnUpload = async () => {
		setModVersions(await getModVersionsWithModpacks(mod.id));
	};

	const openModVersionModal = (modVersion?: ModVersionExtended | undefined) => {
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
								<Table.Th>Minecraft</Table.Th>
								{windowWidth > BREAKPOINT_MOBILE_LARGE && <Table.Th>Modpacks</Table.Th>}
								{windowWidth > BREAKPOINT_MOBILE_LARGE && <Table.Th>Textures</Table.Th>}
								<Table.Th>Created</Table.Th>
								<Table.Th>Updated</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{modVersions.map((version) => (
								<Table.Tr key={version.id} onClick={() => openModVersionModal(version)} className="cursor-pointer">
									<Table.Td>{version.version}</Table.Td>
									<Table.Td style={{ position: 'relative' }}>
										{version.mcVersion.join(', ')}
										{(version.mcVersion.length === 0 || version.mcVersion.some((v) => extractSemver(v) === null)) && (
											<WarningIcon
												style={{
													position: 'absolute',
													top: 'calc((36px / 2 - (20px / 2)))',
													right: 'calc(var(--mantine-spacing-sm) / 2)',
												}}
											/>
										)}
									</Table.Td>
									{windowWidth > BREAKPOINT_MOBILE_LARGE && <Table.Td>{version.modpacks.length}</Table.Td>}
									{windowWidth > BREAKPOINT_MOBILE_LARGE && <Table.Td>linked: {version.linked}, unique: {version.textures}</Table.Td>}
									<Table.Td>{windowWidth > BREAKPOINT_TABLET ? version.createdAt.toLocaleString() : version.createdAt.toLocaleDateString()}</Table.Td>
									<Table.Td>{windowWidth > BREAKPOINT_TABLET ? version.updatedAt.toLocaleString() : version.updatedAt.toLocaleDateString()}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</>}

				<ModUpload onUpload={handleOnUpload} socketIdSuffix='mod-versions' />
			</Group>
		</>
	);
}
