'use client';

import { Grid } from '@mantine/core';

import { UserSettingsPanel } from '~/components/settings/user-panel';

const SettingsPage = () => {
	return (
		<Grid gutter="sm" grow mt="sm">
			<Grid.Col span={4}>
			</Grid.Col>

			<Grid.Col span={4}>
				<UserSettingsPanel />
			</Grid.Col>

			<Grid.Col span={4}>
			</Grid.Col>
		</Grid>
	);
}
 
export default SettingsPage;