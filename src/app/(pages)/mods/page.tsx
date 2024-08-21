'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';

import { HiDownload } from 'react-icons/hi';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { LuFilter } from 'react-icons/lu';
import { SiMojangstudios } from 'react-icons/si';
import { TfiWorld } from 'react-icons/tfi';

import { ActionIcon, Button, Checkbox, Group, InputLabel, MultiSelect, Pagination, Radio, Select, Stack, Text, TextInput } from '@mantine/core';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useViewportSize } from '@mantine/hooks';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { usePrevious } from '~/hooks/use-previous';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, ITEMS_PER_PAGE, ITEMS_PER_PAGE_DEFAULT, MODS_LOADERS } from '~/lib/constants';
import { searchFilter, sortByName, sortBySemver } from '~/lib/utils';
import { getModsOfModsPage } from '~/server/data/mods';
import { getSupportedMinecraftVersions } from '~/server/data/mods-version';

import type { ModLoaders } from '~/lib/constants';
import type { ModOfModsPage } from '~/server/data/mods';
import type { Writable } from '~/types';

import './mods.scss';
import '~/lib/polyfills';

export default function Mods() {
	const { width } = useViewportSize();

	const [activePage, setActivePage] = useState(1);
	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const slice = width <= BREAKPOINT_MOBILE_LARGE ? 2 : 5;

	const [mods, setMods] = useState<ModOfModsPage[]>([]);
	const [modsShown, setModsShown] = useState<ModOfModsPage[][]>([[]]);
	const [modsShownPerPage, setModsShownPerPage] = useState<string>(ITEMS_PER_PAGE_DEFAULT);

	const [search, setSearch] = useState<string>('');
	const [filteredMods, setFilteredMods] = useState<ModOfModsPage[]>([]);
	const prevSearchedMods = usePrevious(filteredMods);

	const [MCVersions, setMCVersions] = useState<string[]>([]);

	const [loaders, setLoaders] = useState<ModLoaders[]>(MODS_LOADERS as Writable<typeof MODS_LOADERS>);
	const [versions, setVersions] = useState<string[]>([]);

	const [showFilters, setShowFilters] = useState(false);
	const [showModsNoTextures, setShowModsNoTextures] = useState(false);

	const router = useRouter();
	const maxOptionsShown = width > BREAKPOINT_TABLET ? 2 : 1;

	useEffectOnce(() => {
		getModsOfModsPage().then(setMods);
		getSupportedMinecraftVersions().then(setMCVersions);
	});

	useEffect(() => {
		let filteredMods = mods.filter((m) => (m.loaders as ModLoaders[]).some((l) => loaders.includes(l)));

		if (search) {
			filteredMods = filteredMods.filter(searchFilter(search));
		}

		if (!showModsNoTextures) {
			filteredMods = filteredMods.filter((m) => m.textures > 0);
		}

		if (versions.length > 0) {
			filteredMods = filteredMods.filter((m) => m.versions.some((v) => versions.includes(v)));
		}

		setFilteredMods(filteredMods.sort(sortByName));
	}, [search, versions, mods, loaders, showModsNoTextures]);

	useEffect(() => {
		const chunks: ModOfModsPage[][] = [];
		const int = parseInt(modsShownPerPage ?? itemsPerPage[0]);

		for (let i = 0; i < filteredMods.length; i += int) {
			chunks.push(filteredMods.slice(i, i + int));
		}

		if (!prevSearchedMods || prevSearchedMods.length !== filteredMods.length) {
			setActivePage(1);
		}

		setModsShown(chunks);
 	},
	[
		filteredMods,
		itemsPerPage,
		modsShownPerPage,
		prevSearchedMods,
		search,
		loaders,
	]);

	const editLoaders = (l: ModLoaders) => {
		const newLoaders = loaders.includes(l)
			? loaders.filter((loader) => loader !== l)
			: [...loaders, l];

		setLoaders(newLoaders);
	};

	const filter = () => {
		return (
			<Tile
				w={width <= BREAKPOINT_TABLET ? '100%' : 300}
				mt={width <= BREAKPOINT_TABLET ? 0 : 24}
				pt="xs"
			>
				<Stack gap="sm">
					<MultiSelect
						label="Minecraft Version"
						data={MCVersions.toReversed()}
						value={versions}
						onChange={setVersions}
						placeholder={versions.length > 0 ? '' : 'Choose versions...'}
						nothingFoundMessage="No versions found"
						hidePickedOptions
					/>

					<Stack gap={5}>
						<InputLabel>Categories</InputLabel>
						<Checkbox.Group>
							<Stack gap={5}>
								<Radio size="xs" label="All" disabled checked />
								<Checkbox size="xs" label="Adventure" disabled />
								<Checkbox size="xs" label="Magic" disabled />
							</Stack>
						</Checkbox.Group>
					</Stack>

					<Stack gap={5}>
						<InputLabel>Loaders</InputLabel>
						<Checkbox.Group value={loaders}>
							<Stack gap={5}>
								<Radio
									size="xs"
									label="All"
									onChange={() => void 0}
									checked={loaders.length === MODS_LOADERS.length}
									onClick={() => loaders.length === MODS_LOADERS.length ? setLoaders([]) : setLoaders(MODS_LOADERS as Writable<typeof MODS_LOADERS>)}
								/>
								{MODS_LOADERS.toSorted().map((l) => (
									<Checkbox key={l} size="xs" value={l} onChange={() => editLoaders(l)} label={l} />
								))}
							</Stack>
						</Checkbox.Group>
					</Stack>

					<Stack gap={5}>
						<InputLabel>Other</InputLabel>
						<Checkbox
							size="xs"
							label="Show mods with no textures"
							checked={showModsNoTextures}
							onChange={(e) => setShowModsNoTextures(e.target.checked)}
						/>
					</Stack>

					<Button
						variant="transparent"
						c="red"
						onClick={() => {
							setLoaders(MODS_LOADERS as Writable<typeof MODS_LOADERS>);
							setVersions([]);
							setShowModsNoTextures(false);
						}}
					>
						Reset
					</Button>
				</Stack>
			</Tile>
		);
	};

	const details = (m: ModOfModsPage) => {
		return (
			<Group
				gap={width <= BREAKPOINT_MOBILE_LARGE ? 0 : 'md'}
				justify={width <= BREAKPOINT_MOBILE_LARGE ? 'space-between' : 'start'}
				mb={width <= BREAKPOINT_MOBILE_LARGE ? -10 : 0}
			>
				{m.url && (
					<Button
						component="a"
						href={m.url}
						variant="transparent"
						leftSection={<TfiWorld />}
						p={0}
					>
						{width <= BREAKPOINT_MOBILE_LARGE ? 'Website' : 'Mod Website'}
					</Button>
				)}
				<Group gap="xs" wrap="nowrap">
					<SiMojangstudios color="var(--mantine-color-dimmed)" />
					<Text size="sm" c="dimmed">
						{m.versions.sort(sortBySemver).unique().reverse().slice(0, maxOptionsShown).join(', ')}
						{m.versions.unique().length > maxOptionsShown && ', ...'}
					</Text>
				</Group>
				<Group gap="xs" wrap="nowrap">
					<IoExtensionPuzzleOutline color="var(--mantine-color-dimmed)" />
					<Text size="sm" c="dimmed">
						{m.loaders.slice(0, maxOptionsShown).join(', ')}
						{m.loaders.length > maxOptionsShown && ', ...'}
					</Text>
				</Group>
				<Group gap="xs" wrap="nowrap" >
					<HiDownload color="var(--mantine-color-dimmed)" />
					<Text size="sm" c="dimmed">
						{Object.values(m.downloads).reduce<number>((acc, curr) => acc + (curr ?? 0), 0)}
					</Text>
				</Group>
			</Group>
		);
	};

	return (
		<Group
			gap="sm"
			pb="md"
			align="start"

			wrap="nowrap"
		>
			{width > BREAKPOINT_TABLET && filter()}

			<Stack w="100%" gap="sm">
				<Group align="end" gap="sm" wrap="nowrap">
					{width <= BREAKPOINT_TABLET && (
						<ActionIcon
							variant="default"
							className="navbar-icon-fix filter-icon"
							onClick={() => setShowFilters(!showFilters)}
						>
							<LuFilter color="var(--mantine-color-text)" />
						</ActionIcon>
					)}
					<TextInput
						w="calc(100% - 120px)"
						label="Search"
						placeholder="Search mods..."
						onChange={(e) => setSearch(e.currentTarget.value)}
					/>
					<Select
						label="Mods per page"
						data={itemsPerPage}
						value={modsShownPerPage}
						onChange={(e) => e ? setModsShownPerPage(e) : null}
						withCheckIcon={false}
						w={120}
					/>
				</Group>

				{width <= BREAKPOINT_TABLET && showFilters && filter()}

				{filteredMods.length === 0 && (
					<Group
						align="center"
						justify="center"
						h="100px"
						gap="md"
						style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
					>
						<Text c="dimmed">No results for &quot;{search}&quot;</Text>
					</Group>
				)}

				{
					(width > BREAKPOINT_TABLET || (width <= BREAKPOINT_TABLET && !showFilters)) &&
					modsShown[activePage - 1] && modsShown[activePage - 1]?.map((m) => (
						<Tile
							key={m.id}
							onClick={() => router.push(`/mods/${m.forgeId}`)}
							className="cursor-pointer mod-card"
						>
							<Stack gap="xs">
								<Group align="start" wrap="nowrap">
									<TextureImage
										solidBackground
										src={m.image ?? './icon.png'}
										alt={m.name}
										size={width <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
									/>
									<Stack
										justify="space-between"
										w="100%"
										h={width <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
									>
										<Stack gap={0}>
											<Group gap={5} align="baseline">
												<Text fw={700} size="md">{m.name}</Text>
												{m.authors.length > 0 && (
													<Text size="xs" c="dimmed">
														by {m.authors.slice(0, slice).join(', ')}
														{m.authors.length > (slice - 1) && ` and ${m.authors.length - (slice - 1)} more...`}
													</Text>
												)}
											</Group>
											{m.description && (<Text size="sm" lineClamp={2}>{m.description}</Text>)}
											{!m.description && (<Text size="sm" c="dimmed">No description</Text>)}
										</Stack>

										{width > BREAKPOINT_MOBILE_LARGE && details(m)}
									</Stack>
								</Group>

								{width <= BREAKPOINT_MOBILE_LARGE && details(m)}
							</Stack>
						</Tile>
					))}

				<Group mt="md" justify="center">
					<Pagination total={modsShown.length} value={activePage} onChange={setActivePage} />
				</Group>

			</Stack>
		</Group>
	);
}
