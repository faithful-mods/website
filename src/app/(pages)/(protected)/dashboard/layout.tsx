'use client';

import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/role-gate';
import { TabsLayout } from '~/components/tabs';

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const DashboardPage = ({ children }: ProtectedLayoutProps) => {
	const tabs = [
		{ value: 'users', label: 'Users' },
	];

	return (
		<RoleGate allowedRoles={[UserRole.ADMIN]}>
			<TabsLayout
				tabs={tabs}
				defaultValue="users"
			>
				{children}
			</TabsLayout>
		</RoleGate>
	);
};

export default DashboardPage;
