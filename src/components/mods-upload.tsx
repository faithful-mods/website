'use client';

import { useEffect, useState } from 'react';

import { Code, Group, InputLabel, Progress, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useWebsocket } from '~/hooks/use-websocket';
import { addModVersionsFromJAR } from '~/server/data/mods-version';

import type { SocketModUpload } from '~/types';

interface Props {
	onUpload: () => void;
	socketIdSuffix?: string;
}

export const ModUpload = ({ socketIdSuffix, onUpload }: Props) => {
	const [status, setStatus] = useState<SocketModUpload | null>(null);
	const userId = (socketIdSuffix ?? '') + useCurrentUser()!.id!;

	useWebsocket([
		[userId, (status: SocketModUpload) => setStatus(status)],
	]);

	useEffect(() => {
		if (status && status.mods.done === status.mods.total) {
			setStatus(null);
			onUpload();
		}
	}, [status, onUpload]);

	const handleFilesDrop = async (files: File[]) => {
		const data = new FormData();
		files.forEach((file) => data.append('files', file));

		await addModVersionsFromJAR(data, userId);
	};

	return (
		<Stack gap={0} className="w-full">
			<InputLabel>{status ? 'Uploading...' : 'Upload'}</InputLabel>
			{!status && (
				<Dropzone
					className="w-full"
					onDrop={handleFilesDrop}
					accept={['application/java-archive']}
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
			)}

			{status && (
				<Stack gap="xs" mt="xs">
					<Group gap="xs" wrap="nowrap">
						<Text size="xs" w={50} ta="right">JARs</Text>

						<Progress.Root className="w-full" size="lg">
							<Progress.Section value={status.mods.total === 0 ? 100 : (status.mods.done * 100) / status.mods.total}>
								<Progress.Label>{status.mods.done} / {status.mods.total}</Progress.Label>
							</Progress.Section>
						</Progress.Root>
					</Group>
					<Group gap="xs" wrap="nowrap">
						<Text size="xs" w={50} ta="right">Mods</Text>
						<Progress.Root className="w-full" size="lg">
							<Progress.Section value={status.modInfos.total === 0 ? 100 : (status.modInfos.done * 100) / status.modInfos.total}>
								<Progress.Label>{status.modInfos.done} / {status.modInfos.total}</Progress.Label>
							</Progress.Section>
						</Progress.Root>
					</Group>
					<Group gap="xs" wrap="nowrap">
						<Text size="xs" w={50} ta="right">Textures</Text>
						<Progress.Root className="w-full" size="lg">
							<Progress.Section value={status.textures.total === 0 ? 100 : (status.textures.done * 100) / status.textures.total}>
								<Progress.Label>{status.textures.done} / {status.textures.total}</Progress.Label>
							</Progress.Section>
						</Progress.Root>
					</Group>
				</Stack>
			)}
		</Stack>
	);
};
