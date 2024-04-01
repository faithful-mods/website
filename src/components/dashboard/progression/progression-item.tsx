import { Popover, Card, Stack, Group, Progress, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';
import { Resolution } from '@prisma/client';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_DESKTOP_LARGE } from '~/lib/constants'
import { gradient } from '~/lib/utils'
import type { ModVersionWithProgression } from '~/types';

export function ProgressionItem({ modVersion }: { modVersion: ModVersionWithProgression }) {
	const [opened, { close, open }] = useDisclosure(false);
	const [windowWidth, _] = useDeviceSize();

	return (
		<Popover width={200} position="bottom" withArrow shadow="md" opened={opened}>
			<Popover.Target>
				<Card 
					onMouseEnter={open} 
					onMouseLeave={close}
					withBorder 
					shadow="0" 
					className="dashboard-mod-progress"
					style={{ '--dashboard-mod-progress-count': windowWidth <= BREAKPOINT_MOBILE_LARGE 
						? 1 
						: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
							? 2
							: windowWidth <= BREAKPOINT_DESKTOP_LARGE
								? 3
								: 4 }}
				>
					<Stack gap="0">
						<Group justify="space-between">
							<Text size="sm" fw={700}>{modVersion.mod.name}</Text>
							<Text size="xs" c="dimmed">{modVersion.version} — {modVersion.mcVersion}</Text>
						</Group>
						<Stack gap="sm">
							{(Object.keys(modVersion.textures.done) as Resolution[])
								.map((res, i) => (
									<Stack key={i} gap="0">									
										<Text size="xs" c="dimmed">
											Textures {res}:&nbsp;{modVersion.textures.done[res]}&nbsp;/&nbsp;{modVersion.textures.todo}&nbsp;
											{modVersion.textures.todo === modVersion.linkedTextures ? '' : `(linked: ${modVersion.linkedTextures})`}	
										</Text>

										<Progress.Root size="xl" color={gradient.to}>
											<Progress.Section value={(modVersion.textures.done[res] / modVersion.textures.todo) * 100}>
												<Progress.Label>{(modVersion.textures.done[res] / modVersion.textures.todo * 100).toFixed(2)} %</Progress.Label>
											</Progress.Section>
										</Progress.Root>
									</Stack>
								))
							}
						</Stack>
					</Stack>
				</Card>
			</Popover.Target>
			<Popover.Dropdown style={{ pointerEvents: 'none' }}>
				<Text size="sm">Per Asset folder</Text>
				<Stack mt="sm" gap="xs">
					{modVersion.resources.map((resource, index) => {
						return (
							<div key={index}>
								<Stack justify="space-between" gap="0">
									<Text size="sm">{resource.assetFolder}</Text>

									{(Object.keys(resource.textures.done) as Resolution[])
										.map((res, i) => (
											<Stack key={i} gap="0">
												<Text size="xs" c="dimmed" key={i}>
													{res}: {resource.textures.done[res]}/{resource.textures.todo}&nbsp;
													{resource.textures.todo === resource.linkedTextures ? '' : `(${resource.linkedTextures})`}
												</Text>

												<Progress.Root size="xl" color={gradient.to}>
													<Progress.Section value={(resource.textures.done[res] / resource.textures.todo) * 100}>
														<Progress.Label>{(resource.textures.done[res] / resource.textures.todo * 100).toFixed(2)} %</Progress.Label>
													</Progress.Section>
												</Progress.Root>
											</Stack>
										))}

								</Stack>
							</div>
						)
					})}
				</Stack>
			</Popover.Dropdown>
		</Popover>
	)
}