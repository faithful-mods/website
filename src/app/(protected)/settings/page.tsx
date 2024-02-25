'use client';

import { Group } from '@mantine/core';

import { UserSettingsPanel } from './user-panel';

const SettingsPage = () => {
	return (
		<Group justify="center">
			<UserSettingsPanel />
		</Group>
	);
}
 
export default SettingsPage;