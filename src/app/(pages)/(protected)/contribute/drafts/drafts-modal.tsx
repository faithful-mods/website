import { Avatar, Button, Container, Group, JsonInput, MultiSelectProps, Select, Stack, Text, Title } from '@mantine/core';
import { ContributionDeactivation, Resolution, type Texture } from '@prisma/client';
import { useMemo, useRef, useState, useTransition } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PiMagicWandBold } from 'react-icons/pi';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, gradientDanger } from '~/lib/utils';
import { getContributionsOfTexture, updateDraftContribution } from '~/server/data/contributions';
import type { ContributionWithCoAuthors, ContributionWithCoAuthorsAndPoll, PublicUser } from '~/types';

import { CoAuthorsSelector } from '../co-authors-select';

export interface ContributionDraftModalProps {
	contribution: ContributionWithCoAuthors;
	textures: (Texture & { disabledContributions: ContributionDeactivation[] })[];
	onClose: (editedContribution: ContributionWithCoAuthors) => void;
}

export function ContributionDraftModal({ contribution, textures, onClose }: ContributionDraftModalProps) {
	const [isPending, startTransition] = useTransition();
	const [selectedTexture, setSelectedTexture] = useState<Texture | null>(null);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>(contribution.coAuthors);
	const [selectedResolution, setSelectedResolution] = useState<Resolution>(contribution.resolution);
	const [windowWidth] = useDeviceSize();

	const rowHeight = 36;
	const stackRef = useRef<HTMLDivElement>(null);
	const colWidth = useMemo(() => {
		const width = stackRef.current?.parentElement?.clientWidth ?? 0;

		return windowWidth <= BREAKPOINT_MOBILE_LARGE ? width : `calc((${width}px - (2 * var(--mantine-spacing-md))) / 3.1)`;
	},
	[stackRef, windowWidth]);

	const columnStyle = {
		width: colWidth,
	};

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

	const handleTextureSelected = (textureId: string | null) => {
		if (textureId === null) {
			setSelectedTexture(null);
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
		if (!contributionMCMETA) setContributionMCMETA(JSON.stringify(texture.mcmeta, null, 2));

		getContributionsOfTexture(textureId)
			.then((res) => {
				setSelectedTexture(texture);
				setSelectedTextureContributions(res);
				setSelectedTextureContributionsIndex(0);
				setDisplayedSelectedTextureContributions(res[0]);
			})
			.catch(console.error);
	};

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const texture = textures.find((u) => u.id === option.value)!;

		return (
			<Group gap="sm" wrap="nowrap">
				<Avatar src={texture.filepath} size={40} radius="0" className="texture-background image-pixelated"/>
				<div>
					<Text size="sm">{texture.name}</Text>
					{option.disabled && <Text size="xs" c="dimmed">Already selected!</Text>}
					{!option.disabled && <Text size="xs" c="dimmed">{texture.aliases.join(', ')}</Text>}
				</div>
			</Group>
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
		<Stack gap="lg" className="w-full" ref={stackRef}>
			<Group gap="md" justify="center">
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

			<Group gap="md" align="start">
				{/* User contribution */}
				<Stack gap="md" align="left" justify="space-between" style={columnStyle}>
					<Stack gap="0">
						<Title order={5}>Your Contribution</Title>
						<Text size="sm" c="dimmed">The file you&apos;re submitting.</Text>
					</Stack>
					<Tile h={rowHeight} shadow="0" radius="sm" p="0">
						<Group justify="center" h={rowHeight}>
							<Text size="sm">{contribution.filename}</Text>
						</Group>
					</Tile>
					<TextureImage
						src={contribution.file}
						mcmeta={parsedMCMETA}
						size={colWidth}
						alt=""
					/>
					<JsonInput
						label="&nbsp;"
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
							color={gradient.to}
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
							data={textures.map((t) => ({ value: t.id, label: `${t.name} ${t.aliases.join(' ')}`, disabled: t.id === selectedTexture?.id }))}
							defaultValue={contribution.textureId}
							renderOption={renderMultiSelectOption}
							className="w-full"
							onChange={handleTextureSelected}
							onClear={() => setSelectedTexture(null)}
							placeholder="Search a texture..."
							searchable
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
						label={<Title order={6} ta="center">MCMETA</Title>}
						labelProps={{ style: { width: '100%' }}}
						validationError="Invalid JSON"
						formatOnBlur
						autosize
						minRows={4}

						value={JSON.stringify(selectedTexture?.mcmeta, null, 2)}
						disabled
					/>
				</Stack>
				{/* Existing contribution */}
				<Stack gap="md" align="left" justify="space-between" style={columnStyle}>
					<Stack gap="0">
						<Title order={5}>Existing Contributions</Title>
						<Text size="sm" c="dimmed">For the selected texture.</Text>
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
							src={displayedSelectedTextureContributions.file}
							size={colWidth}
							mcmeta={displayedSelectedTextureContributions?.mcmeta}
							alt=""
						/>
					}
					<JsonInput
						label="&nbsp;"
						validationError="Invalid JSON"
						formatOnBlur
						autosize
						minRows={4}

						value={JSON.stringify(displayedSelectedTextureContributions?.mcmeta, null, 2)}
						disabled
					/>
				</Stack>

			</Group>

			<Group gap="md" justify="center" className="w-full" mt="xl">
				<Button
					loading={isPending}
					variant="gradient"
					gradient={gradientDanger}
					onClick={handleCancel}
				>
					Cancel
				</Button>
				<Button
					loading={isPending}
					disabled={!selectedTexture || disabledResolution.length === Object.keys(Resolution).length || disabledResolution.includes(null)}
					variant="gradient"
					gradient={gradient}
					onClick={handleDraftUpdate}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
