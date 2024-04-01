import type { Resolution } from '@prisma/client';

import { Button, Card, Group, Progress, Text, Stack } from '@mantine/core';
import { useState } from 'react';
import { TbReload } from 'react-icons/tb';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { EMPTY_PROGRESSION, gradient } from '~/lib/utils';
import { getModsVersionsProgression } from '~/server/data/mods-version';
import { getGlobalProgression } from '~/server/data/texture';
import type { ModVersionWithProgression, Progression } from '~/types';

import { ProgressionItem } from './progression-item';

export function ProgressionPanel() {
	const [resources, setResources] = useState<ModVersionWithProgression[]>([]);
	const [globalProgress, setGlobalProgress] = useState<Progression>(EMPTY_PROGRESSION);

	useEffectOnce(() => {
		setResources([]);
		setGlobalProgress(EMPTY_PROGRESSION);
		reload();
	});

	const reload = () => {
		getModsVersionsProgression()
			.then((res) => {
				setResources(res.sort((a, b) => a.mod.name.localeCompare(b.mod.name)));
			});
		getGlobalProgression()
			.then(setGlobalProgress)
	}

	return (
		<Card
			shadow="sm"
			padding="md" 
			radius="md" 
			withBorder
		>
			<Group justify="space-between" align="flex-start">
				<Text size="md" fw={700}>Pack Progression</Text>
				<Button 
					variant='gradient'
					gradient={gradient}
					className="navbar-icon-fix"
					onClick={() => reload()} 
				>
					<TbReload />
				</Button>
			</Group>

			<Stack gap="0" mt="md">
				<Text size="sm" fw={700}>Global Progression</Text>
				{(Object.keys(globalProgress.textures.done) as Resolution[])
					.map((res, i) => (
						<Stack key={i} gap="0">									
							<Text size="xs" c="dimmed">
								Textures {res}:&nbsp;{globalProgress.textures.done[res]}&nbsp;/&nbsp;{globalProgress.textures.todo}&nbsp;
								{globalProgress.textures.todo === globalProgress.linkedTextures ? '' : `(linked: ${globalProgress.linkedTextures})`}	
							</Text>

							<Progress.Root size="xl" color={gradient.to}>
								<Progress.Section value={(globalProgress.textures.done[res] / globalProgress.textures.todo) * 100}>
									<Progress.Label>{(globalProgress.textures.done[res] / globalProgress.textures.todo * 100).toFixed(2)} %</Progress.Label>
								</Progress.Section>
							</Progress.Root>
						</Stack>
					))
				}
			</Stack>

			<Group gap="md" mt="md">
				{resources.map((modVersion, index) => <ProgressionItem key={index} modVersion={modVersion} />)}
			</Group>
		</Card>
	)
}