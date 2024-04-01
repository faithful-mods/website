import type { Mod } from '@prisma/client';

import { Group, Table, Text } from '@mantine/core';
import { useState } from 'react';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify } from '~/lib/utils';
import { getModVersionsWithModpacks } from '~/server/data/mods-version';
import { ModVersionWithModpacks } from '~/types';

export function ModVersions({ mod }: { mod: Mod }) {
	const [modVersions, setModVersions] = useState<ModVersionWithModpacks[]>([]);

	useEffectOnce(() => {
		getModVersionsWithModpacks(mod.id)
			.then(setModVersions)
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			})
	})

	return (
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
							<Table.Tr key={version.id} onClick={() => {}}>
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
		</Group>
	)
}