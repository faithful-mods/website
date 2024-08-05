'use client';

import { Code, InputLabel, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useState } from 'react';

import { useWebsocket } from '~/hooks/use-websocket';
import { test } from '~/server/data/mods-version';

export const ModUpload = () => {
	const [message, setMessage] = useState('');

	const { isConnected, transport } = useWebsocket([
		['test', (e) => setMessage(e as string)],
	]);

	const handleFilesDrop = async (files: File[]) => {
		await test();
	};

	return (
		<Stack gap={0}>
			message: { message }<br/>
			connected: { isConnected.toString() }<br/>
			transport: { transport }

			<InputLabel>Upload</InputLabel>
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
		</Stack>
	);
};
