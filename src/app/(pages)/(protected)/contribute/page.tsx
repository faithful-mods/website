'use client';

import Link from 'next/link';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { GoAlert, GoCommit, GoHash, GoHourglass, GoQuestion, GoRelFilePath } from 'react-icons/go';
import { IoReload } from 'react-icons/io5';
import { LuArrowUpDown } from 'react-icons/lu';

import { ActionIcon, Badge, Button, FloatingIndicator, Group, Indicator, Kbd, List, Select, Stack, Text } from '@mantine/core';
import { useHotkeys, useOs, usePrevious, useViewportSize } from '@mantine/hooks';
import { Resolution, Status } from '@prisma/client';

import ForkInfo from '~/components/fork';
import { SmallTile } from '~/components/small-tile';
import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, COLORS, gitBlobUrl, gitCommitUrl, GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { getContributionsOfFork } from '~/server/actions/octokit';
import { archiveContributions, createContributionsFromGitFiles, deleteContributions, deleteContributionsOrArchive, getContributionsOfUser, submitContributions } from '~/server/data/contributions';
import { getTextures } from '~/server/data/texture';

import type { GitFile } from '~/server/actions/octokit';
import type { GetContributionsOfUser } from '~/server/data/contributions';
import type { GetTextures } from '~/server/data/texture';

import './styles.scss';

