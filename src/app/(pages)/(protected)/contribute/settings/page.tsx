'use client';

import Link from 'next/link';

import { useState, useTransition } from 'react';

import { GoCheckCircle, GoStop } from 'react-icons/go';

import { Button, Group, Stack, Text } from '@mantine/core';

import { Tile } from '~/components/tile';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { getFork, deleteFork, forkRepository } from '~/server/actions/git';

export default function ContributeSettingsPage() {
	const [forked, setHasFork] = useState<string | null>(null);
	const [loading, startTransition] = useTransition();

	useEffectOnce(() => {
		reload();
	});

	const reload = async () => {
		startTransition(async () => {
			setHasFork(await getFork());
		});
	};

	const handleSetupForkedRepository = async () => {
		startTransition(async () => {
			await forkRepository();
			await reload();
		});
	};

	const handleForkDelete = async () => {
		startTransition(async () => {
			await deleteFork();
			await reload();
		});
	};

	const forkedInfo = () => {
		if (forked) {
			return (
				<Tile p="xs" pl="md" color="teal">
					<Group justify="space-between">
						<Group>
							<GoCheckCircle size={20} color="white"/>
							<Group gap={3}>
								<Text size="sm" c="white">Default textures repository forked: </Text>
								<Text size="sm" c="white"><Link href={forked} style={{ color: 'white' }}>{forked}</Link></Text>
							</Group>
						</Group>

						<Group gap="xs">
							<Button variant="outline" color="white">Sync Fork</Button>
						</Group>
					</Group>
				</Tile>
			);
		}

		return (
			<Tile p="xs" pl="md" color="yellow">
				<Group justify="space-between">
					<Group>
						<GoStop color="black" size={20} />
						<Group gap="xs">
							<Text size="sm" c="black">Default textures repository not forked</Text>
						</Group>
					</Group>

					<Group gap="xs">
						<Button
							variant="outline"
							color="black"
							onClick={handleSetupForkedRepository}
							disabled={!!forked}
							loading={loading}
						>
								Create Fork
						</Button>
					</Group>
				</Group>
			</Tile>
		);
	};

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Text fw={700}>General</Text>
				{forkedInfo()}
			</Stack>

			<Stack gap="xs">
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
					<Group justify="space-between">
						<Stack gap={0}>
							<Text>Delete the forked repository</Text>
							<Text c="dimmed" size="xs">This action is irreversible, all contributions will be lost.</Text>
						</Stack>
						<Button
							variant="default"
							style={{ color: 'var(--mantine-color-red-text)' }}
							onClick={handleForkDelete}
							disabled={!forked}
							loading={loading}
						>
							Delete Fork
						</Button>
					</Group>
				</Tile>
			</Stack>
		</Stack>
	);
}
