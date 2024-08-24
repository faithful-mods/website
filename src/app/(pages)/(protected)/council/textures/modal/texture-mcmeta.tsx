'use client';

import { useEffect, useMemo, useState } from 'react';

import { Carousel } from '@mantine/carousel';
import { Button, Group, JsonInput, Stack, useMantineColorScheme } from '@mantine/core';
import { Texture as TextureComponent, useAnimation } from 'react-minecraft';

import { FakeInputDescription, FakeInputLabel } from '~/components/base/fake-input-label';
import { GRADIENT, GRADIENT_DANGER } from '~/lib/constants';
import { updateMCMETA } from '~/server/data/texture';

import type { Texture } from '@prisma/client';
import type { MCMeta, TextureMCMeta } from 'react-minecraft';

export interface TextureUsesProps {
	texture: Texture;
	onUpdate: (mcmeta: TextureMCMeta | null) => void;
}

export function TextureMCMetaEdition({ texture, onUpdate }: TextureUsesProps) {
	const [mcmeta, setMCMETA] = useState<TextureMCMeta | null>(texture.mcmeta);
	const [mcmetaString, setMCMETAString] = useState<string>(JSON.stringify(mcmeta, null, 2));
	const [isValid, setValid] = useState(false);

	const { sprites } = useAnimation({ src: texture.filepath, mcmeta: mcmeta ?? {} });
	const { colorScheme } = useMantineColorScheme();

	// to get the tick to pause the animation for each frame
	const timedSprites = useMemo(() => {
		const res = sprites.reduce<Array<MCMeta.AnimationFrame & { tick: number }>>((acc, sprite) => {
			const prevFrame = acc[acc.length - 1];
			const tick = prevFrame ? sprite.time + prevFrame.tick : sprite.time;

			acc.push({
				...sprite,
				tick,
			});

			return acc;
		}, []);

		return res;
	}, [sprites]);

	useEffect(() => {
		try {
			const parsed = JSON.parse(mcmetaString);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw '';
			if (!Object.keys(parsed).includes('animation')) throw '';

			setValid(true);
			setMCMETA(parsed);
		} catch {
			setValid(false);
		}

	}, [mcmetaString]);

	const handleUpdate = () => {
		if (!isValid) return;

		updateMCMETA(texture.id, mcmeta ?? undefined)
			.then(() => onUpdate(mcmeta));
	};

	const handleDelete = () => {
		setMCMETA(null);
		updateMCMETA(texture.id, undefined)
			.then(() => onUpdate(null));
	};

	return (
		<Stack mt="md">
			<Stack
				gap="sm"
				align="start"
			>
				{mcmeta && (
					<FakeInputLabel label="Frames" style={{ width: '100%' }}>
						<Carousel
							slideGap="sm"
							slideSize={200}
							align="start"
							withControls={false}
							dragFree
						>
							{timedSprites.map((sprite, index) => (
								<Carousel.Slide key={index}>
									<Stack align="left" gap={5}>
										<TextureComponent
											src={texture.filepath}
											size={200}
											animation={{
												mcmeta: { animation: mcmeta.animation! },
												paused: sprite.tick,
											}}
											background={{
												url: colorScheme === 'dark' ? '/transparent.png' : '/transparent_light.png',
											}}
										/>
										<FakeInputDescription
											style={{ paddingLeft: 5 }}
											description={`Duration: ${sprite.time} tick`}
										/>
									</Stack>
								</Carousel.Slide>
							))}
						</Carousel>
					</FakeInputLabel>
				)}

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
