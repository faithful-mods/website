'use client';

import { Tabs } from '@mantine/core';
import { UserRole } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';

import { RoleGate } from '~/components/role-gate';
import { Tile } from '~/components/tile';
import { gradient } from '~/lib/utils';

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const DashboardPage = ({ children }: ProtectedLayoutProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const tab = pathname.split('/').pop() || 'modpacks';

	return (
		<RoleGate allowedRoles={[UserRole.ADMIN]}>
			<Tabs
				defaultValue="1"
				variant="pills"
				color={gradient.to}
				value={tab}
				onChange={(value) => router.push(`${pathname.replace(tab, '')}${value}`)}
			>
				<Tile mb="sm">
					<Tabs.List>
						<Tabs.Tab value="users">Users</Tabs.Tab>
					</Tabs.List>
				</Tile>
			</Tabs>

			{children}
		</RoleGate>
	);
};

export default DashboardPage;
