import { useMemo, useRef, useState, useTransition } from 'react';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PiMagicWandBold, PiFileArrowUpBold } from 'react-icons/pi';

import { Button, Code, Container, Divider, FileButton, Group, JsonInput, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { Resolution } from '@prisma/client';

import { TextureImage } from '~/components/texture-img';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { getContributionsOfTexture, updateContributionPicture, updateDraftContribution } from '~/server/data/contributions';

import { CoAuthorsSelector } from './co-authors-select';

import type { MultiSelectProps } from '@mantine/core';
import type { Texture } from '@prisma/client';
import type { GetTexturesWithUsePaths } from '~/server/data/texture';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll, PublicUser } from '~/types';

export interface ContributionModalProps {
	contribution: ContributionWithCoAuthors;
	textures: GetTexturesWithUsePaths[];
	onClose: (editedContribution: ContributionWithCoAuthors) => void;
}

export function ContributionModal({ contribution, textures, onClose }: ContributionModalProps) {
	const [isPending, startTransition] = useTransition();
	const [selectedTexture, setSelectedTexture] = useState<Texture | null>(null);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>(contribution.coAuthors);
	const [selectedResolution, setSelectedResolution] = useState<Resolution>(contribution.resolution);
	const [windowWidth] = useDeviceSize();

	const stackRef = useRef<HTMLDivElement>(null);

	const colWidth = useMemo(() => {
		const width = stackRef.current?.parentElement?.clientWidth ?? 0;
		return windowWidth <= BREAKPOINT_MOBILE_LARGE ? `${width * .93}px` : `calc((${width}px - (2 * var(--mantine-spacing-md))) / 3.25)`;
	},
	[stackRef, windowWidth]);

	const columnStyle = {
		width: colWidth,
	};

	const [selectedTextureId, setSelectedTextureId] = useState<number | null>(null);
	const [selectedTextureContributions, setSelectedTextureContributions] = useState<ContributionWithCoAuthorsAndPoll[]>([]);
	const [selectedTextureContributionsIndex, setSelectedTextureContributionsIndex] = useState<number>(0);
	const [displayedSelectedTextureContributions, setDisplayedSelectedTextureContributions] = useState<ContributionWithCoAuthorsAndPoll | undefined>();

	const [disabledResolution, setDisabledResolution] = useState<(Resolution | null)[]>([]);

	const [contributionMCMETA, setContributionMCMETA] = useState<string>(contribution.mcmeta ? JSON.stringify(contribution.mcmeta, null, 2) : '');
	const parsedMCMETA = useMemo(() => {
		try {
			return JSON.parse(contributionMCMETA);
		} catch {
			return null;
		}
	}, [contributionMCMETA]);

	const author = useCurrentUser()!;

	useEffectOnce(() => {
		if (contribution.textureId) handleTextureSelected(contribution.textureId);
	});

	const handleTextureSelected = (textureId: number | null) => {
		if (textureId === null) {
			setSelectedTexture(null);
			setSelectedTextureId(null);
			setSelectedTextureContributions([]);
			setSelectedTextureContributionsIndex(0);
			setDisplayedSelectedTextureContributions(undefined);
			setContributionMCMETA('');
			setDisabledResolution([]);
			return;
		}

		const texture = textures.find((t) => t.id === textureId)!;
		const disabled = texture.disabledContributions.map((d) => d.resolution);
		setDisabledResolution(disabled);
		setSelectedTexture(texture);
		setSelectedTextureId(texture.id);

		if (!contributionMCMETA && texture.mcmeta) setContributionMCMETA(JSON.stringify(texture.mcmeta, null, 2));

		getContributionsOfTexture(textureId)
			.then((res) => {
				// remove the current contribution from the list
				res = res.filter((c) => c.resolution === selectedResolution && c.id !== contribution.id);

				setSelectedTextureContributions(res);
				setSelectedTextureContributionsIndex(0);
				setDisplayedSelectedTextureContributions(res[0]);
			})
			.catch(console.error);
	};

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const texture = textures.find((u) => u.id === parseInt(option.value, 10))!;

		return (
			<Stack gap="sm" className="w-full">
				<Group gap="sm" wrap="nowrap" align="start">
					<TextureImage src={texture.filepath} alt="" size={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 60 : 160} mcmeta={texture.mcmeta} />
					<Stack gap={2} className="w-full">
						<Group wrap="nowrap" className="w-full">
							{windowWidth > BREAKPOINT_MOBILE_LARGE && (
								<Text w={50} size="sm" fw={400}>Name:</Text>
							)}
							<Code>{texture.name}</Code>
						</Group>
						{texture.aliases.length > 0 && (
							<Group wrap="nowrap" className="w-full">
								{windowWidth > BREAKPOINT_MOBILE_LARGE && (
									<Text w={50} size="sm" fw={400}>Aliases:</Text>
								)}
								<Group gap={2}>
									{texture.aliases.map((a, index) => <Code key={index}>{a}</Code>)}
								</Group>
							</Group>
						)}
						{windowWidth > BREAKPOINT_MOBILE_LARGE && (
							<Group align="start" wrap="nowrap" className="w-full">
								<Text w={50} size="sm" fw={400}>Uses:</Text>
								<Stack gap={2}>
									{texture.linkedTextures.map((t, index) =>
										<Code key={index}>{t.assetPath}</Code>
									)}
								</Stack>
							</Group>
						)}
					</Stack>
				</Group>

				{windowWidth <= BREAKPOINT_MOBILE_LARGE && (
					<Stack gap={2}>
						{texture.linkedTextures.map((t, index) =>
							<Code key={index}>{t.assetPath}</Code>
						)}
					</Stack>
				)}
			</Stack>
		);
	};

	const handlePrevContribution = () => {
		if (selectedTextureContributionsIndex === 0) return;
		let index = selectedTextureContributionsIndex - 1;
		setSelectedTextureContributionsIndex(index);
		setDisplayedSelectedTextureContributions(selectedTextureContributions[index]);
	};

	const handleNextContribution = () => {
		if (selectedTextureContributionsIndex === selectedTextureContributions.length - 1) return;
		let index = selectedTextureContributionsIndex + 1;
		setSelectedTextureContributionsIndex(index);
		setDisplayedSelectedTextureContributions(selectedTextureContributions[index]);
	};

	const handleContributionFileChange = (file: File | null) => {
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		startTransition(() => {
			updateContributionPicture(author.id!, contribution.id, formData)
				.then(() => onClose(contribution));
		});
	};

	const handleDraftUpdate = () => {
		if (!selectedTexture) return;

		startTransition(() => {
			updateDraftContribution({
				ownerId: author.id!,
				contributionId: contribution.id,
				coAuthors: selectedCoAuthors.map((c) => c.id),
				resolution: selectedResolution,
				textureId: selectedTexture.id,
				mcmeta: parsedMCMETA,
			})
				.then(onClose)
				.catch(console.error);
		});
	};

	const handleCancel = () => {
		onClose(contribution);
	};

	return (
		<Stack gap="lg" className="w-full" ref={stackRef} align="center">
			<Group gap="md" align="start">
				{/* User contribution */}
				<Stack gap="md" align="left" justify="space-between" style={columnStyle}>
					<Stack gap="0">
						<Title order={5}>Yours</Title>
						<Text size="sm" c="dimmed">The file you&apos;re submitting.</Text>
					</Stack>
					<Group wrap="nowrap">
						<FileButton accept="image/png" onChange={handleContributionFileChange}>
							{(props) => (
								<Button
									variant="light"
									color="blue"
									p={0}
									className="navbar-icon-fix"
									loading={isPending}
									{...props}
								>
									<PiFileArrowUpBold />
								</Button>
							)}
						</FileButton>
						<TextInput
							value={contribution.filename}
							disabled
							className="w-full"
						/>
					</Group>
					<TextureImage
						src={contribution.filepath}
						mcmeta={parsedMCMETA}
						size={colWidth}
						alt=""
					/>
					<JsonInput
						label={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'Custom MCMETA' : <></>}
						validationError="Invalid JSON"
						formatOnBlur
						autosize
						minRows={4}

						value={contributionMCMETA}
						onChange={setContributionMCMETA}
					/>
				</Stack>
				{/* Default texture */}
				<Stack gap="md" align="left" justify="space-between" style={columnStyle}>
					<Stack gap="0">
						<Title order={5}>Default Texture</Title>
						<Text size="sm" c="dimmed">The targeted texture.</Text>
					</Stack>
					<Group wrap="nowrap">
						<Button
							variant="light"
							color="blue"
							p={0}
							className="navbar-icon-fix"
							loading={isPending}
							onClick={() => {
								startTransition(() => {
									const texture = textures.find((t) => t.name === contribution.filename.replace('.png', '') || t.aliases.includes(contribution.filename.replace('.png', '')));
									if (texture) handleTextureSelected(texture.id);
								});
							}}
						>
							<PiMagicWandBold />
						</Button>
						<Select
							limit={100}
							data={textures.map((t) => ({ value: t.id.toString(), label: `${t.name} ${t.aliases.join(' ')} ${t.linkedTextures.map((l) => l.assetPath).join(' ')} ${t.id}`, disabled: t.id === selectedTextureId }))}
							defaultValue={contribution.textureId?.toString()}
							value={selectedTextureId?.toString()}
							renderOption={renderMultiSelectOption}
							className="w-full"
							onChange={(e) => handleTextureSelected(e ? parseInt(e, 10) : null)}
							onClear={() => setSelectedTexture(null)}
							maxDropdownHeight={colWidth}
							comboboxProps={windowWidth > BREAKPOINT_MOBILE_LARGE
								? {
									width: `calc((${colWidth} * 3) + 2 * var(--mantine-spacing-md))`,
									offset: {
										mainAxis: 5,
										crossAxis: -27,
									},
								}
								: {
									width: colWidth,
									offset: {
										mainAxis: 5,
										crossAxis: -27,
									},
								}
							}
							placeholder="Search a texture by its name/path..."
							searchable
							required
							clearable
						/>
					</Group>
					{selectedTexture &&
						<TextureImage
							src={selectedTexture.filepath}
							size={colWidth}
							mcmeta={selectedTexture?.mcmeta}
							alt=""
						/>
					}
					{!selectedTexture && <Container className="texture-background" pt="100%" pl="calc(100% - var(--mantine-spacing-md))" />}
					<JsonInput
						label={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'Default MCMETA' : <Title order={6} ta="center">MCMETA</Title>}
						labelProps={{ style: { width: '100%' } }}
						validationError="Invalid JSON"
						formatOnBlur
						autosize
						minRows={4}

						value={(selectedTexture?.mcmeta && JSON.stringify(selectedTexture?.mcmeta, null, 2)) ?? ''}
						disabled
					/>
				</Stack>
				{/* Existing contribution */}
				<Stack gap="md" align="left" justify="space-between" style={columnStyle}>
					<Stack gap="0">
						<Title order={5}>Existing Contributions</Title>
						<Text size="sm" c="dimmed">Of the targeted texture.</Text>
					</Stack>
					<Group gap="md" justify="center">
						<Button
							variant="light"
							disabled={selectedTextureContributions.length === 0 || selectedTextureContributionsIndex === 0}
							onClick={handlePrevContribution}
						>
							<FaChevronLeft/>
						</Button>
						{selectedTextureContributions.length > 0 &&
							<Group w={50} align="center">
								<Text w={50} ta="center">{selectedTextureContributionsIndex + 1} / {selectedTextureContributions.length}</Text>
							</Group>
						}
						{selectedTextureContributions.length === 0 &&
							<Group w={50} align="center">
								<Text w={50} ta="center">- / -</Text>
							</Group>
						}
						<Button
							variant="light"
							disabled={selectedTextureContributions.length === 0 || selectedTextureContributionsIndex === selectedTextureContributions.length - 1}
							onClick={handleNextContribution}
						>
							<FaChevronRight/>
						</Button>
					</Group>
					{!selectedTexture && selectedTextureContributions.length === 0 &&
						<Container className="texture-background" pt="100%" pl="calc(100% - var(--mantine-spacing-md))" pos="relative">
							<Text
								size="sm"
								pos="absolute"
								left="0"
								right="0"
								top="calc(50% - (20.3px /2))" // text height / 2
								style={{ textAlign: 'center' }}
							>
								Select a texture first!
							</Text>
						</Container>
					}
					{selectedTexture && selectedTextureContributions.length === 0 &&
						<Container className="texture-background" pt="100%" pl="calc(100% - var(--mantine-spacing-md))" pos="relative">
							<Text
								size="sm"
								pos="absolute"
								left="0"
								right="0"
								top="calc(50% - (20.3px /2))" // text height / 2
								style={{ textAlign: 'center' }}
							>
								No contributions for this texture.
							</Text>
						</Container>
					}
					{selectedTexture && selectedTextureContributions.length > 0 && displayedSelectedTextureContributions &&
						<TextureImage
							src={displayedSelectedTextureContributions.filepath}
							size={colWidth}
							mcmeta={displayedSelectedTextureContributions?.mcmeta}
							alt=""
						/>
					}
					<JsonInput
						label={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'Contribution MCMETA' : <></>}
						validationError="Invalid JSON"
						formatOnBlur
						autosize
						minRows={4}

						value={JSON.stringify(displayedSelectedTextureContributions?.mcmeta, null, 2)}
						disabled
					/>
				</Stack>

			</Group>

			<Divider size="xs" w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '90%' : `calc(${colWidth} * 1.5)`}/>

			<Group gap="md" justify="center" >
				<Select
					label="Resolution"
					data={(Object.keys(Resolution) as Resolution[]).filter((r) => !disabledResolution.includes(r))}
					disabled={disabledResolution.length === Object.keys(Resolution).length || disabledResolution.includes(null)}
					allowDeselect={false}
					defaultValue={contribution.resolution}
					onChange={(value) => setSelectedResolution(value as Resolution)}
					style={windowWidth <= BREAKPOINT_MOBILE_LARGE ? { width: '100%' } : { width: 'calc((100% - var(--mantine-spacing-md)) * .2)' }}
					required
				/>
				<CoAuthorsSelector
					author={author}
					onCoAuthorsSelect={setSelectedCoAuthors}
					defaultValue={selectedCoAuthors.map((c) => c.id)}
					style={windowWidth <= BREAKPOINT_MOBILE_LARGE
						? { width: '100%' }
						: { width: 'calc((100% - var(--mantine-spacing-md)) * .8)' }
					}
				/>
			</Group>
			{(disabledResolution.length === Object.keys(Resolution).length || disabledResolution.includes(null)) && (
				<Text size="xs" c="red" mt={-10}>
					Contributions for all resolutions are deactivated for this texture.
				</Text>
			)}

			<Group gap="md" justify="center" className="w-full" mt="xl">
				<Button
					fullWidth
					maw="200px"
					loading={isPending}
					variant="gradient"
					gradient={GRADIENT_DANGER}
					onClick={handleCancel}
				>
					Cancel
				</Button>
				<Button
					fullWidth
					maw="200px"
					loading={isPending}
					disabled={!selectedTexture || disabledResolution.length === Object.keys(Resolution).length || disabledResolution.includes(null)}
					variant="gradient"
					gradient={GRADIENT}
					onClick={handleDraftUpdate}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
