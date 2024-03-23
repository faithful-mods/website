'use client';

import { Grid, Stack } from '@mantine/core';
import { UserRole } from '@prisma/client';

import { RoleGate } from '@/components/auth/role-gate';
import { ModpacksPanel } from '@/components/dashboard/modpacks/modpacks-panel';
import { UsersPanel } from '@/components/dashboard/users/users-panel';

const AdminPage = () => {
	return (
		<RoleGate allowedRole={UserRole.ADMIN}>
			<Grid gutter="sm" grow mt="sm">
				<Grid.Col span={4}>
					<UsersPanel />
				</Grid.Col>

				<Grid.Col span={8}>
					<Stack gap="sm">
						<ModpacksPanel />
						{/* <ModsPanel /> */}
					</Stack>
				</Grid.Col>
			</Grid>
		</RoleGate>
	);
};

export default AdminPage;