export default function ContributeSubmissionsPage() {
	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)
	const os = useOs();

	const [loading, startTransition] = useTransition();
	const [forkUrl, setForkUrl] = useState<string | null>(null);
	const [showHelp, helpShown] = useState(false);

	const [selectedContributions, setSelectedContributions] = useState<string[]>([]);

	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const prevRes = usePrevious(resolution);

	const [contributions, setContributions] = useState<GetContributionsOfUser[]>([]);
	const [textures, setTextures] = useState<GetTextures[]>([]);

	const [groupRef, setGroupRef] = useState<HTMLDivElement | null>(null);
	const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
	const [activeTab, setActiveTab] = useState(0);
	const { width } = useViewportSize();

	useHotkeys([
		[
			'mod+a',
			() => setSelectedContributions(contributions
				.filter(canContributionBeSubmitted)
				.filter((c) => c.status === Object.keys(Status)[activeTab]).map((c) => c.id)),
		],
	]);

	const canContributionBeSubmitted = useCallback((contribution: GetContributionsOfUser) => {
		const texture = textures.find((t) => t.id === contribution.textureId);
		if (!texture) return false;

		const disabledResolution = texture.disabledContributions.find((dc) => dc.resolution === resolution);
		const allResolutionsDisabled = texture.disabledContributions.find((dc) => dc.resolution === null);

		return !disabledResolution && !allResolutionsDisabled;
	}, [resolution, textures]);

	const setControlRef = (index: number) => (node: HTMLButtonElement) => {
		controlsRefs[index] = node;
		setControlsRefs(controlsRefs);
	};

	const reload = async () => {
		startTransition(async () => {
			if (!forkUrl) return;

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
			setSelectedContributions([]);
			getContributionsOfFork(resolution).then(updateForkContributions);
		});
	}, [resolution, prevRes, updateForkContributions]);

	useEffect(() => {
		setSelectedContributions([]);
	}, [activeTab]);

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
				rightSection={contributions.filter((c) => c.status === Object.keys(Status)[index]).length ?? 0}
				justify="space-between"
				className="slider-button"
				style={width > BREAKPOINT_MOBILE_LARGE
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

			<ForkInfo
				onUrlUpdate={setForkUrl}
				forkUrl={forkUrl}
			/>

			<Group
				wrap="nowrap"
				gap="xs"
			>
				<ActionIcon
					variant="default"
					className="navbar-icon-fix"
					onClick={() => helpShown(!showHelp)}
				>
					<GoQuestion />
				</ActionIcon>

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
					w="calc(100% - 34px - 34px - 120px - 180px - (3 * var(--mantine-spacing-xs)))"
					ref={setGroupRef}
					style={{
						position: 'relative',
					}}
					orientation={width <= BREAKPOINT_MOBILE_LARGE ? 'vertical' : 'horizontal'}
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

				{activeTab === 0 && (
					<Button
						w={180}
						variant="gradient"
						gradient={GRADIENT}
						disabled={selectedContributions.length === 0}
						onClick={() => {
							startTransition(async () => {
								await submitContributions(user.id!, selectedContributions);
								await reload();
							});
						}}
					>
						Submit {selectedContributions.length} draft{selectedContributions.length > 1 ? 's' : ''}
					</Button>
				)}

				{activeTab !== 0 && activeTab !== 4 && (
					<Button
						w={180}
						variant="gradient"
						gradient={GRADIENT_DANGER}
						disabled={selectedContributions.length === 0}
						onClick={() => {
							startTransition(async () => {
								await archiveContributions(user.id!, selectedContributions);
								await reload();
							});
						}}
					>
						Archive {selectedContributions.length} contribution{selectedContributions.length > 1 ? 's' : ''}
					</Button>
				)}

				{activeTab === 4 && (
					<Button
						w={180}
						variant="gradient"
						gradient={GRADIENT_DANGER}
						disabled={selectedContributions.length === 0}
						onClick={() => {
							startTransition(async () => {
								await deleteContributions(user.id!, selectedContributions);
								await reload();
							});
						}}
					>
						Delete {selectedContributions.length} contribution{selectedContributions.length > 1 ? 's' : ''}
					</Button>
				)}

			</Group>

			{showHelp && (
				<Tile style={{ borderRadius: 'var(--mantine-radius-default)' }}>
					<Text>
						To contribute, you need to:
					</Text>
					<List ml="sm">
						<List.Item><Text fw={360}>If not already, fork the default textures repository using the &quot;Create Fork&quot; button;</Text></List.Item>
						<List.Item><Text fw={360}>Clone it to your local machine using <Link href="https://git-scm.com/" target="_blank">Git</Link> or <Link href="https://desktop.github.com/download/" target="_blank">GitHub Desktop</Link> (recommended);</Text></List.Item>
						<List.Item><Text fw={360}>Switch to the branch corresponding to the resolution you want to contribute to;</Text></List.Item>
						<List.Item><Text fw={360}>Add textures to the repository, <Text component="span" fw={700}>each texture should have the same name as the contributed texture name in the <Link href="https://github.com/faithful-mods/resources-default" target="_blank">default repository</Link></Text>;</Text></List.Item>
						<List.Item><Text fw={360}>Commit your changes and push them to your fork;</Text></List.Item>
						<List.Item><Text fw={360}>Click the reload button to see your contributions here.</Text></List.Item>
					</List>

					<Text mt="md">
						When reloading:
					</Text>
					<List ml="sm">
						<List.Item>New contributions will be added to the <Badge component="span" color={COLORS.DRAFT}>Drafted</Badge> tab;</List.Item>
						<List.Item>Missing contributions that are either <Badge component="span" color={COLORS.PENDING}>Reviewed</Badge> or <Badge component="span" color={COLORS.REJECTED}>Rejected</Badge> will be deleted from the database;</List.Item>
						<List.Item>Missing contributions that are <Badge component="span" color={COLORS.ACCEPTED}>Accepted</Badge> will be <Badge component="span" color={COLORS.ARCHIVED} style={{ color: 'black' }}>Archived</Badge>.</List.Item>
					</List>

					<Text mt="md">
						A few tips:
					</Text>
					<List ml="sm">
						<List.Item>You have to click on contributions before submitting/archiving/deleting them.</List.Item>
						<List.Item>You can hit <Kbd component="span">{os === 'macos' ? '⌘' : 'Ctrl'}</Kbd> + <Kbd component="span">A</Kbd> to select them all</List.Item>
						<List.Item>If you delete an archived contribution, make sure to delete it from your fork first, otherwise it will be re-added to the database as a draft.</List.Item>
					</List>
				</Tile>
			)}

			{contributions.length !== 0 && contributions.filter((c) => c.status === Object.keys(Status)[activeTab]).length === 0 && (
				<Group
					align="center"
					justify="center"
					h="100px"
					w="100%"
					style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
				>
					<Text c="dimmed">No contributions to show</Text>
				</Group>
			)}

			{contributions.length === 0 && (
				<Group
					align="center"
					justify="center"
					h="100px"
					w="100%"
					style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
				>
					<Text c="dimmed">No contributions, you need to push some textures to your fork first!</Text>
				</Group>
			)}

			{forkUrl && (
				<Group gap="xs">
					{contributions.filter((c) => c.status === Object.keys(Status)[activeTab]).map((contribution, index) => {
						const texture = textures.find((t) => t.id === contribution.textureId);
						const orgOrUser = contribution.filepath.split('/')[3]!;
						const repository = contribution.filepath.split('/')[4]!;
						const commitSha = contribution.filepath.split('/')[5]!;

						const disabledResolution = texture?.disabledContributions.find((dc) => dc.resolution === resolution);
						const allResolutionsDisabled = texture?.disabledContributions.find((dc) => dc.resolution === null);

						return (
							(
								<TextureImage
									key={index}
									src={contribution.filepath}
									alt={contribution.filename}
									onClick={() => {
										if (!canContributionBeSubmitted(contribution)) return;

										setSelectedContributions((prev) => {
											if (prev.includes(contribution.id)) return prev.filter((id) => id !== contribution.id);
											return [...prev, contribution.id];
										});
									}}

									styles={{
										boxShadow: selectedContributions.includes(contribution.id) ? '0 0 0 2px var(--mantine-color-teal-filled)' : 'none',
										cursor: canContributionBeSubmitted(contribution) ? 'pointer' : 'not-allowed',
									}}

									popupStyles={{
										backgroundColor: 'transparent',
										padding: 0,
										border: 'none',
										boxShadow: 'none',
									}}
								>
									<Stack gap={2}>
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
											<Stack gap={2} align="start" miw={468} maw={468}>
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

										{texture && texture.vanillaTextureId && (
											<Group gap={2} w="100%" wrap="nowrap" align="start">
												<SmallTile color="yellow" className="navbar-icon-fix" style={{ '--size': '28px' }}>
													<GoAlert color="black" />
												</SmallTile>
												<SmallTile color="yellow">
													<Text size="xs" c="black">
														This texture is a vanilla texture, contributions should be done from the officials Discords channels.
													</Text>
												</SmallTile>
											</Group>
										)}

										{texture && !texture.vanillaTextureId && disabledResolution && !allResolutionsDisabled && (
											<Group gap={2} w="100%" wrap="nowrap" align="start">
												<SmallTile color="red" className="navbar-icon-fix" style={{ '--size': '28px' }}>
													<GoAlert color="black" />
												</SmallTile>
												<SmallTile color="red">
													<Text size="xs" c="black">
														This texture does not accept contributions for the {resolution} resolution.
													</Text>
												</SmallTile>
											</Group>
										)}

										{texture && !texture.vanillaTextureId && allResolutionsDisabled && (
											<Group gap={2} w="100%" wrap="nowrap" align="start">
												<SmallTile color="red" className="navbar-icon-fix" style={{ '--size': '28px' }}>
													<GoAlert color="black" />
												</SmallTile>
												<SmallTile color="red">
													<Text size="xs" c="black">
														This texture does not accept contributions for any resolution.
													</Text>
												</SmallTile>
											</Group>
										)}
									</Stack>
								</TextureImage>
							)
						);
					})}
				</Group>
			)}
		</Stack>
	);
}

