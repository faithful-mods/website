'use client';

import { Card, Tabs } from '@mantine/core';
import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/auth/role-gate';
import { ModpacksPanel } from '~/components/dashboard/modpacks/modpacks-panel';
import { ModsPanel } from '~/components/dashboard/mods/mods-panel';
import { UsersPanel } from '~/components/dashboard/users/users-panel';
import { gradient } from '~/lib/utils';

const DashboardPage = () => {
	return (
		<RoleGate allowedRole={UserRole.ADMIN}>
			<Tabs defaultValue="1" variant="pills" color={gradient.to} >
				<Card
					shadow="sm" 
					padding="md" 
					radius="md"
					mb="sm"
					withBorder
				>
					<Tabs.List>
						<Tabs.Tab value="1">Modpacks</Tabs.Tab>
						<Tabs.Tab value="2">Mods</Tabs.Tab>
						<Tabs.Tab value="3">Users</Tabs.Tab>
					</Tabs.List>
				</Card>

				<Tabs.Panel value="1"><ModpacksPanel /></Tabs.Panel>
				<Tabs.Panel value="2"><ModsPanel /></Tabs.Panel>
				<Tabs.Panel value="3"><UsersPanel /></Tabs.Panel>
			</Tabs>
		</RoleGate>
	);
};

export default DashboardPage;
