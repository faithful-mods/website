'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';

import { HiDownload } from 'react-icons/hi';
import { IoExtensionPuzzleOutline } from 'react-icons/io5';
import { LuFilter } from 'react-icons/lu';
import { SiMojangstudios } from 'react-icons/si';
import { TfiWorld } from 'react-icons/tfi';

import { ActionIcon, Badge, Button, Checkbox, Group, MultiSelect, Pagination, Radio, Select, Stack, Text, TextInput } from '@mantine/core';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { usePrevious } from '~/hooks/use-previous';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET, ITEMS_PER_PAGE, MODS_LOADERS } from '~/lib/constants';
import { gradientDanger, searchFilter, sortByName, sortBySemver } from '~/lib/utils';
import { getModsWithVersions } from '~/server/data/mods';
import { getSupportedMinecraftVersions } from '~/server/data/mods-version';

import type { Mod } from '@prisma/client';
import type { ModLoaders } from '~/lib/constants';
import type { Writable } from '~/types';

import './mods.scss';
import '~/lib/polyfills';

type ModWithVersions = Mod & { versions: string[] };

export default function Mods() {
	const [windowWidth] = useDeviceSize();

	const [activePage, setActivePage] = useState(1);
	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);

	const [mods, setMods] = useState<ModWithVersions[]>([]);
	const [modsShown, setModsShown] = useState<ModWithVersions[][]>([[]]);
	const [modsShownPerPage, setModsShownPerPage] = useState<string | null>(itemsPerPage[0]);

	const [search, setSearch] = useState<string>('');
	const [filteredMods, setFilteredMods] = useState<ModWithVersions[]>([]);
	const prevSearchedMods = usePrevious(filteredMods);

	const [MCVersions, setMCVersions] = useState<string[]>([]);

	const [loaders, setLoaders] = useState<ModLoaders[]>(MODS_LOADERS as Writable<typeof MODS_LOADERS>);
	const [versions, setVersions] = useState<string[]>([]);

	const [showFilters, setShowFilters] = useState(false);

	const router = useRouter();
	const maxOptionsShown = windowWidth > BREAKPOINT_TABLET ? 2 : 1;

	useEffectOnce(() => {
		getModsWithVersions().then(setMods);
		getSupportedMinecraftVersions().then(setMCVersions);
	});

	useEffect(() => {
		let filteredMods = mods.filter((m) => (m.loaders as ModLoaders[]).some((l) => loaders.includes(l)));

		if (search) {
			filteredMods = filteredMods.filter(searchFilter(search));
		}

		if (versions.length > 0) {
			filteredMods = filteredMods.filter((m) => m.versions.some((v) => versions.includes(v)));
		}

		setFilteredMods(filteredMods.sort(sortByName));
	}, [search, versions, mods, loaders]);

	useEffect(() => {
		const chunks: ModWithVersions[][] = [];
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
			<Tile w={windowWidth <= BREAKPOINT_TABLET ? '100%' : 300}>
				<Group justify="space-between">
					<Text size="md" fw={700}>Filters</Text>
					<Badge color="teal">{filteredMods.length} mod{filteredMods.length > 1 ? 's' : ''}</Badge>
				</Group>

				<Stack gap="sm">

					<Text size="sm" fw={700}>Minecraft Version</Text>
					<MultiSelect
						data={MCVersions.toReversed()}
						onChange={setVersions}
						placeholder={versions.length > 0 ? '' : 'Choose versions...'}
						nothingFoundMessage="No versions found"
						hidePickedOptions
					/>

					<Text size="sm" fw={700}>Categories</Text>
					<Checkbox.Group>
						<Stack gap={5}>
							<Radio size="xs" label="All" disabled checked />
							<Checkbox size="xs" label="Adventure" disabled />
							<Checkbox size="xs" label="Magic" disabled />
						</Stack>
					</Checkbox.Group>

					<Text size="sm" fw={700}>Loaders</Text>
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

					<Button variant="transparent" c={gradientDanger.to}>
						Reset
					</Button>
				</Stack>
			</Tile>
		);
	};

	const details = (m: ModWithVersions) => {
		return (
			<Group
				gap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 0 : 'md'}
				justify={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'space-between' : 'start'}
				mb={windowWidth <= BREAKPOINT_MOBILE_LARGE ? -10 : 0}
			>
				{m.url && (
					<Button
						component="a"
						href={m.url}
						variant="transparent"
						leftSection={<TfiWorld />}
						p={0}
					>
						{windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'Website' : 'Mod Website'}
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
					<Text size="sm" c="dimmed">-</Text>
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
			{windowWidth > BREAKPOINT_TABLET && filter()}

			<Stack w="100%" gap="sm">
				<Tile w="100%">
					<Group align="center" gap="sm" wrap="nowrap">
						{windowWidth <= BREAKPOINT_TABLET && (
							<ActionIcon
								variant="outline"
								className="navbar-icon-fix filter-icon"
								onClick={() => setShowFilters(!showFilters)}
							>
								<LuFilter color="var(--mantine-color-text)" />
							</ActionIcon>
						)}
						<TextInput
							className="w-full"
							placeholder="Search mods..."
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
						<Select
							data={itemsPerPage}
							value={modsShownPerPage}
							onChange={setModsShownPerPage}
							withCheckIcon={false}
							w={120}
						/>
					</Group>
				</Tile>

				{windowWidth <= BREAKPOINT_TABLET && showFilters && filter()}
				{
					(windowWidth > BREAKPOINT_TABLET || (windowWidth <= BREAKPOINT_TABLET && !showFilters)) &&
					modsShown[activePage - 1] && modsShown[activePage - 1]?.map((m) => (
						<Tile
							key={m.id}
							onClick={() => router.push(`/mods/${m.id}`)}
							className="cursor-pointer mod-card"
						>
							<Stack gap="xs">
								<Group align="start" wrap="nowrap">
									<TextureImage
										src={m.image ?? './icon.png'}
										alt={m.name}
										size={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
									/>
									<Stack
										justify="space-between"
										w="100%"
										h={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '85px' : '120px'}
									>
										<Stack gap={0}>
											<Group gap={5} align="baseline">
												<Text fw={700} size="md">{m.name}</Text>
												{m.authors.length > 0 && (<Text size="xs" c="dimmed">by {m.authors.join(', ')}</Text>)}
											</Group>
											{m.description && (<Text size="sm" lineClamp={2}>{m.description}</Text>)}
											{!m.description && (<Text size="sm" c="dimmed">No description</Text>)}
										</Stack>

										{windowWidth > BREAKPOINT_MOBILE_LARGE && details(m)}
									</Stack>
								</Group>

								{windowWidth <= BREAKPOINT_MOBILE_LARGE && details(m)}
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
