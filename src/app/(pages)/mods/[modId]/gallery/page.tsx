import { Group, Select, Stack, TextInput } from '@mantine/core';

export default function ModGalleryPage() {

	return (
		<Stack gap="sm">
			<Group gap="sm" wrap="nowrap">
				<Group w="100%" gap="sm" wrap="nowrap">
					<Select
						label="Resolution"
						// data={itemsPerPage}
						// value={versionShownPerPage}
						// onChange={(e) => e ? setVersionsShownPerPage(e) : null}
						w={120}
					/>
					<Select
						label="Mod version"
						w="100%"
						maw={'calc(100% - 120px - var(--mantine-spacing-sm))'}
					// data={itemsPerPage}
					// value={versionShownPerPage}
					// onChange={(e) => e ? setVersionsShownPerPage(e) : null}
					/>
				</Group>
				<Group w="100%" gap="sm" wrap="nowrap">
					<TextInput
						w="100%"
						maw={'calc(100% - 120px - var(--mantine-spacing-sm))'}
						label="Search"
						// value={search}
						// onChange={(e) => setSearch(e.currentTarget.value)}
						placeholder="Search for a texture name..."
					/>
					<Select
						label="Results per page"
						// data={itemsPerPage}
						// value={versionShownPerPage}
						// onChange={(e) => e ? setVersionsShownPerPage(e) : null}
						withCheckIcon={false}
						w={120}
					/>
				</Group>
			</Group>
		</Stack>
	);
}
