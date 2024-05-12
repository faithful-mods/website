import { Stack, Switch, TextInput, Text, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Resolution, Texture } from '@prisma/client';
import { useState, useTransition } from 'react';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient } from '~/lib/utils';
import { getTextureStatus, updateTexture } from '~/server/data/texture';
import type { ContributionActivationStatus } from '~/types';

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

	useEffectOnce(() => {
		getTextureStatus(texture.id)
			.then(setContributionsStatus);
	});

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
				aliases: form.values.aliases.split(',').map((a) => a.trim()),
				contributions: contributionsStatus,
			});
		});
	};

	return (
		<Stack mt="md">
			<TextInput
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
					label="All resolutions"
					color={gradient.to}
					onLabel="ON"
					offLabel="OFF"
					checked={contributionsStatus.find((s) => s.resolution === null)?.status}
					onChange={() => {
						const general = contributionsStatus.find((s) => s.resolution === null)!;
						setContributionsStatus([...contributionsStatus.filter((s) => s.resolution !== null), { resolution: null, status: !general.status}]);
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
						onChange={() => {
							const perRes = contributionsStatus.find((s) => s.resolution === res)!;
							setContributionsStatus([...contributionsStatus.filter((s) => s.resolution !== res), { resolution: res, status: !perRes.status}]);
						}}
					/>
				)}

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
		</Stack>

	);
}
