'use client';

import { Card, Tabs } from '@mantine/core';
import { UserRole } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';

import { RoleGate } from '~/components/role-gate';
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
				<Card
					shadow="sm"
					padding="md"
					radius="md"
					mb="sm"
					withBorder
				>
					<Tabs.List>
						<Tabs.Tab value="progression">Progression</Tabs.Tab>
						<Tabs.Tab value="users">Users</Tabs.Tab>
					</Tabs.List>
				</Card>
			</Tabs>

			{children}
		</RoleGate>
	);
};

export default DashboardPage;
