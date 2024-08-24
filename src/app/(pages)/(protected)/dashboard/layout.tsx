'use client';

import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/base/role-gate';
import { TabsLayout } from '~/components/base/tabs-layout';

interface Props {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
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

