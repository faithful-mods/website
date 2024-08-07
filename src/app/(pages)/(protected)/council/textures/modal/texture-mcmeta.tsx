'use client';

import { useEffect, useState } from 'react';

import { Button, Group, JsonInput, Stack } from '@mantine/core';

import { gradient, gradientDanger } from '~/lib/utils';
import { updateMCMETA } from '~/server/data/texture';

import type { Texture } from '@prisma/client';
import type { TextureMCMETA } from '~/types';

export interface TextureUsesProps {
	texture: Texture;
	onUpdate: (mcmeta: TextureMCMETA | null) => void;
}

export function TextureMCMETAEdition({ texture, onUpdate }: TextureUsesProps) {
	const [mcmeta, setMCMETA] = useState<string>(texture.mcmeta ? JSON.stringify(texture.mcmeta, null, 2) : '');
	const [isValid, setValid] = useState(false);

	useEffect(() => {
		try {
			const parsed = JSON.parse(mcmeta);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw '';
			if (!Object.keys(parsed).includes('animation')) throw '';

			setValid(true);
		} catch {
			setValid(false);
		}

	}, [mcmeta]);

	const handleUpdate = () => {
		if (!isValid) return;

		const parsed: TextureMCMETA = JSON.parse(mcmeta);
		updateMCMETA(texture.id, parsed)
			.then(() => onUpdate(parsed));
	};

	const handleDelete = () => {
		setMCMETA('');
		updateMCMETA(texture.id, undefined)
			.then(() => onUpdate(null));
	};

	return (
		<Stack mt="md">
			<JsonInput
				label="Texture MCMETA"
				validationError="Invalid JSON"
				formatOnBlur
				autosize
				minRows={4}

				value={mcmeta}
				onChange={setMCMETA}
			/>

			<Group gap="md">
				<Button w={'calc(50% - (var(--mantine-spacing-md) / 2))'} disabled={!texture.mcmeta} onClick={handleDelete} variant="gradient" gradient={gradientDanger}>Delete</Button>
				<Button w={'calc(50% - (var(--mantine-spacing-md) / 2))'} disabled={!isValid} onClick={handleUpdate} variant="gradient" gradient={gradient}>Save</Button>
			</Group>
		</Stack>
	);
}
