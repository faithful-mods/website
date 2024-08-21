
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Group, Text, TextInput, Select, Button, Stack } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, GRADIENT } from '~/lib/constants';
import { getModsOfModsPage } from '~/server/data/mods';
import { getModVersions } from '~/server/data/mods-version';
import { getResources, linkTextureToResource } from '~/server/data/resource';

import type { Mod, ModVersion, Resource } from '@prisma/client';

interface TextureUsesLinkedPopupProps {
	onUpdate: () => void;
	textureId: number;
}

export function TextureUsesLinkedPopup({ textureId, onUpdate }: TextureUsesLinkedPopupProps) {
	const { width } = useViewportSize();

	const [mods, setMods] = useState<(Mod & { versions: string[] })[]>([]);
	const [modsVersions, setModsVersions] = useState<ModVersion[]>([]);
	const [resources, setResources] = useState<Resource[]>([]);

	const [selectedMod, setSelectedMod] = useState<string | null>(null);
	const [selectedModVersion, setSelectedModVersion] = useState<string | null>(null);
	const [selectedResource, setSelectedResource] = useState<string | null>(null);
	const [assetPath, setAssetPath] = useState<string>('');

	const [modsVersionsFiltered, setModsVersionsFiltered] = useState<ModVersion[]>([]);
	const [resourcesFiltered, setResourcesFiltered] = useState<Resource[]>([]);

	const init = async () => {
		const mods = await getModsOfModsPage();
		setMods(mods);

		const modsVersions = await getModVersions();
		setModsVersions(modsVersions);

		const resources = await getResources();
		setResources(resources);
	};

	useEffect(() => {
		if (selectedMod) {
			setModsVersionsFiltered(modsVersions.filter((mv) => mv.modId === selectedMod));
		} else {
			setModsVersionsFiltered([]);
		}

		if (selectedModVersion) {
			setResourcesFiltered(resources.filter((r) => r.modVersionId === selectedModVersion));
		} else {
			setResourcesFiltered([]);
		}
	}, [modsVersions, resources, selectedMod, selectedModVersion, selectedResource]);

	useEffectOnce(() => {
		init();
	});

	const addLinkedTexture = async () => {
		if (!selectedResource) return;

		await linkTextureToResource({
			resource: { id: selectedResource },
			texture: { id: textureId },
			assetPath,
		});

		onUpdate();
	};

	return (
		<Stack gap="sm">
			<Text size="sm" ta="justify">
				Linked textures are textures linked to the same image file.
				This allows you to have multiple uses of the same texture without duplicating the image file on the server.
				This is useful for textures that are used in multiple mods or multiple versions of the same mod or even multiple times in the same mod version.
			</Text>
			<Group gap="sm" wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'} className="w-full" align="end">
				<Select
					description={<Text c="dimmed" size="xs">Select an existing mod or <Link href="/council/mods">create a new one</Link></Text>}
					label="Mod"
					placeholder="Select a mod"
					data={mods.map((mod) => ({ value: mod.id, label: mod.name }))}
					className="w-full"
					value={selectedMod}
					onChange={(value) => setSelectedMod(value)}
				/>
				<Select
					label="Mod version"
					description={<Text c="dimmed" size="xs">Same as before, you can select an existing mod version or <Link href="/council/mods">create a new one</Link></Text>}
					placeholder="Select a mod version"
					data={modsVersionsFiltered.map((mv) => ({ value: mv.id, label: mv.version }))}
					className="w-full"
					value={selectedModVersion}
					disabled={!selectedMod}
					onChange={(value) => setSelectedModVersion(value)}
				/>
				<Select
					description="You can select a resource to link the texture or create a new one"
					label="Resource"
					placeholder="Select a resource"
					data={resourcesFiltered.map((r) => ({ value: r.id, label: r.assetFolder }))}
					className="w-full"
					value={selectedResource}
					disabled={!selectedModVersion}
					onChange={(value) => setSelectedResource(value)}
				/>
				<Button
					className="w-full"
					disabled={!selectedModVersion || true}
				>
					New Resource (SoonTM)
				</Button>
			</Group>
			<TextInput
				label="Asset path"
				description="The path from the asset folder to the texture file in the resource pack"
				placeholder="Enter the asset path"
				className="w-full"
				disabled={!selectedResource}
				value={assetPath}
				onChange={(event) => setAssetPath(event.currentTarget.value)}
			/>
			<br/>
			<Button
				variant="gradient"
				className="w-full"
				gradient={GRADIENT}
				disabled={assetPath === ''}
				onClick={() => addLinkedTexture()}
			>
				Add
			</Button>
		</Stack>
	);
}
