'use client';

import { useEffect, useState } from 'react';

import { Button, Group, JsonInput, Stack } from '@mantine/core';

import { GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { updateMCMETA } from '~/server/data/texture';

import type { Texture } from '@prisma/client';
import type { TextureMCMeta } from 'react-minecraft';

export interface TextureUsesProps {
	texture: Texture;
	onUpdate: (mcmeta: TextureMCMeta | null) => void;
}

export function TextureMCMetaEdition({ texture, onUpdate }: TextureUsesProps) {
	const [mcmeta, setMCMETA] = useState<TextureMCMeta | undefined>(texture.mcmeta ?? undefined);
	const [mcmetaString, setMCMETAString] = useState<string>(mcmeta ? JSON.stringify(mcmeta, null, 2) : '');
	const [isValid, setValid] = useState(false);

	useEffect(() => {
		try {
			const parsed = JSON.parse(mcmetaString);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw '';
			if (!Object.keys(parsed).includes('animation')) throw '';

			setValid(true);
			setMCMETA(parsed);
		} catch {
			setValid(false);
			setMCMETA(undefined);
		}

	}, [mcmetaString]);

	const handleUpdate = () => {
		if (!isValid) return;

		updateMCMETA(texture.id, mcmeta ?? undefined)
			.then(() => onUpdate(mcmeta ?? null));
	};

	const handleDelete = () => {
		setMCMETA(undefined);
		updateMCMETA(texture.id, undefined)
			.then(() => onUpdate(null));
	};

	return (
		<Stack mt="md">
			<Stack
				gap="sm"
				align="start"
			>
				<JsonInput
					label="MCMETA"
					description="20 ticks = 1 second"
					validationError="Invalid JSON"
					formatOnBlur
					autosize
					w="100%"

					value={mcmetaString}
					onChange={setMCMETAString}
				/>
			</Stack>

			<Group gap="md">
				<Button
					w={'calc(50% - (var(--mantine-spacing-md) / 2))'}
					disabled={!texture.mcmeta}
					onClick={handleDelete}
					variant="gradient"
					gradient={GRADIENT_DANGER}
				>
					Delete
				</Button>
				<Button
					w={'calc(50% - (var(--mantine-spacing-md) / 2))'}
					disabled={!isValid}
					onClick={handleUpdate}
					variant="gradient"
					gradient={GRADIENT}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
