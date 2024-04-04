import { Avatar, Button, Card, Divider, Group, Image, MultiSelectProps, Select, Stack, Text, Title } from '@mantine/core';
import { Resolution, type Texture } from '@prisma/client';
import { useState, useTransition } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PiMagicWandBold } from 'react-icons/pi';

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
	textures: Texture[];
	onClose: (editedContribution: ContributionWithCoAuthors) => void;
}

export const IMAGE_WIDTH = 320;
export const MODAL_WIDTH = 3.1 * IMAGE_WIDTH;
export const ROW_HEIGHT = 36;

export function ContributionDraftModal({ contribution, textures, onClose }: ContributionDraftModalProps) {
	const [isPending, startTransition] = useTransition();
	const [selectedTexture, setSelectedTexture] = useState<Texture | null>(null);
	const [selectedCoAuthors, setSelectedCoAuthors] = useState<PublicUser[]>(contribution.coAuthors);
	const [selectedResolution, setSelectedResolution] = useState<Resolution>(contribution.resolution);
	const [windowWidth, _] = useDeviceSize();

	const [selectedTextureContributions, setSelectedTextureContributions] = useState<ContributionWithCoAuthorsAndPoll[]>([]);
	const [selectedTextureContributionsIndex, setSelectedTextureContributionsIndex] = useState<number>(0);
	const [displayedSelectedTextureContributions, setDisplayedSelectedTextureContributions] = useState<ContributionWithCoAuthorsAndPoll | undefined>();

	const author = useCurrentUser()!;

	useEffectOnce(() => {
		if (contribution.textureId) selectedTextureUpdated(contribution.textureId);
	});

	const selectedTextureUpdated = (textureId: string | null) => {
		if (textureId === null) {
			setSelectedTexture(null);
			setSelectedTextureContributions([]);
			setSelectedTextureContributionsIndex(0);
			setDisplayedSelectedTextureContributions(undefined);
			return;
		}

		const texture = textures.find((t) => t.id === textureId)!;
		getContributionsOfTexture(textureId)
			.then((res) => {
				setSelectedTexture(texture);
				setSelectedTextureContributions(res);
				setSelectedTextureContributionsIndex(0);
				setDisplayedSelectedTextureContributions(res[0]);
			})
			.catch(console.error)
	}

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const texture = textures.find((u) => u.id === option.value)!;

		return (
			<Group gap="sm" wrap="nowrap">
				<Avatar src={texture.filepath} size={40} radius="0" className="texture-background image-pixelated"/>
				<div>
					<Text size="sm">{sanitizeTextureName(texture.name)}</Text>
					{option.disabled && <Text size="xs" c="dimmed">Already selected!</Text>}
					{/* TODO for #18 {!option.disabled && <Text size="xs" c="dimmed">{texture.aliases.join(', ')}</Text>} */}
				</div>
			</Group>
		);
	};

	/** 
	 * @deprecated To be removed when #18 is implemented.
	*/
	const sanitizeTextureName = (name: string): string => {
		return name.split('_')[1]?.split('.')[0];
	}

	const previousContribution = () => {
		if (selectedTextureContributionsIndex === 0) return;
		let index = selectedTextureContributionsIndex - 1;
		setSelectedTextureContributionsIndex(index);
		setDisplayedSelectedTextureContributions(selectedTextureContributions[index]);
	}

	const nextContribution = () => {
		if (selectedTextureContributionsIndex === selectedTextureContributions.length - 1) return;
		let index = selectedTextureContributionsIndex + 1;
		setSelectedTextureContributionsIndex(index);
		setDisplayedSelectedTextureContributions(selectedTextureContributions[index]);
	}

	const updateDraft = () => {
		if (!selectedTexture) return;

		startTransition(() => {
			updateDraftContribution({
				ownerId: author.id!,
				contributionId: contribution.id,
				coAuthors: selectedCoAuthors.map((c) => c.id),
				resolution: selectedResolution,
				textureId: selectedTexture.id,
			})
				.then(onClose)
				.catch(console.error)
		})
	}

	const cancelAndClose = () => {
		onClose(contribution);
	}

	return (
		<Stack gap="md" w={MODAL_WIDTH} style={{ margin: '0 auto' }}>
			<Group gap="md" wrap="nowrap" justify="center" align="center">
				{/* User contribution */}
				<Stack gap="md" align="center" justify="space-between">
					<Stack gap="0" style={{ width: `${IMAGE_WIDTH}px` }}>
						<Title order={5}>Your Contribution</Title>
						<Text size="sm" c="dimmed">This is the contribution you are currently editing.</Text>
					</Stack>
					<Card h={ROW_HEIGHT} w={IMAGE_WIDTH} shadow="0" withBorder p="0">
						<Group h={IMAGE_WIDTH} justify="center">
							<Text size="sm">{contribution.filename}</Text>
						</Group>
					</Card>
					<Image 
						src={contribution.file}
						className="texture-background image-pixelated"
						width={IMAGE_WIDTH}
						height={IMAGE_WIDTH}
						fit="contain"
						style={{ maxWidth: `${IMAGE_WIDTH}px`, maxHeight: `${IMAGE_WIDTH}px`, minWidth: `${IMAGE_WIDTH}px`, minHeight: `${IMAGE_WIDTH}px` }} 
						alt=""
					/>
				</Stack>
				{/* Default texture */}
				<Stack gap="md" align="center" justify="space-between">
					<Stack gap="0" style={{ width: `${IMAGE_WIDTH}px` }}>
						<Title order={5}>Default Texture</Title>
						<Text size="sm" c="dimmed">This is the texture that will be contributed to.</Text>
					</Stack>
					<Group 
						style={{ width: `${IMAGE_WIDTH}px` }}
						wrap="nowrap"
					>
						<Button 
							variant="light"
							color={gradient.to}
							className="navbar-icon-fix"
							onClick={() => {
								const texture = textures.find((t) => sanitizeTextureName(t.name) === contribution.filename.replace('.png', ''));
								if (texture) {
									selectedTextureUpdated(texture.id);
									
								}
								// else // TODO #18 look for aliases
							}}
						>
							<PiMagicWandBold />
						</Button>
						<Select 
							limit={256}
							// TODO for #18 label = texture name AND aliases
							data={textures.map((t) => ({ value: t.id, label: sanitizeTextureName(t.name), disabled: t.id === selectedTexture?.id }))}
							defaultValue={contribution.textureId}
							renderOption={renderMultiSelectOption}
							className="w-full"
							onChange={selectedTextureUpdated}
							onClear={() => setSelectedTexture(null)}
							searchValue={sanitizeTextureName(selectedTexture?.name ?? '')}
							placeholder="Search a texture..."
							searchable
							clearable
						/>
					</Group>
					{selectedTexture && 
						<Image 
							src={selectedTexture.filepath}
							className="texture-background image-pixelated"
							width={IMAGE_WIDTH}
							height={IMAGE_WIDTH}
							fit="contain"
							style={{ maxWidth: `${IMAGE_WIDTH}px`, maxHeight: `${IMAGE_WIDTH}px`, minWidth: `${IMAGE_WIDTH}px`, minHeight: `${IMAGE_WIDTH}px` }} 
							alt=""
						/>
					}
					{!selectedTexture && <Card h={IMAGE_WIDTH} w={IMAGE_WIDTH} shadow="0" radius={0} className="texture-background" />}
				</Stack>
				{/* Existing contribution */}
				<Stack gap="md" align="center" justify="space-between">
					<Stack gap="0" style={{ width: `${IMAGE_WIDTH}px` }}>
						<Title order={5}>Existing Contributions</Title>
						<Text size="sm" c="dimmed">Contributions of the selected texture.</Text>
					</Stack>
					<Group gap="md">
						<Button
							variant="light"
							disabled={selectedTextureContributions.length === 0 || selectedTextureContributionsIndex === 0}
							onClick={previousContribution}
						>
							<FaChevronLeft/>
						</Button>
						{selectedTextureContributions.length > 0 && 
							<Group w={50} align="center">
								<Text w={50} style={{ textAlign: 'center' }}>{selectedTextureContributionsIndex + 1} / {selectedTextureContributions.length}</Text>
							</Group>
						}
						{selectedTextureContributions.length === 0 && 
							<Group w={50} align="center">
								<Text w={50} style={{ textAlign: 'center' }}>- / -</Text>
							</Group>
						}
						<Button
							variant="light"
							disabled={selectedTextureContributions.length === 0 || selectedTextureContributionsIndex === selectedTextureContributions.length - 1}
							onClick={nextContribution}
						>
							<FaChevronRight/>
						</Button>
					</Group>
					{!selectedTexture && selectedTextureContributions.length === 0 &&
						<Card h={IMAGE_WIDTH} w={IMAGE_WIDTH} className="texture-background" shadow="0" radius={0}>
							<Group h={IMAGE_WIDTH} justify="center">
								<Text size="sm">Select a texture first!</Text>
							</Group>
						</Card>
					}
					{selectedTexture && selectedTextureContributions.length === 0 &&
						<Card h={IMAGE_WIDTH} w={IMAGE_WIDTH} className="texture-background" shadow="0" radius={0}>
							<Group h={IMAGE_WIDTH} justify="center">
								<Text size="sm">No contributions for this texture.</Text>
							</Group>
						</Card>
					}
					{selectedTexture && selectedTextureContributions.length > 0 && displayedSelectedTextureContributions &&
						<Image 
							src={displayedSelectedTextureContributions.file}
							className="texture-background image-pixelated"
							width={IMAGE_WIDTH}
							height={IMAGE_WIDTH}
							fit="contain"
							style={{ maxWidth: `${IMAGE_WIDTH}px`, maxHeight: `${IMAGE_WIDTH}px`, minWidth: `${IMAGE_WIDTH}px`, minHeight: `${IMAGE_WIDTH}px` }} 
							alt=""
						/>
					}
				</Stack>

			</Group>
			<Group className="w-full" mt="lg">
				<Title order={4}>Contribution Info</Title>
			</Group>
			<Group gap="md" justify="center">
				<Select 
					label="Resolution" 
					data={Object.keys(Resolution)}
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
			<Group gap="md" justify="center" className="w-full" mt="xl">
				<Button loading={isPending} variant="gradient" gradient={gradientDanger} onClick={cancelAndClose}>Cancel</Button>
				<Button loading={isPending} disabled={!selectedTexture} variant="gradient" gradient={gradient} onClick={updateDraft}>Save</Button>
			</Group>
		</Stack>
	)
}