'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { GoCommit, GoHash, GoHourglass, GoRelFilePath } from 'react-icons/go';
import { IoReload } from 'react-icons/io5';
import { LuArrowUpDown } from 'react-icons/lu';

import { ActionIcon, Button, FloatingIndicator, Group, Indicator, Select, Stack, Text } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';
import { Resolution, Status } from '@prisma/client';

import { SmallTile } from '~/components/small-tile';
import { TextureImage } from '~/components/texture-img';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, COLORS, gitBlobUrl, gitCommitUrl } from '~/lib/constants';
import { getContributionsOfFork, getFork } from '~/server/actions/git';
import { createContributionsFromGitFiles, deleteContributionsOrArchive, getContributionsOfUser } from '~/server/data/contributions';
import { getTextures } from '~/server/data/texture';

import type { Texture } from '@prisma/client';
import type { GitFile } from '~/server/actions/git';
import type { GetContributionsOfUser } from '~/server/data/contributions';

import './styles.scss';

export default function ContributeSubmissionsPage() {
	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	const [loading, startTransition] = useTransition();
	const [hasFork, setHasFork] = useState<string | null>(null);

	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const prevRes = usePrevious(resolution);

	const [contributions, setContributions] = useState<GetContributionsOfUser[]>([]);
	const [textures, setTextures] = useState<Texture[]>([]);

	const [groupRef, setGroupRef] = useState<HTMLDivElement | null>(null);
	const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
	const [activeTab, setActiveTab] = useState(0);
	const [windowWidth] = useDeviceSize();

	const setControlRef = (index: number) => (node: HTMLButtonElement) => {
		controlsRefs[index] = node;
		setControlsRefs(controlsRefs);
	};

	const reload = async () => {
		startTransition(async () => {
			const fork = await getFork();
			if (!fork) return;

			setHasFork(fork);
			getContributionsOfFork(resolution).then(updateForkContributions);
		});
	};

	const updateForkContributions = useCallback(async (files: GitFile[]) => {
		const contributions = await getContributionsOfUser(user.id!, resolution);
		const contributedSha = contributions.map((contribution) => contribution.hash);

		// delete contributions that are not in the fork but are in the database
		const missingFiles = contributions.filter((contribution) => !files.some((file) => file.sha === contribution.hash));
		await deleteContributionsOrArchive(user.id!, missingFiles.map((contribution) => contribution.id));

		// add contributions that are not yet in the database
		const newFiles = files.filter((file) => !contributedSha.includes(file.sha));
		await createContributionsFromGitFiles(user.id!, resolution, newFiles);

		const contributionsAfter = await getContributionsOfUser(user.id!, resolution);
		setContributions(contributionsAfter);

	}, [user, resolution]);

	useEffectOnce(() => {
		reload();
		getTextures().then(setTextures);
	});

	useEffect(() => {
		if (prevRes === resolution) return;

		startTransition(() => {
			getContributionsOfFork(resolution).then(updateForkContributions);
		});
	}, [resolution, prevRes, updateForkContributions]);

	const controls = Object.entries(Status).map(([key, value], index) => {
		const isLast = index === Object.keys(Status).length - 1;

		return (
			<Button
				key={key}
				ref={setControlRef(index)}
				onClick={() => setActiveTab(index)}
				mod={{ active: activeTab === index }}

				pl="md"
				pr="sm"
				fullWidth
				variant="filled"
				leftSection={
					<>
						<Indicator color={COLORS[value]} mr="md" />
						{value === Status.DRAFT
							? 'Drafted'
							: value === Status.PENDING
								? 'Reviewed'
								: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
						}
					</>
				}
				rightSection={0}
				justify="space-between"
				className="slider-button"
				style={windowWidth > BREAKPOINT_MOBILE_LARGE
					? {
						borderRight: !isLast && activeTab !== index + 1 && activeTab !== index
							? 'calc(0.0625rem * var(--mantine-scale)) solid var(--mantine-color-default-border)'
							: undefined,
						borderRadius: isLast ? '0 calc(0.25rem * var(--mantine-scale)) calc(0.25rem * var(--mantine-scale)) 0' : undefined,
					}
					: undefined
				}
			/>
		);
	});

	return (
		<Stack gap="xs">
			<Group
				wrap="nowrap"
				gap="xs"
			>
				<ActionIcon
					variant="default"
					className="navbar-icon-fix"
					onClick={reload}
					loading={loading}
				>
					<IoReload />
				</ActionIcon>
				<Select
					w={120}
					data={Object.keys(Resolution)}
					checkIconPosition="right"
					value={resolution}
					onChange={(e) => e ? setResolution(e as Resolution) : null}
					clearable={false}
				/>
				<Button.Group
					w="calc(100% - 120px - var(--mantine-spacing-xs))"
					ref={setGroupRef}
					style={{
						position: 'relative',
					}}
					orientation={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'vertical' : 'horizontal'}
				>
					{controls}

					<FloatingIndicator
						target={controlsRefs[activeTab]}
						parent={groupRef}
						style={{
							border: 'calc(0.0625rem * var(--mantine-scale)) solid #fff3',
							borderRadius: (() => {
								if (activeTab === 0) return 'calc(0.25rem * var(--mantine-scale)) 0 0 calc(0.25rem * var(--mantine-scale))';
								if (activeTab === Object.keys(Status).length - 1) return '0 calc(0.25rem * var(--mantine-scale)) calc(0.25rem * var(--mantine-scale)) 0';
								return '0';
							})(),
							backgroundColor: '#0002',
							cursor: 'pointer',
							zIndex: 200,
						}}
					/>

				</Button.Group>
			</Group>

			{hasFork === null && (
				<Group
					align="center"
					justify="center"
					h="100px"
					w="100%"
					style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
				>
					<Text c="dimmed">You need to fork the default repository first</Text>
				</Group>
			)}

			{hasFork && (
				<Group gap="xs">
					{contributions.map((contribution) => {
						const texture = textures.find((t) => t.id === contribution.textureId);
						const orgOrUser = contribution.filepath.split('/')[3]!;
						const repository = contribution.filepath.split('/')[4]!;
						const commitSha = contribution.filepath.split('/')[5]!;

						return (
							(
								<TextureImage
									key={contribution.id}
									src={contribution.filepath}
									alt={contribution.filename}
									popupStyles={{
										backgroundColor: 'transparent',
										padding: 0,
										border: 'none',
										boxShadow: 'none',
									}}
								>
									<Group gap={2}>
										{texture && (
											<SmallTile color="gray" w={125} h="100%">
												<Group w="100%" h="100%" justify="center" align="center">
													<TextureImage
														src={texture.filepath}
														alt={texture.name}
														mcmeta={texture.mcmeta}
														size={115}
													/>
												</Group>
											</SmallTile>
										)}
										<Stack gap={2} align="start" miw={400} maw={400}>
											<SmallTile color="gray">
												<Text fw={500} ta="center">{texture?.name}</Text>
											</SmallTile>

											<Group gap={2} w="100%" wrap="nowrap" align="start">
												<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
													<GoCommit />
												</SmallTile>
												<SmallTile color="gray">
													<Text size="xs">
														<a
															href={gitCommitUrl({ orgOrUser, repository, commitSha })}
															target="_blank"
															rel="noreferrer"
														>
															{commitSha}
														</a>
													</Text>
												</SmallTile>
											</Group>

											<Group gap={2} w="100%" wrap="nowrap" align="start">
												<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
													<GoRelFilePath />
												</SmallTile>
												<SmallTile color="gray">
													<Text size="xs">
														<a
															href={gitBlobUrl({ orgOrUser, repository, branchOrCommit: commitSha, path: contribution.filename })}
															target="_blank"
															rel="noreferrer"
														>
															{contribution.filename}
														</a>
													</Text>
												</SmallTile>
											</Group>

											<Group gap={2} w="100%">
												<Group gap={2} w="calc((100% - 4px) / 3)" wrap="nowrap" align="start">
													<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
														<LuArrowUpDown />
													</SmallTile>
													<SmallTile color="gray">
														<Text size="xs">
															{contribution.poll.upvotes.length - contribution.poll.downvotes.length}
														</Text>
													</SmallTile>
												</Group>
												<Group gap={2} w="calc((100% - 4px) / 3)" wrap="nowrap" align="start">
													<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
														<GoHash />
													</SmallTile>
													<SmallTile color="gray">
														<Text size="xs">
															{contribution.textureId}
														</Text>
													</SmallTile>
												</Group>
												<Group gap={2} w="calc((100% - 4px) / 3)" wrap="nowrap" align="start">
													<SmallTile color="gray" className="navbar-icon-fix" style={{ '--size': '28px' }}>
														<GoHourglass />
													</SmallTile>
													<SmallTile color="gray">
														<Text size="xs">
															{contribution.status}
														</Text>
													</SmallTile>
												</Group>
											</Group>
										</Stack>
									</Group>
								</TextureImage>
							)
						);
					})}
				</Group>
			)}

		</Stack>
	);
}

