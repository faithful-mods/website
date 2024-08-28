'use client';

import { useState, useTransition } from 'react';

import { Button, Group, Stack, Text } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';

import { Tile } from '~/components/base/tile';
import ForkInfo from '~/components/fork';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { deleteFork } from '~/server/actions/octokit';

export default function UserSettingsPage() {
	const [loading, startTransition] = useTransition();
	const [forkUrl, setForkUrl] = useState<string | null>(null);

	const { width } = useViewportSize();

	const handleForkDelete = async () => {
		startTransition(async () => {
			await deleteFork();
			setForkUrl(null);
		});
	};

	return (
		<Stack>
			<Stack gap="xs">
				<Text fw={700}>Contributions Fork</Text>
				<ForkInfo onUrlUpdate={setForkUrl} forkUrl={forkUrl} />
			</Stack>

			<Stack gap="xs" mb="sm">
				<Text fw={700}>Danger Zone</Text>
				<Tile
					p="xs"
					pl="md"
					withBorder
					style={{
						backgroundColor: 'transparent',
						borderColor: 'var(--mantine-color-red-filled)',
					}}
				>
					<Group justify="space-between" style={{ opacity: forkUrl ? 1 : .5 }}>
						<Stack gap={0}>
							<Text>Delete the forked repository</Text>
							<Text c="dimmed" size="xs">This action is irreversible, all contributions will be lost.</Text>
						</Stack>
						<Button
							variant="default"
							style={{ color: 'var(--mantine-color-red-text)' }}
							onClick={handleForkDelete}
							disabled={!forkUrl}
							loading={loading}
							fullWidth={width <= BREAKPOINT_MOBILE_LARGE}
						>
							Delete Fork
						</Button>
					</Group>
				</Tile>
			</Stack>
		</Stack>
	);
}
