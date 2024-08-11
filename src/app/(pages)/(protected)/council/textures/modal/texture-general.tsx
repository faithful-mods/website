import { useState, useTransition } from 'react';

import { Stack, Switch, TextInput, Text, Textarea, Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Resolution } from '@prisma/client';

import { TextureImage } from '~/components/texture-img';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient } from '~/lib/utils';
import { getTextureStatus, getVanillaTextures, updateTexture } from '~/server/data/texture';

import type { MultiSelectProps } from '@mantine/core';
import type { Texture } from '@prisma/client';
import type { ContributionActivationStatus, FPTextureRaw } from '~/types';

export interface TextureGeneralProps {
	texture: Texture;
}

export interface TextureGeneralForm {
	name: string;
	aliases: string;
}

export function TextureGeneral({ texture }: TextureGeneralProps) {
	const [loading, startTransition] = useTransition();

	const [contributionsStatus, setContributionsStatus] = useState<ContributionActivationStatus[]>([]);

	const [vanillaTexture, setVanillaTexture] = useState<string | null>(texture.vanillaTexture);
	const [vanillaTextures, setVanillaTextures] = useState<FPTextureRaw[]>([]);

	useEffectOnce(() => {
		getTextureStatus(texture.id)
			.then(setContributionsStatus);

		getVanillaTextures()
			.then(setVanillaTextures);
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
				contributions: contributionsStatus,
				vanillaTexture,
			});
		});
	};

	return (
		<Stack>
			<Group mt="md" wrap="nowrap" align="start">
				<Stack gap="sm" w="100%">
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
				</Stack>
				<Stack gap="sm" w="100%">
					<Select
						w="100%"
						limit={5}
						label="Vanilla texture"
						placeholder="Type to search or select a vanilla texture"
						description="If this texture is a vanilla texture, select the corresponding vanilla texture, contributions will be disabled"
						clearable
						searchable
						value={vanillaTexture}
						data={vanillaTextures.map((vt) => ({ value: vt.id, label: vt.name }))}
						renderOption={renderMultiSelectOption}
						onChange={(vanillaTexture) => {
							setVanillaTexture(vanillaTexture);
							setContributionsStatus([
								{ resolution: null, status: vanillaTexture === null },
								...Object.keys(Resolution).flatMap((res) => ({ resolution: res as Resolution, status: vanillaTexture === null })),
							]);
						}}
					/>

					<Stack gap="xs">
						<Stack gap={5}>
							<Text size="var(--input-label-size, var(--mantine-font-size-sm))">
							Contributions
							</Text>
							<Text c="dimmed" size="var(--input-description-size, calc(var(--mantine-font-size-sm)  - calc(.125rem * var(--mantine-scale))))">
							Users will not be able to contribute to this texture on the unselected resolutions
							</Text>
						</Stack>
						<Switch
							label="Contributions enabled"
							disabled={vanillaTexture !== null}
							color={gradient.to}
							onLabel="ON"
							offLabel="OFF"
							checked={contributionsStatus.find((s) => s.resolution === null)?.status}
							onChange={(e) => {
								setContributionsStatus([
									{ resolution: null, status: e.currentTarget.checked },
									...Object.keys(Resolution).flatMap((res) => ({ resolution: res as Resolution, status: e.currentTarget.checked })),
								]);
							}}
						/>

						{(Object.keys(Resolution) as Resolution[]).map((res) =>
							<Switch
								key={res}
								label={res}
								color={gradient.to}
								onLabel="ON"
								offLabel="OFF"
								disabled={!contributionsStatus.find((s) => s.resolution === null)?.status}
								checked={contributionsStatus.find((s) => s.resolution === res)?.status}
								onChange={(e) => {
									setContributionsStatus(contributionsStatus.map((s) => s.resolution === res ? { resolution: res, status: e.currentTarget.checked } : s));
								}}
							/>
						)}

					</Stack>
				</Stack>
			</Group>

			<Group
				justify='end'
			>
				<Button
					variant="gradient"
					gradient={gradient}
					onClick={() => handleSave()}
					disabled={loading || !form.isValid()}
					loading={loading}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
