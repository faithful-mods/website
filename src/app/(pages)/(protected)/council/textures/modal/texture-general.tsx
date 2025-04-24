import { useState, useTransition } from 'react';

import { PiMagicWandBold } from 'react-icons/pi';

import { Stack, Switch, TextInput, Text, Textarea, Button, Group, Select, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useViewportSize } from '@mantine/hooks';
import { Pack, Resolution } from '@prisma/client';

import { FakeInputLabel } from '~/components/base/fake-input-label';
import { TextureImage } from '~/components/textures/texture-img';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { GRADIENT } from '~/lib/constants';
import { getVanillaTextures } from '~/server/actions/faithful-pack';
import { getTextureStatus, updateTexture } from '~/server/data/texture';

import type { MultiSelectProps } from '@mantine/core';
import type { FaithfulCached, Texture } from '@prisma/client';

export interface TextureGeneralProps {
	texture: Texture;
}

export interface TextureGeneralForm {
	name: string;
	aliases: string;
}

export function TextureGeneral({ texture }: TextureGeneralProps) {
	const [loading, startTransition] = useTransition();
	const { width } = useViewportSize();

	const [contributionsSettings, setContributionsSettings] = useState<PrismaJson.ContributionDeactivationSettingsType>({ all: false, packs: {} });

	const [vanillaTextureSearch, setVanillaTextureSearch] = useState<string>('');
	const [vanillaTexture, setVanillaTexture] = useState<string | null>(texture.vanillaTextureId);
	const [vanillaTextures, setVanillaTextures] = useState<FaithfulCached[]>([]);

	useEffectOnce(() => {
		getTextureStatus(texture.id).then(setContributionsSettings);
		getVanillaTextures().then(setVanillaTextures);
	});

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		return (
			<Group align="start" gap="sm">
				<TextureImage
					src={`https://api.faithfulpack.net/v2/textures/${option.value}/url/default/latest`}
					alt={option.label}
					size={32}
				/>
				<Text>{option.label}</Text>
			</Group>
		);
	};

	const form = useForm<TextureGeneralForm>({
		initialValues: {
			name: texture.name,
			aliases: texture.aliases.join(', '),
		},
		validate: {
			name: (value) => {
				if (!value) return 'A name is required';
				return null;
			},
		},
		onValuesChange: () => {
			form.validate();
		},
	});

	useEffectOnce(() => {
		form.validate();
	});

	const handleSave = () => {
		startTransition(() => {
			updateTexture({
				id: texture.id,
				name: form.values.name,
				aliases: form.values.aliases.split(',').map((a) => a.trim()).filter((a) => !!a),
				contributionsSettings,
				vanillaTextureId: vanillaTexture,
			});
		});
	};

	return (
		<Stack mt="md">
			<Stack w="100%">
				<TextInput
					w="100%"
					required
					label="Name"
					description="Easily recognizable name"
					{...form.getInputProps('name')}
				/>

				<Textarea
					label="Aliases"
					description="Other names that can be used to refer to this texture such as file names or other identifiers"
					placeholder="Separate aliases with a comma"
					{...form.getInputProps('aliases')}
				/>
				<FakeInputLabel
					label="Vanilla Texture"
					description="If this texture is a vanilla texture, select the corresponding vanilla texture, contributions will be disabled"
				>
					<Group gap="xs" wrap="nowrap">
						<ActionIcon
							variant="light"
							className="navbar-icon-fix"
							onClick={() => {
								const name = form.getValues().name;
								const vanillaTexture = vanillaTextures.find((vt) => vt.textureName === name)?.textureId ?? null;

								setVanillaTexture(vanillaTexture);
								setVanillaTextureSearch(name ?? '');
								setContributionsSettings({
									all: true,
									packs: Object.fromEntries(
										(Object.keys(Pack) as Pack[]).map((pack) => [pack, Object.keys(Resolution) as Resolution[]])
									),
								});
							}}
						>
							<PiMagicWandBold />
						</ActionIcon>
						<Select
							w="100%"

							placeholder="Type to search or select a vanilla texture"
							limit={25}

							clearable

							data={vanillaTextures.map((vt) => ({ value: vt.textureId, label: vt.textureName }))}
							value={vanillaTexture}
							defaultValue={vanillaTextures.find((vt) => vt.textureId === vanillaTexture)?.textureName}
							renderOption={renderMultiSelectOption}

							onChange={(vanillaTexture) => {
								setVanillaTexture(vanillaTexture);
								setVanillaTextureSearch(vanillaTextures.find((vt) => vt.textureId === vanillaTexture)?.textureName ?? '');
								setContributionsSettings({
									all: true,
									packs: Object.fromEntries(
										(Object.keys(Pack) as Pack[]).map((pack) => [pack, Object.keys(Resolution) as Resolution[]])
									),
								});
							}}

							searchable
							searchValue={vanillaTextureSearch}
							onSearchChange={setVanillaTextureSearch}
						/>
					</Group>
				</FakeInputLabel>
			</Stack>

			<FakeInputLabel
				label="Contributions"
				description={
					<Stack gap={3}>
						{vanillaTexture !== null && (
							<Text
								component="span"
								c="red"
							>
								A vanilla texture is selected, contributions are disabled automatically
							</Text>
						)}
						<Text component="span">Users will not be able to contribute to this texture</Text>
					</Stack>
				}
				gap="var(--mantine-spacing-xs)"
			>
				<Stack>
					<Switch
						label="Disable contributions"
						disabled={vanillaTexture !== null}
						color="blue"
						onLabel="ON"
						offLabel="OFF"
						checked={contributionsSettings.all}
						onChange={(e) => {
							setContributionsSettings({
								all: e.currentTarget.checked,
								packs: !e.currentTarget.checked ? {} : Object.fromEntries(
									(Object.keys(Pack) as Pack[]).map((pack) => [pack, Object.keys(Resolution) as Resolution[]])
								),
							});
						}}
					/>

					<Stack gap="xs">
						<Text c="dimmed" size="var(--input-description-size, calc(var(--mantine-font-size-sm)  - calc(.125rem * var(--mantine-scale))))">
							Disable contributions for specific pack and resolution
						</Text>

						<Group justify='space-between' wrap="nowrap">
							{(Object.keys(Pack) as Pack[]).map((pack) =>
								<Stack key={pack} gap="xs">
									<Text
										tt="capitalize"
										size="var(--input-description-size, calc(var(--mantine-font-size-sm)  - calc(.125rem * var(--mantine-scale))))"
									>
										{pack.replaceAll('_', ' ').toLowerCase()}
									</Text>
									<Group>
										{(Object.keys(Resolution) as Resolution[]).map((res) =>
											<Switch
												key={res}
												label={res}
												color="blue"
												onLabel="ON"
												offLabel="OFF"
												disabled={contributionsSettings.all}
												checked={contributionsSettings.packs[pack]?.includes(res) ?? false}
												onChange={(e) => {
													const checked = e.currentTarget.checked;
													const newContributionsSettings = { ...contributionsSettings };

													if (checked) {
														newContributionsSettings.packs[pack] = [...(newContributionsSettings.packs[pack] ?? []), res];
													} else {
														newContributionsSettings.packs[pack] = newContributionsSettings.packs[pack]?.filter((r) => r !== res);
													}

													setContributionsSettings(newContributionsSettings);
												}}
											/>
										)}
									</Group>
								</Stack>
							)}
						</Group>

					</Stack>
				</Stack>
			</FakeInputLabel>

			<Button
				mt="xl"
				w="400px"
				mx="auto"
				variant="gradient"
				gradient={GRADIENT}
				onClick={() => handleSave()}
				disabled={loading || !form.isValid()}
				loading={loading}
			>
				Save
			</Button>
		</Stack>
	);
}
