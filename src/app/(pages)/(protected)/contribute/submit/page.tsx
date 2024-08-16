'use client';

import { useState, useTransition } from 'react';

import { Button, Code, FloatingIndicator, Group, Indicator, Select, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { Resolution, Status } from '@prisma/client';

import { Modal } from '~/components/modal';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, COLORS } from '~/lib/constants';
import { createRawContributions, getContributionsOfUser, getCoSubmittedContributions } from '~/server/data/contributions';
import { getTexturesWithUsePaths } from '~/server/data/texture';

import { CoAuthorsSelector } from './co-authors-select';
import { ContributionPanelItem } from './contribution-item';
import { ContributionModal } from './contribution-modal';
import { ContributionTools } from './contribution-tools';

import type { GetTexturesWithUsePaths } from '~/server/data/texture';
import type { ContributionWithCoAuthorsAndPoll, PublicUser } from '~/types';

import './submit.scss';

const SubmitPage = () => {
	const user = useCurrentUser()!; // the user is guaranteed to be logged in (per the layout)

	const [isPending, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();

	const [resolution, setResolution] = useState<Resolution>(Resolution.x32);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>([]);

	const [contributions, setContributions] = useState<ContributionWithCoAuthorsAndPoll[]>([]);
	const [coContributions, setCoContributions] = useState<ContributionWithCoAuthorsAndPoll[]>([]);

	const [isModalContributionOpened, { open: openContributionModal, close: closeContributionModal }] = useDisclosure(false);
	const [modalContribution, setModalContribution] = useState<ContributionWithCoAuthorsAndPoll | null>(null);

	const [isHoveringSubmit, setHoveringSubmit] = useState(false);
	const [isDeletionMode, setDeletionMode] = useState(false);

	const [contributionToDelete, setContributionToDelete] = useState<string[]>([]);

	const [textures, setTextures] = useState<GetTexturesWithUsePaths[]>([]);

	useEffectOnce(() => {
		reload();
	});

	const reload = () => {
		startTransition(() => {
			getContributionsOfUser(user.id!).then(setContributions);
			getCoSubmittedContributions(user.id!).then(setCoContributions);
			getTexturesWithUsePaths().then(setTextures);
		});
	};

	const handleFilesDrop = (files: File[]) => {
		startTransition(async () => {
			const data = new FormData();
			files.forEach((file) => data.append('files', file));

			await createRawContributions(user.id!, selectedCoAuthors.map((u) => u.id), resolution, data)
				.then((duplicates) => {
					if (duplicates.length > 0) console.error(duplicates.join('\n'));

					getContributionsOfUser(user.id!).then(setContributions);
					setActiveTab(0);
				});
		});
	};

	const handleContributionClick = (c: ContributionWithCoAuthorsAndPoll) => {
		if (isDeletionMode) {
			if (contributionToDelete.includes(c.id)) setContributionToDelete(contributionToDelete.filter((id) => id !== c.id));
			else setContributionToDelete([...contributionToDelete, c.id]);
		}
		else {
			setModalContribution(c);
			openContributionModal();
		}
	};

	const getBorderStyles = (c: ContributionWithCoAuthorsAndPoll) => {
		if (contributionToDelete.includes(c.id))
			return { boxShadow: '0 0 0 2px var(--mantine-color-red-filled)' };

		if (c.textureId !== null && isHoveringSubmit && c.status === Status.DRAFT)
			return { boxShadow: '0 0 0 2px var(--mantine-color-teal-filled)' };
	};

	const [groupRef, setGroupRef] = useState<HTMLDivElement | null>(null);
	const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
	const [activeTab, setActiveTab] = useState(0);

	const setControlRef = (index: number) => (node: HTMLButtonElement) => {
		controlsRefs[index] = node;
		setControlsRefs(controlsRefs);
	};

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
				leftSection={<>
					<Indicator color={COLORS[value]} mr="md" />
					{value === Status.DRAFT
						? 'Drafted'
						: value === Status.PENDING
							? 'Reviewed'
							: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
					}
				</>}
				rightSection={contributions?.filter((c) => c.status === value).length ?? 0}
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
		<Stack gap="md">
			<Modal
				forceFullScreen
				opened={isModalContributionOpened}
				onClose={closeContributionModal}
			>
				{modalContribution && (
					<ContributionModal
						contribution={modalContribution}
						textures={textures}
						onClose={reload}
					/>
				)}
			</Modal>

			<Stack gap="md">
				<Group gap="sm">
					<Select
						label="Resolution"
						data={Object.keys(Resolution)}
						checkIconPosition="right"
						allowDeselect={false}
						defaultValue={Resolution.x32}
						onChange={(value) => setResolution(value as Resolution)}
						style={windowWidth <= BREAKPOINT_MOBILE_LARGE ? { width: '100%' } : { width: 'calc((100% - var(--mantine-spacing-md)) * .2)' }}
						required
					/>
					<CoAuthorsSelector
						author={user}
						onCoAuthorsSelect={setSelectedCoAuthors}
						mb={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'xs' : '0'}
						style={windowWidth <= BREAKPOINT_MOBILE_LARGE
							? { width: '100%' }
							: { width: 'calc((100% - var(--mantine-spacing-md)) * .8)' }
						}
					/>
				</Group>
				<Stack gap="2">
					 <Text size="sm" fw={500}>Files</Text>
					<Dropzone
						onDrop={handleFilesDrop}
						accept={['image/png']}
						loading={isPending}
						mt="0"
					>
						<div>
							<Text size="l" inline>
								Drag <Code>.PNG</Code> files here or click to select files
							</Text>
							<Text size="sm" c="dimmed" inline mt={7}>
								Attach as many files as you like, each file will be added as a separate contribution
								based on the settings above.
							</Text>
						</div>
					</Dropzone>
					<Text size="xs" c="dimmed" fs="italic">
						Please do not submit textures for unsupported mod/modpack. Ask a council member to add them first.
					</Text>
				</Stack>
			</Stack>

			<Group wrap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'} align="start">
				<ContributionTools
					activeTab={activeTab}
					contributions={contributions}
					onUpdate={reload}
					onSubmitHover={setHoveringSubmit}
					onDeleteMode={setDeletionMode}

					contributionToDelete={contributionToDelete}
					setContributionToDelete={setContributionToDelete}
				/>

				<Group w="100%">
					<Stack w="100%">
						<Button.Group
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

						<Group mb="sm">
							{contributions.filter((c) => c.status === Object
								.values(Status)[activeTab])
								.map((contribution) => (
									<ContributionPanelItem
										key={contribution.id}
										contribution={contribution}
										onClick={handleContributionClick}
										styles={getBorderStyles(contribution)}
									/>
								))
							}
							{coContributions.filter((c) => c.status === Object
								.values(Status)[activeTab])
								.map((contribution) => (
									<ContributionPanelItem
										key={contribution.id}
										contribution={contribution}
										onClick={handleContributionClick}
										styles={getBorderStyles(contribution)}
									/>
								))
							}
						</Group>
					</Stack>
				</Group>
			</Group>
		</Stack>
	);
};

export default SubmitPage;
